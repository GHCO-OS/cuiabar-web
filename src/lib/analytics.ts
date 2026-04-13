declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export const GOOGLE_ADS_ID = 'AW-11311363070';
export const GOOGLE_TAG_ID = 'GT-5528H7SD';
export const META_PIXEL_ID = '1385099743118536';
const ATTRIBUTION_QUERY_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'fbclid', 'gclid', 'wbraid', 'gbraid'] as const;
const ATTRIBUTION_COOKIE_NAME = 'cuiabar_attribution';
const ATTRIBUTION_COOKIE_KEYS = [...ATTRIBUTION_QUERY_KEYS, 'fbp', 'fbc'] as const;

type AnalyticsParams = Record<string, string | number | boolean | undefined>;
export type AttributionSnapshot = Record<string, string | undefined>;
type MetaEventPayload = {
  eventName: string;
  eventId: string;
  customData?: AnalyticsParams;
  userData?: Record<string, string | undefined>;
  testEventCode?: string;
};

const isBrowser = () => typeof window !== 'undefined';

const getCookie = (name: string) => {
  if (!isBrowser()) {
    return undefined;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));

  return match ? decodeURIComponent(match[1]) : undefined;
};

const resolveCookieDomain = () => {
  if (!isBrowser()) {
    return undefined;
  }

  const hostname = window.location.hostname.toLowerCase().replace(/^www\./, '');

  if (hostname === 'cuiabar.com' || hostname.endsWith('.cuiabar.com')) {
    return '.cuiabar.com';
  }

  return undefined;
};

const setCookie = (name: string, value: string, days: number) => {
  if (!isBrowser()) {
    return;
  }

  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const domain = resolveCookieDomain();
  const domainPart = domain ? `; Domain=${domain}` : '';

  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Expires=${expires}; SameSite=Lax${secure}${domainPart}`;
};

const readStoredAttributionParams = () => {
  const raw = getCookie(ATTRIBUTION_COOKIE_NAME);

  if (!raw) {
    return {};
  }

  const params = new URLSearchParams(raw);
  const attributionParams: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    if (value) {
      attributionParams[key] = value;
    }
  }

  return attributionParams;
};

const getFbc = () => {
  const cookieValue = getCookie('_fbc');

  if (cookieValue) {
    return cookieValue;
  }

  if (!isBrowser()) {
    return undefined;
  }

  const fbclid = new URLSearchParams(window.location.search).get('fbclid');

  if (!fbclid) {
    return undefined;
  }

  return `fb.1.${Date.now()}.${fbclid}`;
};

const createEventId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const getPageContextParams = () => {
  if (!isBrowser()) {
    return {};
  }

  return {
    page_path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    page_location: window.location.href,
    page_title: document.title,
  };
};

const buildTrackingParams = (params: AnalyticsParams = {}) => {
  persistAttributionParams();

  return {
    ...getPageContextParams(),
    ...getAttributionParams(),
    ...params,
  };
};

const getAttributionParams = () => {
  if (!isBrowser()) {
    return {};
  }

  const storedAttributionParams = readStoredAttributionParams();
  const searchParams = new URLSearchParams(window.location.search);
  const attributionParams: Record<string, string> = { ...storedAttributionParams };

  for (const key of ATTRIBUTION_QUERY_KEYS) {
    const value = searchParams.get(key);

    if (value) {
      attributionParams[key] = value;
    }
  }

  const fbp = getCookie('_fbp');
  const fbc = getFbc();

  if (fbp) {
    attributionParams.fbp = fbp;
  } else if (storedAttributionParams.fbp) {
    attributionParams.fbp = storedAttributionParams.fbp;
  }

  if (fbc) {
    attributionParams.fbc = fbc;
  } else if (storedAttributionParams.fbc) {
    attributionParams.fbc = storedAttributionParams.fbc;
  }

  return attributionParams;
};

const persistAttributionParams = () => {
  if (!isBrowser()) {
    return;
  }

  const attributionParams = getAttributionParams();
  const persistableEntries = Object.entries(attributionParams).filter(
    ([key, value]) => value && ATTRIBUTION_COOKIE_KEYS.includes(key as (typeof ATTRIBUTION_COOKIE_KEYS)[number]),
  );

  if (persistableEntries.length === 0) {
    return;
  }

  setCookie(ATTRIBUTION_COOKIE_NAME, new URLSearchParams(persistableEntries).toString(), 90);
};

export const getAttributionSnapshot = (): AttributionSnapshot => {
  if (!isBrowser()) {
    return {};
  }

  persistAttributionParams();

  return {
    ...getAttributionParams(),
    page_path: `${window.location.pathname}${window.location.search}`,
    page_location: window.location.href,
    referrer: document.referrer || undefined,
  };
};

const getMetaConversionsEndpoint = () => {
  if (!isBrowser()) {
    return '/api/meta-conversions';
  }

  const hostname = window.location.hostname.toLowerCase().replace(/^www\./, '');

  if (hostname === 'cuiabar.com') {
    return '/api/meta-conversions';
  }

  if (hostname.endsWith('.cuiabar.com')) {
    return 'https://cuiabar.com/api/meta-conversions';
  }

  return '/api/meta-conversions';
};

export const decorateOutboundUrl = (href: string, overrides: AnalyticsParams = {}) => {
  if (!isBrowser()) {
    return href;
  }

  let url: URL;

  try {
    url = new URL(href, window.location.origin);
  } catch {
    return href;
  }

  const normalizedHostname = url.hostname.replace(/^www\./, '');
  const isTrackedDestination =
    normalizedHostname === 'reservas.cuiabar.com' ||
    normalizedHostname.includes('expresso.cuiabar.com') ||
    normalizedHostname.includes('ifood.com.br') ||
    normalizedHostname.includes('99app.com') ||
    normalizedHostname === 'wa.me';

  if (!isTrackedDestination) {
    return url.toString();
  }

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const contentLabel =
    typeof overrides.content_name === 'string' && overrides.content_name.trim()
      ? overrides.content_name.trim()
      : currentPath;

  const defaultParams: Record<string, string> = {
    utm_source: 'cuiabar-site',
    utm_medium:
      normalizedHostname === 'wa.me' ? 'contact' : normalizedHostname === 'reservas.cuiabar.com' ? 'owned-cross-domain' : 'referral',
    utm_campaign:
      normalizedHostname === 'reservas.cuiabar.com'
        ? 'reserva-online'
        : normalizedHostname.includes('expresso.cuiabar.com')
          ? 'pedido-direto'
          : 'site-navigation',
    utm_content: contentLabel,
    ref_page: currentPath,
    ref_host: window.location.hostname,
  };

  persistAttributionParams();

  for (const [key, value] of Object.entries({ ...defaultParams, ...getAttributionParams(), ...overrides })) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
};

const sendMetaServerEvent = ({ eventName, eventId, customData, userData, testEventCode }: MetaEventPayload) => {
  if (!isBrowser()) {
    return;
  }

  const endpoint = getMetaConversionsEndpoint();
  const payload = {
    event_name: eventName,
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: window.location.href,
    source: 'site_tracker',
    user_data: {
      fbp: getCookie('_fbp'),
      fbc: getFbc(),
      ...userData,
    },
    custom_data: customData,
    test_event_code: testEventCode,
  };

  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });

    navigator.sendBeacon(endpoint, blob);
    return;
  }

  void fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body,
    credentials: 'same-origin',
    keepalive: true,
  }).catch(() => undefined);
};

export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (!isBrowser()) {
    return;
  }

  persistAttributionParams();

  const eventId = createEventId();

  const params = {
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href,
    ...getAttributionParams(),
  };

  window.gtag?.('event', 'page_view', params);
  window.fbq?.('track', 'PageView', undefined, { eventID: eventId });
  sendMetaServerEvent({
    eventName: 'PageView',
    eventId,
    customData: params,
  });
};

export const trackEvent = (eventName: string, params: AnalyticsParams = {}) => {
  if (!isBrowser()) {
    return;
  }

  persistAttributionParams();

  const eventId = createEventId();
  const eventParams = buildTrackingParams(params);

  window.gtag?.('event', eventName, eventParams);
  window.fbq?.('trackCustom', eventName, eventParams, { eventID: eventId });
  sendMetaServerEvent({
    eventName,
    eventId,
    customData: eventParams,
  });
};

export const trackLead = (source: string, params: AnalyticsParams = {}) => {
  if (!isBrowser()) {
    return;
  }

  persistAttributionParams();

  const eventId = createEventId();

  const leadParams = buildTrackingParams({
    lead_source: source,
    ...params,
  });

  window.gtag?.('event', 'generate_lead', leadParams);
  window.fbq?.('track', 'Lead', leadParams, { eventID: eventId });
  sendMetaServerEvent({
    eventName: 'Lead',
    eventId,
    customData: leadParams,
  });
};

export const trackContact = (channel: string, params: AnalyticsParams = {}) => {
  if (!isBrowser()) {
    return;
  }

  persistAttributionParams();

  const eventId = createEventId();

  const contactParams = buildTrackingParams({
    contact_channel: channel,
    ...params,
  });

  window.gtag?.('event', 'contact', contactParams);
  window.fbq?.('track', 'Contact', contactParams, { eventID: eventId });
  sendMetaServerEvent({
    eventName: 'Contact',
    eventId,
    customData: contactParams,
  });
};

export const trackViewContent = (contentName: string, params: AnalyticsParams = {}) => {
  if (!isBrowser()) {
    return;
  }

  persistAttributionParams();

  const eventId = createEventId();
  const contentParams = buildTrackingParams({
    content_name: contentName,
    ...params,
  });

  window.gtag?.('event', 'view_item', contentParams);
  window.fbq?.('track', 'ViewContent', contentParams, { eventID: eventId });
  sendMetaServerEvent({
    eventName: 'ViewContent',
    eventId,
    customData: contentParams,
  });
};

export const trackInitiateCheckout = (channel: string, params: AnalyticsParams = {}) => {
  if (!isBrowser()) {
    return;
  }

  persistAttributionParams();

  const eventId = createEventId();
  const checkoutParams = buildTrackingParams({
    checkout_channel: channel,
    ...params,
  });

  window.gtag?.('event', 'begin_checkout', checkoutParams);
  window.fbq?.('track', 'InitiateCheckout', checkoutParams, { eventID: eventId });
  sendMetaServerEvent({
    eventName: 'InitiateCheckout',
    eventId,
    customData: checkoutParams,
  });
};
