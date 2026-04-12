import { Hono } from 'hono';
import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { all, asJson, first, nowIso, parseBoolean, parseJsonText, parseNumber, run } from './lib/db';
import { csvResponse, getRequestIp, HttpError, isMutationMethod, jsonError, requireJsonBody } from './lib/http';
import { applyMergeTags, extractHrefLinks, extractMergeVariables, prepareTemplateContent, replaceHtmlLinks, replaceTextLinks } from './lib/template';
import { ensureEmail, generateId, hashPassword, normalizeEmail, randomToken, requireStrongPassword, verifyPassword } from './lib/security';
import { sendViaGmail } from './services/gmail/gmailSender';
import { isGoogleAdsConfigured } from './services/google/googleAdsAuth';
import { fetchGoogleAdsCampaignMetrics, getGoogleAdsCustomerSummary, listGoogleAdsAccessibleCustomers, uploadGoogleAdsClickConversion } from './services/google/googleAdsService';
import { verifyGoogleIdToken } from './services/google/verifyIdToken';
import { fetchMetaCampaignMetrics, fetchMetaLeadAds, forwardMetaEvent, getMetaPixelId, getMetaPixelSummary, isMetaConfigured, isMetaGraphConfigured } from './services/meta/metaConversions';
import { isZohoConfigured } from './services/zoho/zohoAuth';
import { upsertZohoContact } from './services/zoho/zohoContacts';
import { getZohoOrganization } from './services/zoho/zohoCrm';
import { registerReservationRoutes } from './reservations/routes';
import { publishScheduledBlogPosts, registerBlogRoutes } from './blog/routes';
import type { AppVariables, AuthUser, CampaignRecord, ContactRecord, Env, RoleName, SessionRecord, TemplateRecord } from './types';

type AppContext = Context<{ Bindings: Env; Variables: AppVariables }>;

type Permission =
  | 'dashboard:read'
  | 'users:manage'
  | 'contacts:read'
  | 'contacts:write'
  | 'lists:read'
  | 'lists:write'
  | 'segments:read'
  | 'segments:write'
  | 'templates:manage'
  | 'campaigns:read'
  | 'campaigns:write'
  | 'campaigns:send'
  | 'reports:read'
  | 'audit:read'
  | 'settings:manage';

type SegmentRule = {
  field: string;
  operator?: string;
  value?: string | number | boolean | string[] | null;
};

type SegmentDefinition = {
  match?: 'all' | 'any';
  conditions?: SegmentRule[];
};

type ContactDto = ReturnType<typeof mapContact>;

type RecipientRecord = {
  id: string;
  campaign_id: string;
  contact_id: string;
  email_snapshot: string;
  first_name_snapshot: string | null;
  last_name_snapshot: string | null;
  personalization_json: string;
  tracking_token: string;
  unsubscribe_token: string;
  provider_message_id: string | null;
  status: string;
  last_error: string | null;
  send_attempts: number;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  unsubscribed_at: string | null;
  bounce_at: string | null;
  created_at: string;
  updated_at: string;
};

type CampaignLinkRecord = {
  id: string;
  campaign_id: string;
  original_url: string;
  tracking_path: string;
  url_hash: string;
  link_label: string | null;
  click_count_total: number;
  click_count_unique: number;
  created_at: string;
};

type GmailOAuthConnection = {
  email?: string;
  refreshToken?: string;
  scope?: string | null;
  grantedAt?: string | null;
  source?: 'panel_oauth' | 'cloudflare_secret';
};

type GoogleBusinessOAuthConnection = {
  email?: string;
  refreshToken?: string;
  scope?: string | null;
  grantedAt?: string | null;
  source?: 'panel_oauth' | 'cloudflare_secret';
};

type ContactProviderLinkRecord = {
  id: string;
  contact_id: string;
  provider: string;
  provider_module: string;
  external_id: string;
  sync_status: string;
  last_synced_at: string | null;
  last_error: string | null;
  metadata_json: string;
  created_at: string;
  updated_at: string;
};

type ContactListRow = ContactRecord & {
  zoho_external_id?: string | null;
  zoho_sync_status?: string | null;
  zoho_last_synced_at?: string | null;
  zoho_last_error?: string | null;
};

type PublicInteractionPayload = {
  event_name?: string;
  event_id?: string;
  event_time?: number;
  action_source?: string;
  event_source_url?: string;
  user_data?: Record<string, string | undefined>;
  custom_data?: Record<string, unknown>;
  source?: string;
};

type MetaConnectorSettings = {
  adAccountId?: string | null;
  leadFormIds?: string[];
  lookbackDays?: number;
  autoCreateContacts?: boolean;
};

type GoogleAdsConnectorSettings = {
  customerId?: string | null;
  loginCustomerId?: string | null;
  conversionAction?: string | null;
  lookbackDays?: number;
  autoUploadLeadConversions?: boolean;
  conversionValue?: number;
  currencyCode?: string | null;
};

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;
const GMAIL_OAUTH_STATE_COOKIE_NAME = 'cuiabar_gmail_oauth_state';
const GOOGLE_BUSINESS_OAUTH_STATE_COOKIE_NAME = 'cuiabar_google_business_oauth_state';
const RESERVED_TEMPLATE_VARIABLES = ['first_name', 'last_name', 'email', 'unsubscribe_url', 'campaign_name', 'reply_to'];
const DEFAULT_IFOOD_STORE_URL =
  'https://www.ifood.com.br/delivery/campinas-sp/villa-cuiabar--executivos--pratos-do-dia-jardim-aurelia/1af0e396-a7c8-46e1-b1a5-dd06486bb4ad';
const DEFAULT_99FOOD_STORE_URL = 'https://oia.99app.com/dlp9/C94oJv?area=BR';
const DEFAULT_META_LOOKBACK_DAYS = 30;
const DEFAULT_GOOGLE_ADS_LOOKBACK_DAYS = 30;
const TRANSPARENT_GIF_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const PERMISSIONS: Record<RoleName, Permission[]> = {
  gerente: [
    'dashboard:read',
    'users:manage',
    'contacts:read',
    'contacts:write',
    'lists:read',
    'lists:write',
    'segments:read',
    'segments:write',
    'templates:manage',
    'campaigns:read',
    'campaigns:write',
    'campaigns:send',
    'reports:read',
    'audit:read',
    'settings:manage',
  ],
  operador_marketing: ['dashboard:read', 'contacts:read', 'lists:read', 'segments:read', 'templates:manage', 'campaigns:read', 'campaigns:write', 'reports:read'],
};

const mapContact = (row: ContactListRow, zohoConfigured = true) => ({
  id: row.id,
  email: row.email,
  firstName: row.first_name ?? '',
  lastName: row.last_name ?? '',
  phone: row.phone ?? '',
  source: row.source ?? '',
  tags: parseJsonText<string[]>(row.tags_json, []),
  status: row.status,
  optInStatus: row.opt_in_status,
  unsubscribedAt: row.unsubscribed_at,
  lastSentAt: row.last_sent_at,
  lastClickedAt: row.last_clicked_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  zoho: {
    externalId: row.zoho_sync_status === 'error' && row.zoho_external_id?.startsWith('pending_') ? null : row.zoho_external_id ?? null,
    status: row.zoho_external_id
      ? row.zoho_sync_status === 'error'
        ? 'error'
        : 'synced'
      : zohoConfigured
        ? 'pending'
        : 'not_configured',
    lastSyncedAt: row.zoho_last_synced_at ?? null,
    lastError: row.zoho_last_error ?? null,
  },
});

const parseAudienceFilter = (queryValue: string | null) => (queryValue ? queryValue.trim() : '');

const buildCsv = (headers: string[], rows: Array<Array<string | number | null | undefined>>) => {
  const escape = (value: string | number | null | undefined) => {
    const normalized = value == null ? '' : String(value);
    if (/[",\n]/.test(normalized)) {
      return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
  };

  return [headers.join(','), ...rows.map((row) => row.map((value) => escape(value)).join(','))].join('\n');
};

const hasPermission = (user: AuthUser | null, permission: Permission) => {
  if (!user) {
    return false;
  }

  const granted = new Set<Permission>();
  for (const role of user.roles) {
    for (const grantedPermission of PERMISSIONS[role]) {
      granted.add(grantedPermission);
    }
  }

  return granted.has(permission);
};

const requirePermission = (c: AppContext, permission: Permission) => {
  const user = c.get('user');
  if (!user) {
    throw new HttpError(401, 'Sessao expirada. Entre novamente.');
  }
  if (!hasPermission(user, permission)) {
    throw new HttpError(403, 'Voce nao tem permissao para esta acao.');
  }
  return user;
};

const readSetting = async <T>(env: Env, key: string, fallback: T) => {
  const setting = await first<{ value_json: string }>(env.DB.prepare('SELECT value_json FROM app_settings WHERE key = ?').bind(key));
  return setting ? parseJsonText<T>(setting.value_json, fallback) : fallback;
};

const writeSetting = async (env: Env, key: string, value: unknown, userId?: string | null) => {
  await run(
    env.DB.prepare(
      `INSERT INTO app_settings (key, value_json, updated_by_user_id, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_by_user_id = excluded.updated_by_user_id, updated_at = excluded.updated_at`,
    ).bind(key, asJson(value), userId ?? null, nowIso()),
  );
};

const normalizeStringList = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter(Boolean)
    : [];

const readMetaConnectorSettings = async (env: Env) => {
  const stored = await readSetting<MetaConnectorSettings>(env, 'meta_connector', {});
  return {
    adAccountId: stored.adAccountId?.trim() || env.META_AD_ACCOUNT_ID?.trim() || null,
    leadFormIds: normalizeStringList(stored.leadFormIds).length > 0 ? normalizeStringList(stored.leadFormIds) : normalizeStringList(env.META_LEAD_FORM_IDS?.split(',') ?? []),
    lookbackDays: Math.max(1, Number(stored.lookbackDays) || DEFAULT_META_LOOKBACK_DAYS),
    autoCreateContacts: stored.autoCreateContacts !== false,
  } satisfies MetaConnectorSettings;
};

const readGoogleAdsConnectorSettings = async (env: Env) => {
  const stored = await readSetting<GoogleAdsConnectorSettings>(env, 'google_ads_connector', {});
  return {
    customerId: stored.customerId?.trim() || env.GOOGLE_ADS_CUSTOMER_ID?.trim() || null,
    loginCustomerId: stored.loginCustomerId?.trim() || env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.trim() || null,
    conversionAction: stored.conversionAction?.trim() || env.GOOGLE_ADS_CONVERSION_ACTION?.trim() || null,
    lookbackDays: Math.max(1, Number(stored.lookbackDays) || DEFAULT_GOOGLE_ADS_LOOKBACK_DAYS),
    autoUploadLeadConversions: stored.autoUploadLeadConversions !== false,
    conversionValue: Number.isFinite(Number(stored.conversionValue)) ? Number(stored.conversionValue) : 1,
    currencyCode: stored.currencyCode?.trim() || 'BRL',
  } satisfies GoogleAdsConnectorSettings;
};

const isOpenTrackingEnabled = async (env: Env) => {
  const deliverability = await readSetting(env, 'deliverability', {
    openTrackingEnabled: true,
  });

  if (typeof deliverability.openTrackingEnabled === 'boolean') {
    return deliverability.openTrackingEnabled;
  }

  return parseBoolean(env.ENABLE_OPEN_TRACKING, true);
};

const readGmailOAuthConnection = async (env: Env) => {
  const primary = await readSetting<GmailOAuthConnection | null>(env, 'gmail_oauth_connection', null);
  if (primary?.refreshToken) {
    return primary;
  }

  const legacy = await readSetting<GmailOAuthConnection | null>(env, 'gmail_oauth_pending', null);
  return legacy?.refreshToken ? legacy : null;
};

const storeGmailOAuthConnection = async (env: Env, connection: GmailOAuthConnection) => {
  await writeSetting(env, 'gmail_oauth_connection', connection, null);
  await writeSetting(env, 'gmail_oauth_pending', connection, null);
};

const readGoogleBusinessOAuthConnection = async (env: Env) => {
  const primary = await readSetting<GoogleBusinessOAuthConnection | null>(env, 'google_business_oauth_connection', null);
  if (primary?.refreshToken) {
    return primary;
  }

  const legacy = await readSetting<GoogleBusinessOAuthConnection | null>(env, 'google_business_oauth_pending', null);
  return legacy?.refreshToken ? legacy : null;
};

const storeGoogleBusinessOAuthConnection = async (env: Env, connection: GoogleBusinessOAuthConnection) => {
  await writeSetting(env, 'google_business_oauth_connection', connection, null);
  await writeSetting(env, 'google_business_oauth_pending', connection, null);
};

const googleBusinessOauthSetupHtml = (env: Env) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Google Business Profile OAuth</title>
    <style>
      body{font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#f6f0e8;color:#20140f;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
      .card{max-width:760px;background:#fff;padding:32px;border-radius:28px;box-shadow:0 28px 80px rgba(32,20,15,.12)}
      .pill{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:#fff3eb;color:#9b3f21;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
      h1{margin:18px 0 12px;font-size:clamp(28px,4vw,42px)}
      p{line-height:1.65}
      code{font-family:ui-monospace,SFMono-Regular,monospace;background:#fff6ef;padding:2px 6px;border-radius:8px}
      .button{display:inline-flex;align-items:center;justify-content:center;padding:14px 20px;border-radius:16px;background:#9b3f21;color:#fff;text-decoration:none;font-weight:700}
      .muted{color:#6b5a51}
    </style>
  </head>
  <body>
    <main class="card">
      <span class="pill">google business profile</span>
      <h1>Autorizar o Perfil da Empresa</h1>
      <p>Use a conta Google que já gerencia o perfil do Cuiabar. O fluxo vai solicitar permissão e gravar o <code>refresh token</code> no CRM para futuras automações.</p>
      <p><strong>Redirect URI configurada no Google Cloud:</strong> <code>${env.APP_BASE_URL}/api/google/business/callback</code></p>
      <p class="muted">Se esta URI não for a mesma cadastrada no OAuth Client, o Google recusará a autorização.</p>
      <a class="button" href="/oauth/google-business/start">Autorizar Google Business Profile</a>
    </main>
  </body>
</html>`;

const auditLog = async (
  env: Env,
  request: Request,
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
) => {
  await run(
    env.DB.prepare(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, metadata_json, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      generateId('audit'),
      userId,
      action,
      entityType,
      entityId,
      asJson(metadata),
      getRequestIp(request),
      request.headers.get('user-agent'),
      nowIso(),
    ),
  );
};

const startConnectorSyncRun = async (env: Env, provider: string, syncType: string, accountId?: string | null) => {
  const id = generateId('sync');
  await run(
    env.DB.prepare(
      `INSERT INTO ad_platform_sync_runs (id, provider, sync_type, status, account_id, summary_json, started_at, created_at)
       VALUES (?, ?, ?, 'running', ?, '{}', ?, ?)`,
    ).bind(id, provider, syncType, accountId ?? null, nowIso(), nowIso()),
  );
  return id;
};

const finishConnectorSyncRun = async (
  env: Env,
  id: string,
  status: 'success' | 'error',
  summary: Record<string, unknown>,
  error?: string | null,
) => {
  await run(
    env.DB.prepare(
      `UPDATE ad_platform_sync_runs
       SET status = ?, summary_json = ?, error = ?, finished_at = ?
       WHERE id = ?`,
    ).bind(status, asJson(summary), error ?? null, nowIso(), id),
  );
};

const upsertAdPlatformAccount = async (
  env: Env,
  provider: string,
  externalAccountId: string,
  accountName: string | null,
  accountStatus: string | null,
  metadata: Record<string, unknown> = {},
  lastError: string | null = null,
) => {
  await run(
    env.DB.prepare(
      `INSERT INTO ad_platform_accounts
        (id, provider, external_account_id, account_name, account_status, metadata_json, last_synced_at, last_error, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(provider, external_account_id) DO UPDATE SET
         account_name = excluded.account_name,
         account_status = excluded.account_status,
         metadata_json = excluded.metadata_json,
         last_synced_at = excluded.last_synced_at,
         last_error = excluded.last_error,
         updated_at = excluded.updated_at`,
    ).bind(generateId('acct'), provider, externalAccountId, accountName, accountStatus, asJson(metadata), nowIso(), lastError, nowIso(), nowIso()),
  );
};

const upsertAdCampaignMetric = async (
  env: Env,
  provider: string,
  accountId: string,
  campaignId: string,
  metricDate: string,
  payload: {
    campaignName: string | null;
    campaignStatus: string | null;
    impressions: number;
    clicks: number;
    interactions: number;
    ctr: number | null;
    spendAmount: number;
    spendCurrency: string | null;
    conversions: number;
    raw: Record<string, unknown>;
  },
) => {
  await run(
    env.DB.prepare(
      `INSERT INTO ad_platform_campaign_metrics
        (id, provider, account_id, campaign_id, campaign_name, campaign_status, metric_date, impressions, clicks, interactions, ctr, spend_amount, spend_currency, conversions, raw_json, synced_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(provider, account_id, campaign_id, metric_date) DO UPDATE SET
         campaign_name = excluded.campaign_name,
         campaign_status = excluded.campaign_status,
         impressions = excluded.impressions,
         clicks = excluded.clicks,
         interactions = excluded.interactions,
         ctr = excluded.ctr,
         spend_amount = excluded.spend_amount,
         spend_currency = excluded.spend_currency,
         conversions = excluded.conversions,
         raw_json = excluded.raw_json,
         synced_at = excluded.synced_at,
         updated_at = excluded.updated_at`,
    ).bind(
      generateId('cpm'),
      provider,
      accountId,
      campaignId,
      payload.campaignName,
      payload.campaignStatus,
      metricDate,
      payload.impressions,
      payload.clicks,
      payload.interactions,
      payload.ctr,
      payload.spendAmount,
      payload.spendCurrency,
      payload.conversions,
      asJson(payload.raw),
      nowIso(),
      nowIso(),
      nowIso(),
    ),
  );
};

const recordAdLead = async (
  env: Env,
  payload: {
    provider: string;
    externalLeadId: string;
    accountId?: string | null;
    formId?: string | null;
    campaignId?: string | null;
    adsetId?: string | null;
    adId?: string | null;
    contactId?: string | null;
    email?: string | null;
    phone?: string | null;
    fullName?: string | null;
    leadCreatedAt?: string | null;
    syncedToContact?: boolean;
    raw: Record<string, unknown>;
  },
) => {
  await run(
    env.DB.prepare(
      `INSERT INTO ad_platform_leads
        (id, provider, external_lead_id, account_id, form_id, campaign_id, adset_id, ad_id, contact_id, email, phone, full_name, lead_created_at, payload_json, synced_to_contact, synced_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(provider, external_lead_id) DO UPDATE SET
         account_id = excluded.account_id,
         form_id = excluded.form_id,
         campaign_id = excluded.campaign_id,
         adset_id = excluded.adset_id,
         ad_id = excluded.ad_id,
         contact_id = COALESCE(excluded.contact_id, ad_platform_leads.contact_id),
         email = COALESCE(excluded.email, ad_platform_leads.email),
         phone = COALESCE(excluded.phone, ad_platform_leads.phone),
         full_name = COALESCE(excluded.full_name, ad_platform_leads.full_name),
         lead_created_at = COALESCE(excluded.lead_created_at, ad_platform_leads.lead_created_at),
         payload_json = excluded.payload_json,
         synced_to_contact = excluded.synced_to_contact,
         synced_at = excluded.synced_at,
         updated_at = excluded.updated_at`,
    ).bind(
      generateId('lead'),
      payload.provider,
      payload.externalLeadId,
      payload.accountId ?? null,
      payload.formId ?? null,
      payload.campaignId ?? null,
      payload.adsetId ?? null,
      payload.adId ?? null,
      payload.contactId ?? null,
      payload.email ?? null,
      payload.phone ?? null,
      payload.fullName ?? null,
      payload.leadCreatedAt ?? null,
      asJson(payload.raw),
      payload.syncedToContact ? 1 : 0,
      payload.syncedToContact ? nowIso() : null,
      nowIso(),
      nowIso(),
    ),
  );
};

const recordConversionUpload = async (
  env: Env,
  payload: {
    provider: string;
    contactId?: string | null;
    externalClickId?: string | null;
    clickIdType?: string | null;
    conversionKey?: string | null;
    conversionLabel?: string | null;
    conversionTime?: string | null;
    conversionValue?: number | null;
    currencyCode?: string | null;
    status: 'success' | 'error' | 'skipped';
    providerResponse?: Record<string, unknown>;
    error?: string | null;
  },
) => {
  await run(
    env.DB.prepare(
      `INSERT INTO ad_platform_conversion_uploads
        (id, provider, contact_id, external_click_id, click_id_type, conversion_key, conversion_label, conversion_time, conversion_value, currency_code, status, provider_response_json, error, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      generateId('cnv'),
      payload.provider,
      payload.contactId ?? null,
      payload.externalClickId ?? null,
      payload.clickIdType ?? null,
      payload.conversionKey ?? null,
      payload.conversionLabel ?? null,
      payload.conversionTime ?? null,
      payload.conversionValue ?? null,
      payload.currencyCode ?? null,
      payload.status,
      asJson(payload.providerResponse ?? {}),
      payload.error ?? null,
      nowIso(),
      nowIso(),
    ),
  );
};

const splitFullName = (value: string | null | undefined) => {
  const normalized = value?.trim();
  if (!normalized) {
    return { firstName: null, lastName: null };
  }

  const [firstName, ...rest] = normalized.split(/\s+/);
  return {
    firstName: firstName || null,
    lastName: rest.length > 0 ? rest.join(' ') : null,
  };
};

const findContactByEmailOrPhone = async (env: Env, email?: string | null, phone?: string | null) => {
  if (email) {
    const match = await first<ContactRecord>(env.DB.prepare('SELECT * FROM contacts WHERE email = ?').bind(ensureEmail(email)));
    if (match) {
      return match;
    }
  }

  const normalizedPhone = phone?.replace(/\D+/g, '');
  if (normalizedPhone) {
    return first<ContactRecord>(env.DB.prepare("SELECT * FROM contacts WHERE REPLACE(REPLACE(REPLACE(COALESCE(phone, ''), ' ', ''), '-', ''), '(', '') LIKE ?").bind(`%${normalizedPhone}%`));
  }

  return null;
};

const upsertExternalContact = async (
  env: Env,
  payload: {
    email?: string | null;
    phone?: string | null;
    fullName?: string | null;
    source: string;
    tags?: string[];
    optInStatus?: string;
  },
) => {
  if (!payload.email && !payload.phone) {
    return null;
  }

  const { firstName, lastName } = splitFullName(payload.fullName);
  const existing = await findContactByEmailOrPhone(env, payload.email ?? null, payload.phone ?? null);
  const contactId = existing?.id ?? generateId('ctc');
  const tags = new Set<string>([...(existing ? parseJsonText<string[]>(existing.tags_json, []) : []), ...(payload.tags ?? [])].map((tag) => tag.trim()).filter(Boolean));
  const nextOptInStatus = payload.optInStatus?.trim() || existing?.opt_in_status || 'pending';
  const safeEmail = payload.email ? ensureEmail(payload.email) : existing?.email ?? null;
  const safePhone = payload.phone?.trim() || existing?.phone || null;

  if (existing) {
    await run(
      env.DB.prepare(
        `UPDATE contacts
         SET email = COALESCE(?, email),
             first_name = COALESCE(NULLIF(?, ''), first_name),
             last_name = COALESCE(NULLIF(?, ''), last_name),
             phone = COALESCE(NULLIF(?, ''), phone),
             source = COALESCE(NULLIF(?, ''), source),
             tags_json = ?,
             opt_in_status = CASE
               WHEN status IN ('unsubscribed', 'suppressed') THEN opt_in_status
               ELSE ?
             END,
             updated_at = ?
         WHERE id = ?`,
      ).bind(
        safeEmail,
        firstName || '',
        lastName || '',
        safePhone || '',
        payload.source,
        asJson([...tags]),
        nextOptInStatus,
        nowIso(),
        existing.id,
      ),
    );
  } else {
    await run(
      env.DB.prepare(
        `INSERT INTO contacts
          (id, email, first_name, last_name, phone, source, tags_json, status, opt_in_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
      ).bind(contactId, safeEmail, firstName, lastName, safePhone, payload.source, asJson([...tags]), nextOptInStatus, nowIso(), nowIso()),
    );
  }

  return first<ContactRecord>(env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(contactId));
};

const toGoogleAdsDateTime = (isoDateTime: string) => {
  const date = new Date(isoDateTime);
  const tzMinutes = -date.getTimezoneOffset();
  const sign = tzMinutes >= 0 ? '+' : '-';
  const absoluteMinutes = Math.abs(tzMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, '0');
  const minutes = String(absoluteMinutes % 60).padStart(2, '0');
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${hours}:${minutes}`;
};

const getSessionBundle = async (env: Env, sessionId: string | undefined) => {
  if (!sessionId) {
    return { user: null, session: null };
  }

  const row = await first<{
    session_id: string;
    csrf_token: string;
    expires_at: string;
    user_id: string;
    email: string;
    display_name: string;
    status: string;
    roles: string | null;
  }>(
    env.DB.prepare(
      `SELECT
        s.id AS session_id,
        s.csrf_token,
        s.expires_at,
        u.id AS user_id,
        u.email,
        u.display_name,
        u.status,
        GROUP_CONCAT(r.name) AS roles
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE s.id = ? AND s.expires_at > ?
       GROUP BY s.id, u.id`,
    ).bind(sessionId, nowIso()),
  );

  if (!row || row.status !== 'active') {
    return { user: null, session: null };
  }

  const roles = (row.roles ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean) as RoleName[];

  return {
    user: {
      id: row.user_id,
      email: row.email,
      displayName: row.display_name,
      status: row.status,
      roles,
    } satisfies AuthUser,
    session: {
      id: row.session_id,
      userId: row.user_id,
      csrfToken: row.csrf_token,
      expiresAt: row.expires_at,
    } satisfies SessionRecord,
  };
};

const requireCsrf = (c: AppContext) => {
  const session = c.get('session');
  if (!session) {
    return;
  }

  const csrfCookie = getCookie(c, c.env.CSRF_COOKIE_NAME);
  const csrfHeader = c.req.header('x-csrf-token');
  const origin = c.req.header('origin');
  const requestOrigin = new URL(c.req.url).origin;

  if (origin && origin !== requestOrigin) {
    throw new HttpError(403, 'Origem bloqueada.');
  }

  if (!csrfCookie || !csrfHeader || csrfCookie !== session.csrfToken || csrfHeader !== session.csrfToken) {
    throw new HttpError(403, 'Falha de CSRF.');
  }
};

const setSessionCookies = (c: AppContext, sessionId: string, csrfToken: string) => {
  const secure = new URL(c.req.url).protocol === 'https:';
  const expires = new Date(Date.now() + SESSION_DURATION_MS);
  setCookie(c, c.env.SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure,
    sameSite: 'Lax',
    path: '/',
    expires,
  });
  setCookie(c, c.env.CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure,
    sameSite: 'Lax',
    path: '/',
    expires,
  });
};

const clearSessionCookies = (c: AppContext) => {
  deleteCookie(c, c.env.SESSION_COOKIE_NAME, { path: '/' });
  deleteCookie(c, c.env.CSRF_COOKIE_NAME, { path: '/' });
};

const getUserCount = async (env: Env) => {
  const row = await first<{ total: number }>(env.DB.prepare('SELECT COUNT(*) AS total FROM users'));
  return row?.total ?? 0;
};

const isGoogleOnlyAuth = (env: Env) => (env.AUTH_MODE ?? '').toLowerCase() === 'google_only';

const parseEmailSet = (value: string | undefined) =>
  new Set(
    (value ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );

const getConfiguredSenderName = (env: Env) => {
  const explicitSenderName = env.GMAIL_SENDER_NAME?.trim();
  if (explicitSenderName && explicitSenderName !== 'Cuiabar CRM') {
    return explicitSenderName;
  }
  return env.DEFAULT_FROM_NAME;
};

const buildPartnerRedirectUrl = (request: Request, targetUrl: string, defaults: { utmCampaign: string; label: string }) => {
  const target = new URL(targetUrl);
  const incoming = new URL(request.url);
  const clickId = incoming.searchParams.get('click_id') || generateId('clkout');

  incoming.searchParams.forEach((value, key) => {
    if (!value) {
      return;
    }
    target.searchParams.set(key, value);
  });

  if (!target.searchParams.get('utm_source')) {
    target.searchParams.set('utm_source', 'cuiabar-crm');
  }
  if (!target.searchParams.get('utm_medium')) {
    target.searchParams.set('utm_medium', 'outbound');
  }
  if (!target.searchParams.get('utm_campaign')) {
    target.searchParams.set('utm_campaign', defaults.utmCampaign);
  }
  if (!target.searchParams.get('label')) {
    target.searchParams.set('label', defaults.label);
  }
  target.searchParams.set('click_id', clickId);

  return { target, clickId, incoming };
};

const getContactZohoLink = async (env: Env, contactId: string) =>
  first<ContactProviderLinkRecord>(
    env.DB.prepare(
      `SELECT * FROM contact_provider_links
       WHERE contact_id = ? AND provider = 'zoho_crm' AND provider_module = 'Contacts'`,
    ).bind(contactId),
  );

const storePublicInteraction = async (
  env: Env,
  request: Request,
  payload: {
    eventId?: string | null;
    eventName: string;
    eventCategory: string;
    source: string;
    channel?: string | null;
    identityEmail?: string | null;
    identityPhone?: string | null;
    sessionKey?: string | null;
    externalRef?: string | null;
    pagePath?: string | null;
    pageLocation?: string | null;
    href?: string | null;
    label?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  let normalizedEmail: string | null = null;
  if (payload.identityEmail) {
    try {
      normalizedEmail = normalizeEmail(payload.identityEmail);
    } catch {
      normalizedEmail = null;
    }
  }
  const contact = normalizedEmail
    ? await first<{ id: string }>(env.DB.prepare('SELECT id FROM contacts WHERE email = ?').bind(normalizedEmail))
    : null;

  await run(
    env.DB.prepare(
      `INSERT INTO public_interaction_events
        (id, event_id, event_name, event_category, source, channel, contact_id, identity_email, identity_phone, session_key, external_ref, page_path, page_location, href, label, referrer, request_ip, user_agent, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      generateId('evt'),
      payload.eventId ?? null,
      payload.eventName,
      payload.eventCategory,
      payload.source,
      payload.channel ?? null,
      contact?.id ?? null,
      normalizedEmail,
      payload.identityPhone?.trim() || null,
      payload.sessionKey?.trim() || null,
      payload.externalRef?.trim() || null,
      payload.pagePath?.trim() || null,
      payload.pageLocation?.trim() || null,
      payload.href?.trim() || null,
      payload.label?.trim() || null,
      request.headers.get('referer'),
      getRequestIp(request),
      request.headers.get('user-agent'),
      asJson(payload.metadata ?? {}),
      nowIso(),
    ),
  );
};

const syncContactToZoho = async (env: Env, contact: ContactRecord) => {
  if (!isZohoConfigured(env)) {
    return { configured: false, synced: false as const, externalId: null, error: null as string | null };
  }

  const currentLink = await getContactZohoLink(env, contact.id);

  try {
    const sync = await upsertZohoContact(env, {
      contactId: contact.id,
      email: contact.email,
      firstName: contact.first_name,
      lastName: contact.last_name,
      phone: contact.phone,
      source: contact.source,
      tags: parseJsonText<string[]>(contact.tags_json, []),
      status: contact.status,
      optInStatus: contact.opt_in_status,
    });

    await run(
      env.DB.prepare(
        `INSERT INTO contact_provider_links
          (id, contact_id, provider, provider_module, external_id, sync_status, last_synced_at, last_error, metadata_json, created_at, updated_at)
         VALUES (?, ?, 'zoho_crm', 'Contacts', ?, 'active', ?, null, ?, ?, ?)
         ON CONFLICT(contact_id, provider, provider_module)
         DO UPDATE SET
           external_id = excluded.external_id,
           sync_status = 'active',
           last_synced_at = excluded.last_synced_at,
           last_error = null,
           metadata_json = excluded.metadata_json,
           updated_at = excluded.updated_at`,
      ).bind(
        currentLink?.id || generateId('lnk'),
        contact.id,
        sync.externalId,
        nowIso(),
        asJson({ action: sync.action, message: sync.message, status: sync.rawStatus }),
        currentLink?.created_at || nowIso(),
        nowIso(),
      ),
    );

    return { configured: true, synced: true as const, externalId: sync.externalId, error: null as string | null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao sincronizar contato no Zoho.';
    await run(
      env.DB.prepare(
        `INSERT INTO contact_provider_links
          (id, contact_id, provider, provider_module, external_id, sync_status, last_synced_at, last_error, metadata_json, created_at, updated_at)
         VALUES (?, ?, 'zoho_crm', 'Contacts', ?, 'error', null, ?, ?, ?, ?)
         ON CONFLICT(contact_id, provider, provider_module)
         DO UPDATE SET
           sync_status = 'error',
           last_error = excluded.last_error,
           metadata_json = excluded.metadata_json,
           updated_at = excluded.updated_at`,
      ).bind(
        currentLink?.id || generateId('lnk'),
        contact.id,
        currentLink?.external_id || `pending_${contact.id}`,
        message,
        asJson({ lastFailureAt: nowIso() }),
        currentLink?.created_at || nowIso(),
        nowIso(),
      ),
    );

    return { configured: true, synced: false as const, externalId: currentLink?.external_id ?? null, error: message };
  }
};

const createSession = async (env: Env, request: Request, userId: string) => {
  const sessionId = generateId('sess');
  const csrfToken = randomToken(16);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  await run(
    env.DB.prepare(
      `INSERT INTO sessions (id, user_id, csrf_token, ip, user_agent, expires_at, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(sessionId, userId, csrfToken, getRequestIp(request), request.headers.get('user-agent'), expiresAt, nowIso(), nowIso()),
  );
  return { sessionId, csrfToken };
};

const ensureGoogleUser = async (env: Env, email: string, name: string, subject: string, picture?: string) => {
  const allowedEmails = parseEmailSet(env.GOOGLE_ALLOWED_EMAILS);
  if (!allowedEmails.has(email.toLowerCase())) {
    throw new HttpError(403, 'Este e-mail nao esta autorizado a acessar o CRM.');
  }

  const managers = parseEmailSet(env.GOOGLE_MANAGER_EMAILS || env.GOOGLE_ALLOWED_EMAILS);
  const roleId = managers.has(email.toLowerCase()) ? 'role_manager' : 'role_marketing_operator';
  const existing = await first<{ id: string }>(
    env.DB.prepare('SELECT id FROM users WHERE google_subject = ? OR email = ?').bind(subject, email),
  );

  if (existing) {
    await run(
      env.DB.prepare(
        `UPDATE users
         SET email = ?, display_name = ?, google_subject = ?, avatar_url = ?, auth_provider = 'google', email_verified = 1, updated_at = ?
         WHERE id = ?`,
      ).bind(email, name, subject, picture ?? null, nowIso(), existing.id),
    );
    return existing.id;
  }

  const placeholderPassword = await hashPassword(randomToken(24));
  const userId = generateId('usr');
  await run(
    env.DB.prepare(
      `INSERT INTO users
        (id, email, password_hash, password_salt, password_iterations, display_name, status, auth_provider, google_subject, avatar_url, email_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', 'google', ?, ?, 1, ?, ?)`,
    ).bind(userId, email, placeholderPassword.hash, placeholderPassword.salt, placeholderPassword.iterations, name, subject, picture ?? null, nowIso(), nowIso()),
  );
  await run(env.DB.prepare('INSERT INTO user_roles (user_id, role_id, created_at) VALUES (?, ?, ?)').bind(userId, roleId, nowIso()));
  return userId;
};

const mapCampaign = (row: CampaignRecord) => ({
  id: row.id,
  name: row.name,
  subject: row.subject,
  preheader: row.preheader ?? '',
  templateId: row.template_id,
  segmentId: row.segment_id,
  listId: row.list_id,
  fromName: row.from_name,
  fromEmail: row.from_email,
  replyTo: row.reply_to,
  status: row.status,
  scheduledAt: row.scheduled_at,
  startedAt: row.started_at,
  finishedAt: row.finished_at,
  totalRecipients: row.total_recipients,
  totalSent: row.total_sent,
  totalFailed: row.total_failed,
  totalClicked: row.total_clicked,
  totalOpened: row.total_opened,
  totalUnsubscribed: row.total_unsubscribed,
  totalOpenEvents: row.total_open_events,
  totalUniqueOpens: row.total_unique_opens,
  totalClickEvents: row.total_click_events,
  totalUniqueClicks: row.total_unique_clicks,
  sendBatchSize: row.send_batch_size,
  sendRatePerMinute: row.send_rate_per_minute,
  sendPauseMs: row.send_pause_ms,
  maxRecipients: row.max_recipients,
  createdByUserId: row.created_by_user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getCampaign = async (env: Env, campaignId: string) => {
  const campaign = await first<CampaignRecord>(env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(campaignId));
  if (!campaign) {
    throw new HttpError(404, 'Campanha nao encontrada.');
  }
  return campaign;
};

const getTemplate = async (env: Env, templateId: string) => {
  const template = await first<TemplateRecord>(env.DB.prepare('SELECT * FROM templates WHERE id = ?').bind(templateId));
  if (!template) {
    throw new HttpError(404, 'Template nao encontrado.');
  }
  return template;
};

const getSuppressedEmails = async (env: Env) => {
  const rows = await all<{ email: string }>(env.DB.prepare('SELECT email FROM suppression_list'));
  return new Set(rows.map((row) => normalizeEmail(row.email)));
};

const getContactsForList = async (env: Env, listId: string) =>
  all<ContactRecord>(
    env.DB.prepare(
      `SELECT c.* FROM contacts c
       JOIN contact_list_items cli ON cli.contact_id = c.id
       WHERE cli.list_id = ?`,
    ).bind(listId),
  );

const evaluateSegmentCondition = async (env: Env, contact: ContactDto, condition: SegmentRule) => {
  const operator = condition.operator ?? 'eq';
  const value = condition.value;

  if (condition.field === 'tag') {
    const tags = new Set(contact.tags.map((tag) => tag.toLowerCase()));
    return typeof value === 'string' ? tags.has(value.toLowerCase()) : false;
  }

  if (condition.field === 'clicked_campaign_id' && typeof value === 'string') {
    const click = await first<{ total: number }>(
      env.DB.prepare(
        `SELECT COUNT(*) AS total
         FROM campaign_click_events
         WHERE campaign_id = ? AND contact_id = ?`,
      ).bind(value, contact.id),
    );
    return (click?.total ?? 0) > 0;
  }

  if (condition.field === 'not_clicked_last_n_campaigns' && typeof value === 'number') {
    const campaigns = await all<{ id: string }>(
      env.DB.prepare(
        `SELECT id FROM campaigns
         WHERE status IN ('sending', 'sent', 'failed')
         ORDER BY COALESCE(finished_at, started_at, created_at) DESC
         LIMIT ?`,
      ).bind(value),
    );

    if (campaigns.length === 0) {
      return true;
    }

    const clicked = await first<{ total: number }>(
      env.DB.prepare(
        `SELECT COUNT(*) AS total
         FROM campaign_click_events
         WHERE contact_id = ? AND campaign_id IN (${campaigns.map(() => '?').join(',')})`,
      ).bind(contact.id, ...campaigns.map((entry) => entry.id)),
    );

    return (clicked?.total ?? 0) === 0;
  }

  const fieldValue = (() => {
    switch (condition.field) {
      case 'status':
        return contact.status;
      case 'source':
        return contact.source;
      case 'opt_in_status':
        return contact.optInStatus;
      case 'email':
        return contact.email;
      default:
        return '';
    }
  })();

  if (operator === 'contains' && typeof value === 'string') {
    return String(fieldValue).toLowerCase().includes(value.toLowerCase());
  }

  if (operator === 'in' && Array.isArray(value)) {
    return value.includes(String(fieldValue));
  }

  return String(fieldValue) === String(value ?? '');
};

const getContactsForSegment = async (env: Env, segmentId: string) => {
  const segment = await first<{ rules_json: string }>(env.DB.prepare('SELECT rules_json FROM segments WHERE id = ?').bind(segmentId));
  if (!segment) {
    throw new HttpError(404, 'Segmento nao encontrado.');
  }

  const definition = parseJsonText<SegmentDefinition>(segment.rules_json, { match: 'all', conditions: [] });
  const contacts = (await all<ContactRecord>(env.DB.prepare('SELECT * FROM contacts'))).map((row) => mapContact(row));

  if (!definition.conditions || definition.conditions.length === 0) {
    return contacts;
  }

  const filtered: ContactDto[] = [];
  for (const contact of contacts) {
    const results: boolean[] = [];
    for (const condition of definition.conditions) {
      results.push(await evaluateSegmentCondition(env, contact, condition));
    }

    const matched = definition.match === 'any' ? results.some(Boolean) : results.every(Boolean);
    if (matched) {
      filtered.push(contact);
    }
  }

  return filtered;
};

const getAudienceContacts = async (env: Env, campaign: CampaignRecord) => {
  let contacts: ContactDto[] = [];

  if (campaign.list_id) {
    contacts = (await getContactsForList(env, campaign.list_id)).map((row) => mapContact(row));
  } else if (campaign.segment_id) {
    contacts = await getContactsForSegment(env, campaign.segment_id);
  } else {
    throw new HttpError(400, 'A campanha precisa apontar para uma lista ou segmento.');
  }

  return filterEligibleContacts(env, contacts);
};

const filterEligibleContacts = async (env: Env, contacts: ContactDto[]) => {
  const suppressedEmails = await getSuppressedEmails(env);
  return contacts.filter((contact) => {
    if (suppressedEmails.has(normalizeEmail(contact.email))) {
      return false;
    }
    if (contact.status !== 'active') {
      return false;
    }
    return !['pending', 'double_opt_in_pending'].includes(contact.optInStatus);
  });
};

const sha256 = async (value: string) => {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const ensureCampaignLinks = async (env: Env, campaignId: string, html: string) => {
  const urls = extractHrefLinks(html);
  const links: CampaignLinkRecord[] = [];

  for (const originalUrl of urls) {
    const hash = await sha256(originalUrl);
    let link = await first<CampaignLinkRecord>(
      env.DB.prepare('SELECT * FROM campaign_links WHERE campaign_id = ? AND original_url = ?').bind(campaignId, originalUrl),
    );

    if (!link) {
      const id = generateId('link');
      await run(
        env.DB.prepare(
          `INSERT INTO campaign_links (id, campaign_id, original_url, tracking_path, url_hash, link_label, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).bind(id, campaignId, originalUrl, `c/${id}`, hash, null, nowIso()),
      );
      link = await first<CampaignLinkRecord>(env.DB.prepare('SELECT * FROM campaign_links WHERE id = ?').bind(id));
    }

    if (link) {
      links.push(link);
    }
  }

  return links;
};

const renderEmailForRecipient = async (
  env: Env,
  campaign: CampaignRecord,
  template: TemplateRecord,
  recipient: RecipientRecord,
  contact: ContactDto,
) => {
  const personalization = parseJsonText<Record<string, unknown>>(recipient.personalization_json, {});
  const salutationMode = personalization.salutationMode === 'generic' ? 'generic' : 'personalized';
  const overrideFirstName = typeof personalization.firstName === 'string' ? personalization.firstName.trim() : '';
  const mergeFirstName = salutationMode === 'generic' ? 'cliente' : overrideFirstName || contact.firstName || 'cliente';
  const unsubscribeUrl = `${env.APP_BASE_URL}/unsubscribe/${recipient.unsubscribe_token}`;
  const merge = {
    first_name: mergeFirstName,
    last_name: contact.lastName,
    email: contact.email,
    unsubscribe_url: unsubscribeUrl,
    campaign_name: campaign.name,
    reply_to: campaign.reply_to ?? env.DEFAULT_REPLY_TO,
  };

  const merged = prepareTemplateContent(template.html_content, template.text_content, merge);
  const links = await ensureCampaignLinks(env, campaign.id, merged.html);
  const replacements = new Map<string, string>();

  for (const link of links) {
    replacements.set(link.original_url, `${env.APP_BASE_URL}/c/${recipient.tracking_token}.${link.id}`);
  }

  const preheaderHtml = campaign.preheader
    ? `<div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${campaign.preheader}</div>`
    : '';
  const trackingPixel = (await isOpenTrackingEnabled(env))
    ? `<img src="${env.APP_BASE_URL}/o/${recipient.tracking_token}" alt="" width="1" height="1" style="display:block!important;border:0!important;margin:0!important;padding:0!important;height:1px!important;width:1px!important;opacity:0!important;" />`
    : '';
  const htmlWithClicks = `${preheaderHtml}${replaceHtmlLinks(merged.html, replacements)}`;
  const html =
    trackingPixel && /<\/body>/i.test(htmlWithClicks)
      ? htmlWithClicks.replace(/<\/body>/i, `${trackingPixel}</body>`)
      : `${htmlWithClicks}${trackingPixel}`;

  return {
    subject: applyMergeTags(campaign.subject, merge),
    html,
    text: replaceTextLinks(merged.text, replacements),
    unsubscribeUrl,
  };
};

const classifySendFailure = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid') || normalized.includes('recipient') || normalized.includes('address')) {
    return 'invalid_recipient';
  }
  if (normalized.includes('quota') || normalized.includes('rate')) {
    return 'rate_limited';
  }
  return 'unknown_failure';
};

const refreshCampaignStats = async (env: Env, campaignId: string) => {
  const recipientStats = await first<{
    total_sent: number;
    total_failed: number;
    total_unsubscribed: number;
  }>(
    env.DB.prepare(
      `SELECT
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS total_sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS total_failed,
        SUM(CASE WHEN status = 'unsubscribed' THEN 1 ELSE 0 END) AS total_unsubscribed
       FROM campaign_recipients
       WHERE campaign_id = ?`,
    ).bind(campaignId),
  );

  const clickStats = await first<{
    total_click_events: number;
    total_unique_clicks: number;
    total_clicked: number;
  }>(
    env.DB.prepare(
      `SELECT
        COUNT(*) AS total_click_events,
        SUM(CASE WHEN is_unique = 1 THEN 1 ELSE 0 END) AS total_unique_clicks,
        COUNT(DISTINCT contact_id) AS total_clicked
       FROM campaign_click_events
       WHERE campaign_id = ?`,
    ).bind(campaignId),
  );

  const openStats = await first<{
    total_open_events: number;
    total_unique_opens: number;
    total_opened: number;
  }>(
    env.DB.prepare(
      `SELECT
        COUNT(*) AS total_open_events,
        SUM(CASE WHEN is_unique = 1 THEN 1 ELSE 0 END) AS total_unique_opens,
        COUNT(DISTINCT contact_id) AS total_opened
       FROM campaign_open_events
       WHERE campaign_id = ?`,
    ).bind(campaignId),
  );

  const observedRate = recipientStats?.total_sent
    ? Number(((clickStats?.total_clicked ?? 0) / Math.max(recipientStats.total_sent, 1)).toFixed(4))
    : 0;

  await run(
    env.DB.prepare(
      `UPDATE campaigns
       SET total_sent = ?,
           total_failed = ?,
           total_opened = ?,
           total_unsubscribed = ?,
           total_open_events = ?,
           total_unique_opens = ?,
           total_click_events = ?,
           total_unique_clicks = ?,
           total_clicked = ?,
           delivery_observed_rate = ?,
           updated_at = ?
       WHERE id = ?`,
    ).bind(
      recipientStats?.total_sent ?? 0,
      recipientStats?.total_failed ?? 0,
      openStats?.total_opened ?? 0,
      recipientStats?.total_unsubscribed ?? 0,
      openStats?.total_open_events ?? 0,
      openStats?.total_unique_opens ?? 0,
      clickStats?.total_click_events ?? 0,
      clickStats?.total_unique_clicks ?? 0,
      clickStats?.total_clicked ?? 0,
      observedRate,
      nowIso(),
      campaignId,
    ),
  );
};

const queueCampaignRecipients = async (env: Env, campaign: CampaignRecord) => {
  const contacts = await getAudienceContacts(env, campaign);
  if (contacts.length === 0) {
    throw new HttpError(400, 'Nenhum destinatario elegivel foi encontrado para esta campanha.');
  }
  if (contacts.length > campaign.max_recipients) {
    throw new HttpError(400, `A campanha excede o limite configurado de ${campaign.max_recipients} destinatarios.`);
  }

  await run(env.DB.prepare('DELETE FROM campaign_click_events WHERE campaign_id = ?').bind(campaign.id));
  await run(env.DB.prepare('DELETE FROM campaign_open_events WHERE campaign_id = ?').bind(campaign.id));
  await run(env.DB.prepare('DELETE FROM campaign_links WHERE campaign_id = ?').bind(campaign.id));
  await run(env.DB.prepare('DELETE FROM campaign_recipients WHERE campaign_id = ?').bind(campaign.id));
  await run(env.DB.prepare('DELETE FROM send_events WHERE campaign_id = ?').bind(campaign.id));

  for (const contact of contacts) {
    await run(
      env.DB.prepare(
        `INSERT INTO campaign_recipients
          (id, campaign_id, contact_id, email_snapshot, first_name_snapshot, last_name_snapshot, personalization_json,
           tracking_token, unsubscribe_token, status, send_attempts, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0, ?, ?)`,
      ).bind(
        generateId('rcp'),
        campaign.id,
        contact.id,
        contact.email,
        contact.firstName || null,
        contact.lastName || null,
        asJson({ tags: contact.tags, source: contact.source }),
        randomToken(18),
        randomToken(18),
        nowIso(),
        nowIso(),
      ),
    );
  }

  await run(
    env.DB.prepare(
      `UPDATE campaigns
       SET total_recipients = ?, total_sent = 0, total_failed = 0, total_clicked = 0, total_opened = 0, total_unsubscribed = 0,
           total_open_events = 0, total_unique_opens = 0, total_click_events = 0, total_unique_clicks = 0, updated_at = ?
       WHERE id = ?`,
    ).bind(contacts.length, nowIso(), campaign.id),
  );

  return contacts.length;
};

const queueSpecificRecipients = async (
  env: Env,
  campaign: CampaignRecord,
  contacts: ContactDto[],
  options?: {
    salutationMode?: 'personalized' | 'generic';
  },
) => {
  const eligibleContacts = await filterEligibleContacts(env, contacts);
  if (eligibleContacts.length === 0) {
    throw new HttpError(400, 'Nenhum destinatario elegivel foi encontrado para este disparo.');
  }
  if (eligibleContacts.length > campaign.max_recipients) {
    throw new HttpError(400, `O disparo excede o limite configurado de ${campaign.max_recipients} destinatarios.`);
  }

  await run(env.DB.prepare('DELETE FROM campaign_click_events WHERE campaign_id = ?').bind(campaign.id));
  await run(env.DB.prepare('DELETE FROM campaign_open_events WHERE campaign_id = ?').bind(campaign.id));
  await run(env.DB.prepare('DELETE FROM campaign_links WHERE campaign_id = ?').bind(campaign.id));
  await run(env.DB.prepare('DELETE FROM campaign_recipients WHERE campaign_id = ?').bind(campaign.id));
  await run(env.DB.prepare('DELETE FROM send_events WHERE campaign_id = ?').bind(campaign.id));

  for (const contact of eligibleContacts) {
    await run(
      env.DB.prepare(
        `INSERT INTO campaign_recipients
          (id, campaign_id, contact_id, email_snapshot, first_name_snapshot, last_name_snapshot, personalization_json,
           tracking_token, unsubscribe_token, status, send_attempts, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'queued', 0, ?, ?)`,
      ).bind(
        generateId('rcp'),
        campaign.id,
        contact.id,
        contact.email,
        contact.firstName || null,
        contact.lastName || null,
        asJson({
          tags: contact.tags,
          source: contact.source,
          salutationMode: options?.salutationMode === 'generic' ? 'generic' : 'personalized',
        }),
        randomToken(18),
        randomToken(18),
        nowIso(),
        nowIso(),
      ),
    );
  }

  await run(
    env.DB.prepare(
      `UPDATE campaigns
       SET total_recipients = ?, total_sent = 0, total_failed = 0, total_clicked = 0, total_opened = 0, total_unsubscribed = 0,
           total_open_events = 0, total_unique_opens = 0, total_click_events = 0, total_unique_clicks = 0, updated_at = ?
       WHERE id = ?`,
    ).bind(eligibleContacts.length, nowIso(), campaign.id),
  );

  return eligibleContacts.length;
};

const markContactSuppressed = async (env: Env, email: string, reason: string, contactId?: string | null, details: Record<string, unknown> = {}) => {
  await run(
    env.DB.prepare(
      `INSERT INTO suppression_list (id, contact_id, email, reason, source, details_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(generateId('sup'), contactId ?? null, email, reason, 'system', asJson(details), nowIso(), nowIso()),
  );
};

const sendRecipient = async (
  env: Env,
  campaign: CampaignRecord,
  template: TemplateRecord,
  recipient: RecipientRecord,
  request?: Request,
) => {
  const contact = await first<ContactRecord>(env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(recipient.contact_id));
  if (!contact) {
    throw new HttpError(404, 'Contato da fila nao encontrado.');
  }

  const mappedContact = mapContact(contact);
  const rendered = await renderEmailForRecipient(env, campaign, template, recipient, mappedContact);
  const replyTo = campaign.reply_to ?? env.DEFAULT_REPLY_TO ?? null;

  try {
    const gmailResult = await sendViaGmail(env, {
      fromName: campaign.from_name,
      fromEmail: campaign.from_email,
      to: recipient.email_snapshot,
      subject: rendered.subject,
      replyTo,
      html: rendered.html,
      text: rendered.text,
      listUnsubscribeUrl: rendered.unsubscribeUrl,
      headers: {
        'X-Campaign-Id': campaign.id,
        'X-Recipient-Id': recipient.id,
      },
    });

    await run(
      env.DB.prepare(
        `UPDATE campaign_recipients
         SET status = 'sent', provider_message_id = ?, sent_at = ?, updated_at = ?, send_attempts = send_attempts + 1
         WHERE id = ?`,
      ).bind(gmailResult.id, nowIso(), nowIso(), recipient.id),
    );
    await run(
      env.DB.prepare('UPDATE contacts SET last_sent_at = ?, updated_at = ? WHERE id = ?').bind(nowIso(), nowIso(), recipient.contact_id),
    );
    await run(
      env.DB.prepare(
        `INSERT INTO send_events (id, campaign_id, recipient_id, contact_id, provider, provider_message_id, event_type, status, payload_json, created_at)
         VALUES (?, ?, ?, ?, 'gmail', ?, 'send', 'success', ?, ?)`,
      ).bind(generateId('send'), campaign.id, recipient.id, recipient.contact_id, gmailResult.id, asJson({ threadId: gmailResult.threadId }), nowIso()),
    );

    if (request) {
      await auditLog(env, request, null, 'campaign.recipient_sent', 'campaign_recipient', recipient.id, {
        campaignId: campaign.id,
        contactId: recipient.contact_id,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha desconhecida.';
    const errorCode = classifySendFailure(message);

    await run(
      env.DB.prepare(
        `UPDATE campaign_recipients
         SET status = 'failed', last_error = ?, updated_at = ?, send_attempts = send_attempts + 1
         WHERE id = ?`,
      ).bind(message.slice(0, 500), nowIso(), recipient.id),
    );
    await run(
      env.DB.prepare(
        `INSERT INTO send_events (id, campaign_id, recipient_id, contact_id, provider, event_type, status, error_code, error_message, payload_json, created_at)
         VALUES (?, ?, ?, ?, 'gmail', 'send', 'failed', ?, ?, ?, ?)`,
      ).bind(generateId('send'), campaign.id, recipient.id, recipient.contact_id, errorCode, message.slice(0, 500), asJson({}), nowIso()),
    );

    if (errorCode === 'invalid_recipient') {
      await run(
        env.DB.prepare('UPDATE contacts SET status = ?, updated_at = ? WHERE id = ?').bind('bounced', nowIso(), recipient.contact_id),
      );
      await markContactSuppressed(env, recipient.email_snapshot, 'sync_failure', recipient.contact_id, { message });
      await run(
        env.DB.prepare(
          `INSERT INTO bounce_events (id, campaign_id, recipient_id, contact_id, bounce_type, diagnosis, raw_json, observed_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(generateId('bounce'), campaign.id, recipient.id, recipient.contact_id, 'sync_failure', message.slice(0, 300), asJson({ message }), nowIso(), nowIso()),
      );
    }
  }
};

const processCampaignQueue = async (env: Env, request?: Request, campaignId?: string) => {
  const dueScheduledCampaigns = await all<{ id: string }>(
    env.DB.prepare(
      `SELECT id FROM campaigns
       WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?
       ${campaignId ? 'AND id = ?' : ''}
       ORDER BY scheduled_at ASC`,
    ).bind(...(campaignId ? [nowIso(), campaignId] : [nowIso()])),
  );

  for (const campaign of dueScheduledCampaigns) {
    await run(
      env.DB.prepare(
        `UPDATE campaigns
         SET status = 'sending', started_at = COALESCE(started_at, ?), updated_at = ?
         WHERE id = ?`,
      ).bind(nowIso(), nowIso(), campaign.id),
    );
  }

  const activeCampaigns = await all<CampaignRecord>(
    env.DB.prepare(
      `SELECT * FROM campaigns
       WHERE status = 'sending'
       ${campaignId ? 'AND id = ?' : ''}
       ORDER BY COALESCE(started_at, scheduled_at, created_at) ASC`,
    ).bind(...(campaignId ? [campaignId] : [])),
  );

  const summaries: Array<Record<string, unknown>> = [];
  for (const campaign of activeCampaigns) {
    const template = await getTemplate(env, campaign.template_id);
    const sentLastMinute = await first<{ total: number }>(
      env.DB.prepare(
        `SELECT COUNT(*) AS total
         FROM send_events
         WHERE campaign_id = ? AND status = 'success' AND created_at >= ?`,
      ).bind(campaign.id, new Date(Date.now() - 60_000).toISOString()),
    );

    const allowedByRate = Math.max(campaign.send_rate_per_minute - (sentLastMinute?.total ?? 0), 0);
    const batchLimit = Math.min(campaign.send_batch_size, allowedByRate || campaign.send_batch_size);
    const recipients = await all<RecipientRecord>(
      env.DB.prepare(
        `SELECT * FROM campaign_recipients
         WHERE campaign_id = ? AND status = 'queued'
         ORDER BY created_at ASC
         LIMIT ?`,
      ).bind(campaign.id, batchLimit),
    );

    for (const recipient of recipients) {
      await sendRecipient(env, campaign, template, recipient, request);
    }

    await refreshCampaignStats(env, campaign.id);

    const remaining = await first<{ total: number }>(
      env.DB.prepare(`SELECT COUNT(*) AS total FROM campaign_recipients WHERE campaign_id = ? AND status = 'queued'`).bind(campaign.id),
    );

    if ((remaining?.total ?? 0) === 0) {
      await run(
        env.DB.prepare(
          `UPDATE campaigns
           SET status = CASE WHEN total_sent > 0 THEN 'sent' ELSE 'failed' END,
               finished_at = ?, updated_at = ?
           WHERE id = ?`,
        ).bind(nowIso(), nowIso(), campaign.id),
      );
    }

    summaries.push({
      campaignId: campaign.id,
      processedRecipients: recipients.length,
      remainingRecipients: remaining?.total ?? 0,
    });
  }

  return summaries;
};

const parseTrackingToken = (token: string) => {
  const separator = token.lastIndexOf('.');
  if (separator <= 0) {
    throw new HttpError(400, 'Token de tracking invalido.');
  }
  return {
    trackingToken: token.slice(0, separator),
    linkId: token.slice(separator + 1),
  };
};

const unsubscribeByToken = async (env: Env, request: Request, token: string) => {
  const recipient = await first<RecipientRecord>(
    env.DB.prepare('SELECT * FROM campaign_recipients WHERE unsubscribe_token = ?').bind(token),
  );

  if (!recipient) {
    throw new HttpError(404, 'Token de descadastro invalido.');
  }

  const contact = await first<ContactRecord>(env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(recipient.contact_id));
  if (!contact) {
    throw new HttpError(404, 'Contato nao encontrado.');
  }

  await run(
    env.DB.prepare(
      `UPDATE contacts
       SET status = 'unsubscribed', unsubscribed_at = COALESCE(unsubscribed_at, ?), updated_at = ?
       WHERE id = ?`,
    ).bind(nowIso(), nowIso(), contact.id),
  );
  await run(
    env.DB.prepare(
      `UPDATE campaign_recipients
       SET status = 'unsubscribed', unsubscribed_at = COALESCE(unsubscribed_at, ?), updated_at = ?
       WHERE id = ?`,
    ).bind(nowIso(), nowIso(), recipient.id),
  );
  await markContactSuppressed(env, contact.email, 'unsubscribe', contact.id, { campaignId: recipient.campaign_id });
  await run(
    env.DB.prepare(
      `INSERT INTO unsubscribe_events (id, campaign_id, contact_id, recipient_id, token, request_ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      generateId('unsub'),
      recipient.campaign_id,
      contact.id,
      recipient.id,
      token,
      getRequestIp(request),
      request.headers.get('user-agent'),
      nowIso(),
    ),
  );
  await refreshCampaignStats(env, recipient.campaign_id);
  await auditLog(env, request, null, 'contact.unsubscribed', 'contact', contact.id, { campaignId: recipient.campaign_id });

  return {
    contact: mapContact(contact),
    campaignId: recipient.campaign_id,
  };
};

const buildDeliverabilityChecklist = async (env: Env) => {
  const deliverability = await readSetting(env, 'deliverability', {
    spfConfigured: false,
    dkimConfigured: false,
    dmarcConfigured: false,
    listUnsubscribeEnabled: true,
    optInRequired: true,
    doubleOptInEnabled: false,
    openTrackingEnabled: true,
    warmingPlan: '',
    bounceHandling: '',
    complaintHandling: '',
  });
  const sending = await readSetting(env, 'sending', {
    batchSize: parseNumber(env.SEND_BATCH_SIZE, 25),
    ratePerMinute: parseNumber(env.SEND_RATE_PER_MINUTE, 45),
    pauseMs: parseNumber(env.SEND_PAUSE_MS, 1500),
    campaignMaxRecipients: parseNumber(env.CAMPAIGN_MAX_RECIPIENTS, 5000),
    retryLimit: 2,
  });

  return {
    authentication: [
      { key: 'spf', label: 'SPF', ok: Boolean(deliverability.spfConfigured) },
      { key: 'dkim', label: 'DKIM', ok: Boolean(deliverability.dkimConfigured) },
      { key: 'dmarc', label: 'DMARC', ok: Boolean(deliverability.dmarcConfigured) },
      { key: 'list_unsubscribe', label: 'List-Unsubscribe', ok: Boolean(deliverability.listUnsubscribeEnabled) },
      { key: 'open_tracking', label: 'Open tracking observavel', ok: Boolean(deliverability.openTrackingEnabled), note: 'Opcional e imperfeito. Use como sinal auxiliar.' },
    ],
    operational: [
      { key: 'opt_in', label: 'Opt-in valido', ok: Boolean(deliverability.optInRequired) },
      { key: 'double_opt_in', label: 'Double opt-in opcional', ok: Boolean(deliverability.doubleOptInEnabled) },
      { key: 'warming', label: 'Warming gradual', ok: true, note: deliverability.warmingPlan },
      { key: 'rate_control', label: 'Controle de lote e volume', ok: true, note: `${sending.batchSize} por lote / ${sending.ratePerMinute} por minuto` },
      { key: 'bounce_handling', label: 'Supressao de bounced', ok: true, note: deliverability.bounceHandling },
      { key: 'complaint_handling', label: 'Supressao de complaints', ok: true, note: deliverability.complaintHandling },
    ],
  };
};

const parseCsvText = (input: string) => {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
};

const gmailOauthSetupHtml = (env: Env) => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Autorizar Gmail | Cuiabar CRM</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        background:
          radial-gradient(circle at top left, rgba(251,191,36,.20), transparent 22%),
          linear-gradient(160deg, #eef4f7, #f9f3ea 38%, #eef2ff 100%);
        color: #0f172a;
      }
      .card {
        width: min(760px, 100%);
        border-radius: 32px;
        background: rgba(255,255,255,.88);
        border: 1px solid rgba(148,163,184,.24);
        box-shadow: 0 40px 120px -70px rgba(15,23,42,.55);
        padding: 32px;
        backdrop-filter: blur(14px);
      }
      .pill {
        display: inline-flex;
        padding: 8px 14px;
        border-radius: 999px;
        background: #0f172a;
        color: #fff;
        font-size: 12px;
        letter-spacing: .18em;
        text-transform: uppercase;
      }
      h1 { margin: 16px 0 8px; font-size: clamp(32px, 5vw, 44px); line-height: 1.05; }
      p { color: #475569; line-height: 1.6; }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 999px;
        background: #2563eb;
        color: #fff;
        font-weight: 700;
        padding: 14px 22px;
        cursor: pointer;
        font-size: 15px;
        text-decoration: none;
      }
      .panel {
        margin-top: 24px;
        border-radius: 24px;
        background: #f8fafc;
        border: 1px solid rgba(148,163,184,.22);
        padding: 20px;
      }
      .status { margin-top: 14px; font-weight: 600; color: #0f172a; }
      .error { color: #b91c1c; }
      code { font-family: ui-monospace, SFMono-Regular, monospace; }
    </style>
  </head>
  <body>
    <main class="card">
      <span class="pill">gmail oauth</span>
      <h1>Autorizar envio com Google</h1>
      <p>Esta etapa conecta a conta Google <strong>leonardo@cuiabar.net</strong> ao CRM para liberar o envio via API oficial do Gmail e a criacao automatica de eventos no Google Calendar.</p>
      <div class="panel">
        <p><strong>Escopo solicitado:</strong> <code>gmail.send</code> + <code>calendar.events</code></p>
        <p><strong>Conta esperada:</strong> <code>${env.GMAIL_SENDER_EMAIL || 'leonardo@cuiabar.net'}</code></p>
        <p><strong>Redirect URI a configurar no Google Cloud:</strong> <code>${env.APP_BASE_URL}/oauth/gmail/callback</code></p>
        <a class="button" href="/oauth/gmail/start">Autorizar Google do remetente</a>
        <div class="status">Ao clicar, voce sera levado ao Google para liberar o <code>refresh token</code> de envio e calendario.</div>
      </div>
    </main>
  </body>
</html>`;

export const createApp = () => {
  const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

  app.use('*', async (c, next) => {
    const sessionId = getCookie(c, c.env.SESSION_COOKIE_NAME);
    const { user, session } = await getSessionBundle(c.env, sessionId);
    c.set('user', user);
    c.set('session', session);

    if (session) {
      await run(c.env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').bind(nowIso(), session.id));
    }

    if (
      isMutationMethod(c.req.method) &&
      c.req.path.startsWith('/api/') &&
      !['/api/auth/login', '/api/bootstrap/admin', '/api/gmail/oauth/exchange'].includes(c.req.path)
    ) {
      requireCsrf(c);
    }

    await next();
  });

  app.onError((error, c) => {
    if (error instanceof HttpError) {
      return jsonError(c, error.status, error.message, error.details);
    }

    console.error('app_error', error);
    if (c.req.path.startsWith('/api/reservations')) {
      return jsonError(c, 500, 'Nao foi possivel registrar sua reserva agora. Tente novamente em instantes.');
    }
    return jsonError(c, 500, 'Erro interno do CRM.');
  });

  app.get('/api/health', (c) =>
    c.json({
      ok: true,
      app: c.env.APP_NAME,
      timestamp: nowIso(),
    }),
  );

  registerReservationRoutes(app);
  registerBlogRoutes(app);

  app.post('/api/meta-conversions', async (c) => {
    const body = await requireJsonBody<PublicInteractionPayload>(c.req.raw);
    const customData = body.custom_data ?? {};
    const userData = body.user_data ?? {};
    let metaForwardResult: { configured: boolean; forwarded: boolean; eventsReceived?: number } = {
      configured: isMetaConfigured(c.env),
      forwarded: false,
    };
    let metaForwardError: string | null = null;

    if (isMetaConfigured(c.env)) {
      try {
        metaForwardResult = await forwardMetaEvent(c.env, c.req.raw, body);
      } catch (error) {
        metaForwardError = error instanceof Error ? error.message : 'Falha ao encaminhar evento para a Meta.';
      }
    }

    await storePublicInteraction(c.env, c.req.raw, {
      eventId: body.event_id ?? null,
      eventName: body.event_name || 'unknown_event',
      eventCategory:
        body.event_name === 'PageView'
          ? 'page_view'
          : body.event_name === 'Lead'
            ? 'lead'
            : body.event_name === 'Contact'
              ? 'contact'
              : body.event_name === 'InitiateCheckout'
                ? 'checkout'
                : 'event',
      source: body.source || 'site_tracker',
      channel:
        typeof customData.contact_channel === 'string'
          ? customData.contact_channel
          : typeof customData.lead_source === 'string'
            ? customData.lead_source
            : typeof customData.checkout_channel === 'string'
              ? customData.checkout_channel
              : null,
      identityEmail: typeof userData.email === 'string' ? userData.email : typeof customData.email === 'string' ? customData.email : null,
      identityPhone: typeof userData.phone === 'string' ? userData.phone : typeof customData.phone === 'string' ? customData.phone : null,
      pagePath: typeof customData.page_path === 'string' ? customData.page_path : null,
      pageLocation:
        typeof customData.page_location === 'string'
          ? customData.page_location
          : typeof body.event_source_url === 'string'
            ? body.event_source_url
            : null,
      href: typeof customData.href === 'string' ? customData.href : null,
      label: typeof customData.label === 'string' ? customData.label : null,
      metadata: {
        actionSource: body.action_source || null,
        eventTime: body.event_time || null,
        customData,
        userData,
        metaForwarded: metaForwardResult.forwarded,
        metaForwardError,
      },
    });

    return c.json({
      ok: true,
      received: true,
      meta: {
        configured: metaForwardResult.configured,
        forwarded: metaForwardResult.forwarded,
        eventsReceived: metaForwardResult.eventsReceived ?? 0,
        error: metaForwardError,
      },
    });
  });

  app.post('/api/public/contacts/capture', async (c) => {
    const body = await requireJsonBody<{
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      source?: string;
      tags?: string[];
      consent?: boolean;
      optInStatus?: string;
      listId?: string | null;
      metadata?: Record<string, unknown>;
    }>(c.req.raw);

    const email = ensureEmail(body.email);
    const existing = await first<ContactRecord>(c.env.DB.prepare('SELECT * FROM contacts WHERE email = ?').bind(email));
    const contactId = existing?.id ?? generateId('ctc');
    const tags = new Set<string>([...(existing ? parseJsonText<string[]>(existing.tags_json, []) : []), ...(body.tags ?? [])].map((tag) => tag.trim()).filter(Boolean));
    const optInStatus = body.optInStatus?.trim() || (body.consent ? 'confirmed' : 'pending');
    const source = body.source?.trim() || 'public_capture';

    if (existing) {
      await run(
        c.env.DB.prepare(
          `UPDATE contacts
           SET first_name = COALESCE(NULLIF(?, ''), first_name),
               last_name = COALESCE(NULLIF(?, ''), last_name),
               phone = COALESCE(NULLIF(?, ''), phone),
               source = COALESCE(NULLIF(?, ''), source),
               tags_json = ?,
               opt_in_status = CASE
                 WHEN status IN ('unsubscribed', 'suppressed') THEN opt_in_status
                 ELSE ?
               END,
               updated_at = ?
           WHERE id = ?`,
        ).bind(
          body.firstName?.trim() || '',
          body.lastName?.trim() || '',
          body.phone?.trim() || '',
          source,
          asJson([...tags]),
          optInStatus,
          nowIso(),
          existing.id,
        ),
      );
    } else {
      await run(
        c.env.DB.prepare(
          `INSERT INTO contacts
            (id, email, first_name, last_name, phone, source, tags_json, status, opt_in_status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
        ).bind(
          contactId,
          email,
          body.firstName?.trim() || null,
          body.lastName?.trim() || null,
          body.phone?.trim() || null,
          source,
          asJson([...tags]),
          optInStatus,
          nowIso(),
          nowIso(),
        ),
      );
    }

    if (body.listId) {
      await run(
        c.env.DB.prepare(
          `INSERT OR IGNORE INTO contact_list_items (id, list_id, contact_id, created_at)
           VALUES (?, ?, ?, ?)`,
        ).bind(generateId('cli'), body.listId, contactId, nowIso()),
      );
    }

    const contact = await first<ContactRecord>(c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(contactId));
    const zohoSync = contact ? await syncContactToZoho(c.env, contact) : { configured: false, synced: false as const, externalId: null, error: null as string | null };
    const googleAdsSettings = await readGoogleAdsConnectorSettings(c.env);
    const captureMetadata = parseJsonText<Record<string, unknown>>(JSON.stringify(body.metadata ?? {}), {});
    const gclid = typeof captureMetadata.gclid === 'string' ? captureMetadata.gclid.trim() : null;
    const gbraid = typeof captureMetadata.gbraid === 'string' ? captureMetadata.gbraid.trim() : null;
    const wbraid = typeof captureMetadata.wbraid === 'string' ? captureMetadata.wbraid.trim() : null;
    let googleAdsConversion:
      | {
          configured: boolean;
          uploaded: boolean;
          status: 'success' | 'error' | 'skipped';
          error: string | null;
        }
      | undefined;

    if (contact && googleAdsSettings.autoUploadLeadConversions) {
      const clickId = gclid || gbraid || wbraid;
      const clickIdType = gclid ? 'gclid' : gbraid ? 'gbraid' : wbraid ? 'wbraid' : null;
      if (!googleAdsSettings.customerId || !googleAdsSettings.conversionAction || !isGoogleAdsConfigured(c.env) || !clickId || !clickIdType) {
        googleAdsConversion = {
          configured: Boolean(googleAdsSettings.customerId && googleAdsSettings.conversionAction && isGoogleAdsConfigured(c.env)),
          uploaded: false,
          status: 'skipped',
          error: clickId ? 'Google Ads ainda nao esta configurado para upload de conversoes.' : 'Nenhum click ID do Google foi informado nesta captura.',
        };
        await recordConversionUpload(c.env, {
          provider: 'google_ads',
          contactId: contact.id,
          externalClickId: clickId,
          clickIdType,
          conversionKey: googleAdsSettings.conversionAction,
          conversionLabel: 'contact_capture',
          conversionTime: nowIso(),
          conversionValue: googleAdsSettings.conversionValue,
          currencyCode: googleAdsSettings.currencyCode,
          status: 'skipped',
          error: googleAdsConversion.error,
        });
      } else {
        try {
          const result = await uploadGoogleAdsClickConversion(c.env, {
            customerId: googleAdsSettings.customerId,
            conversionAction: googleAdsSettings.conversionAction,
            conversionDateTime: toGoogleAdsDateTime(nowIso()),
            conversionValue: googleAdsSettings.conversionValue ?? 1,
            currencyCode: googleAdsSettings.currencyCode || 'BRL',
            gclid,
            gbraid,
            wbraid,
            orderId: contact.id,
          });
          googleAdsConversion = {
            configured: true,
            uploaded: true,
            status: 'success',
            error: null,
          };
          await recordConversionUpload(c.env, {
            provider: 'google_ads',
            contactId: contact.id,
            externalClickId: clickId,
            clickIdType,
            conversionKey: googleAdsSettings.conversionAction,
            conversionLabel: 'contact_capture',
            conversionTime: nowIso(),
            conversionValue: googleAdsSettings.conversionValue,
            currencyCode: googleAdsSettings.currencyCode,
            status: 'success',
            providerResponse: result as Record<string, unknown>,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Falha ao enviar conversao para o Google Ads.';
          googleAdsConversion = {
            configured: true,
            uploaded: false,
            status: 'error',
            error: message,
          };
          await recordConversionUpload(c.env, {
            provider: 'google_ads',
            contactId: contact.id,
            externalClickId: clickId,
            clickIdType,
            conversionKey: googleAdsSettings.conversionAction,
            conversionLabel: 'contact_capture',
            conversionTime: nowIso(),
            conversionValue: googleAdsSettings.conversionValue,
            currencyCode: googleAdsSettings.currencyCode,
            status: 'error',
            error: message,
          });
        }
      }
    }

    await storePublicInteraction(c.env, c.req.raw, {
      eventName: 'contact_capture',
      eventCategory: 'contact_capture',
      source,
      channel: source,
      identityEmail: email,
      identityPhone: body.phone?.trim() || null,
      metadata: {
        consent: Boolean(body.consent),
        optInStatus,
        tags: [...tags],
        listId: body.listId ?? null,
        zohoSync,
        googleAdsConversion,
        payload: body.metadata ?? {},
      },
    });

    return c.json({
      ok: true,
      created: !existing,
      contactId,
      zohoSync,
      googleAdsConversion,
    });
  });

  app.get('/go/ifood', async (c) => {
    const { target, clickId, incoming } = buildPartnerRedirectUrl(c.req.raw, c.env.IFOOD_STORE_URL || DEFAULT_IFOOD_STORE_URL, {
      utmCampaign: 'ifood-store',
      label: 'Abrir iFood',
    });
    await storePublicInteraction(c.env, c.req.raw, {
      eventId: clickId,
      eventName: 'ifood_redirect_click',
      eventCategory: 'checkout',
      source: 'ifood_redirect',
      channel: 'ifood',
      externalRef: clickId,
      pagePath: incoming.searchParams.get('ref_page') || null,
      pageLocation: incoming.searchParams.get('origin_url') || c.req.header('referer') || null,
      href: target.toString(),
      label: incoming.searchParams.get('label') || 'Abrir iFood',
      metadata: {
        query: (() => {
          const query: Record<string, string> = {};
          incoming.searchParams.forEach((value, key) => {
            query[key] = value;
          });
          return query;
        })(),
        destination: target.toString(),
      },
    });

    return c.redirect(target.toString(), 302);
  });

  app.get('/go/99food', async (c) => {
    const { target, clickId, incoming } = buildPartnerRedirectUrl(c.req.raw, c.env.FOOD99_STORE_URL || DEFAULT_99FOOD_STORE_URL, {
      utmCampaign: '99food-store',
      label: 'Abrir 99Food',
    });
    await storePublicInteraction(c.env, c.req.raw, {
      eventId: clickId,
      eventName: 'food99_redirect_click',
      eventCategory: 'checkout',
      source: 'food99_redirect',
      channel: '99food',
      externalRef: clickId,
      pagePath: incoming.searchParams.get('ref_page') || null,
      pageLocation: incoming.searchParams.get('origin_url') || c.req.header('referer') || null,
      href: target.toString(),
      label: incoming.searchParams.get('label') || 'Abrir 99Food',
      metadata: {
        query: (() => {
          const query: Record<string, string> = {};
          incoming.searchParams.forEach((value, key) => {
            query[key] = value;
          });
          return query;
        })(),
        destination: target.toString(),
      },
    });

    return c.redirect(target.toString(), 302);
  });

  app.get('/ifood', (c) => c.redirect(`/go/ifood${new URL(c.req.url).search}`, 302));
  app.get('/99food', (c) => c.redirect(`/go/99food${new URL(c.req.url).search}`, 302));

  app.get('/api/bootstrap/status', async (c) => {
    const count = await getUserCount(c.env);
    return c.json({
      ok: true,
      requiresBootstrap: isGoogleOnlyAuth(c.env) ? false : count === 0,
      tokenConfigured: Boolean(c.env.SETUP_ADMIN_TOKEN),
    });
  });

  app.get('/api/auth/config', async (c) =>
    c.json({
      ok: true,
      authMode: isGoogleOnlyAuth(c.env) ? 'google_only' : 'local_password',
      googleClientId: c.env.GOOGLE_AUTH_CLIENT_ID && !c.env.GOOGLE_AUTH_CLIENT_ID.startsWith('REPLACE_WITH') ? c.env.GOOGLE_AUTH_CLIENT_ID : null,
      allowedEmails: [...parseEmailSet(c.env.GOOGLE_ALLOWED_EMAILS)],
    }),
  );

  app.get('/oauth/google-business/setup', (c) => c.html(googleBusinessOauthSetupHtml(c.env)));

  app.get('/oauth/google-business/start', (c) => {
    if (!c.env.GOOGLE_BUSINESS_CLIENT_ID || !c.env.GOOGLE_BUSINESS_CLIENT_SECRET) {
      throw new HttpError(400, 'As credenciais OAuth do Google Business Profile ainda nao foram configuradas no Worker.');
    }

    const requestOrigin = new URL(c.req.url).origin;
    const requestHost = new URL(c.req.url).hostname;
    const redirectUri = `${requestOrigin}/api/google/business/callback`;
    const state = randomToken(24);
    const secure = new URL(c.req.url).protocol === 'https:';
    const cookieDomain = requestHost.endsWith('.cuiabar.com') ? '.cuiabar.com' : undefined;

    setCookie(c, GOOGLE_BUSINESS_OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure,
      sameSite: 'Lax',
      domain: cookieDomain,
      path: '/',
      maxAge: 60 * 10,
    });

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', c.env.GOOGLE_BUSINESS_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile https://www.googleapis.com/auth/business.manage');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('state', state);

    const loginHint = normalizeEmail(c.env.GOOGLE_MANAGER_EMAILS?.split(',')[0] || c.env.GOOGLE_ALLOWED_EMAILS?.split(',')[0] || '');
    if (loginHint) {
      authUrl.searchParams.set('login_hint', loginHint);
    }

    return c.redirect(authUrl.toString(), 302);
  });

  app.get('/api/google/business/callback', async (c) => {
    const requestOrigin = new URL(c.req.url).origin;
    const requestHost = new URL(c.req.url).hostname;
    const redirectUri = `${requestOrigin}/api/google/business/callback`;
    const expectedState = getCookie(c, GOOGLE_BUSINESS_OAUTH_STATE_COOKIE_NAME);
    deleteCookie(c, GOOGLE_BUSINESS_OAUTH_STATE_COOKIE_NAME, {
      path: '/',
      domain: requestHost.endsWith('.cuiabar.com') ? '.cuiabar.com' : undefined,
    });

    const oauthError = c.req.query('error');
    if (oauthError) {
      const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Autorizacao cancelada</title><style>body{font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#f8fafc;color:#0f172a;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}.card{max-width:680px;background:#fff;padding:32px;border-radius:28px;box-shadow:0 30px 80px rgba(15,23,42,.10)}.error{color:#b91c1c}code{font-family:ui-monospace,SFMono-Regular,monospace}</style></head><body><main class="card"><h1 class="error">Autorizacao nao concluida</h1><p>O Google retornou <code>${oauthError}</code>.</p><p>Volte ao chat e me envie essa mensagem para eu ajustar o fluxo.</p></main></body></html>`;
      return c.html(html, 400);
    }

    const state = c.req.query('state');
    const code = c.req.query('code');
    if (!expectedState || !state || state !== expectedState) {
      throw new HttpError(400, 'Estado do OAuth invalido ou expirado. Tente novamente a partir da tela de setup.');
    }
    if (!code) {
      throw new HttpError(400, 'Codigo de autorizacao ausente no callback do Google Business Profile.');
    }
    if (!c.env.GOOGLE_BUSINESS_CLIENT_ID || !c.env.GOOGLE_BUSINESS_CLIENT_SECRET) {
      throw new HttpError(400, 'As credenciais OAuth do Google Business Profile ainda nao foram configuradas no Worker.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_BUSINESS_CLIENT_ID,
        client_secret: c.env.GOOGLE_BUSINESS_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenPayload = (await tokenResponse.json()) as {
      refresh_token?: string;
      id_token?: string;
      scope?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenResponse.ok) {
      throw new HttpError(400, 'Google recusou a troca do codigo OAuth do Business Profile.', tokenPayload);
    }

    if (!tokenPayload.id_token) {
      throw new HttpError(400, 'O Google nao retornou um id_token para validar a conta autorizada.');
    }

    const identity = await verifyGoogleIdToken(c.env, tokenPayload.id_token, c.env.GOOGLE_BUSINESS_CLIENT_ID);
    const authorizedEmail = identity.email.toLowerCase();
    const allowedBusinessEmails = parseEmailSet(c.env.GOOGLE_MANAGER_EMAILS || c.env.GOOGLE_ALLOWED_EMAILS);
    if (allowedBusinessEmails.size > 0 && !allowedBusinessEmails.has(authorizedEmail)) {
      throw new HttpError(403, `A autorizacao precisa ser feita com uma conta gestora do Cuiabar. Conta atual: ${authorizedEmail}.`);
    }

    if (!tokenPayload.refresh_token) {
      throw new HttpError(
        409,
        'O Google nao retornou refresh token. Revogue o acesso anterior do app nesta conta e autorize novamente.',
        { email: authorizedEmail, scope: tokenPayload.scope ?? null },
      );
    }

    await storeGoogleBusinessOAuthConnection(c.env, {
      email: authorizedEmail,
      refreshToken: tokenPayload.refresh_token,
      scope: tokenPayload.scope ?? null,
      grantedAt: nowIso(),
      source: 'panel_oauth',
    });
    await auditLog(c.env, c.req.raw, null, 'google_business.oauth.exchange', 'app_settings', 'google_business_oauth_connection', {
      email: authorizedEmail,
      scope: tokenPayload.scope ?? null,
    });

    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Google Business autorizado</title><style>body{font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#eef4f7;color:#0f172a;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}.card{max-width:720px;background:#fff;padding:32px;border-radius:28px;box-shadow:0 30px 80px rgba(15,23,42,.10)}.ok{color:#166534}code{font-family:ui-monospace,SFMono-Regular,monospace}</style></head><body><main class="card"><h1 class="ok">Autorizacao concluida</h1><p>O Google Business Profile de <strong>${authorizedEmail}</strong> foi autorizado e o <code>refresh token</code> ficou salvo no CRM.</p><p>Volte ao chat e me responda <strong>autorizei</strong> para eu validar a conexao e seguir com a integracao do perfil.</p></main></body></html>`;
    return c.html(html);
  });

  app.get('/oauth/gmail/setup', (c) => c.html(gmailOauthSetupHtml(c.env)));

  app.get('/oauth/gmail/start', (c) => {
    if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) {
      throw new HttpError(400, 'As credenciais OAuth do Gmail ainda nao foram configuradas no Worker.');
    }

    const requestOrigin = new URL(c.req.url).origin;
    const redirectUri = `${requestOrigin}/oauth/gmail/callback`;
    const state = randomToken(24);
    const secure = new URL(c.req.url).protocol === 'https:';

    setCookie(c, GMAIL_OAUTH_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure,
      sameSite: 'Lax',
      path: '/oauth/gmail',
      maxAge: 60 * 10,
    });

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', c.env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set(
      'scope',
      'openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.events',
    );
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('login_hint', normalizeEmail(c.env.GMAIL_SENDER_EMAIL || 'leonardo@cuiabar.net'));

    return c.redirect(authUrl.toString(), 302);
  });

  app.get('/oauth/gmail/callback', async (c) => {
    const requestOrigin = new URL(c.req.url).origin;
    const redirectUri = `${requestOrigin}/oauth/gmail/callback`;
    const expectedState = getCookie(c, GMAIL_OAUTH_STATE_COOKIE_NAME);
    deleteCookie(c, GMAIL_OAUTH_STATE_COOKIE_NAME, { path: '/oauth/gmail' });

    const oauthError = c.req.query('error');
    if (oauthError) {
      const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Autorizacao cancelada</title><style>body{font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#f8fafc;color:#0f172a;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}.card{max-width:680px;background:#fff;padding:32px;border-radius:28px;box-shadow:0 30px 80px rgba(15,23,42,.10)}.error{color:#b91c1c}code{font-family:ui-monospace,SFMono-Regular,monospace}</style></head><body><main class="card"><h1 class="error">Autorizacao nao concluida</h1><p>O Google retornou <code>${oauthError}</code>.</p><p>Volte ao chat e me envie essa mensagem para eu ajustar o fluxo.</p></main></body></html>`;
      return c.html(html, 400);
    }

    const state = c.req.query('state');
    const code = c.req.query('code');
    if (!expectedState || !state || state !== expectedState) {
      throw new HttpError(400, 'Estado do OAuth invalido ou expirado. Tente novamente a partir da tela de setup.');
    }
    if (!code) {
      throw new HttpError(400, 'Codigo de autorizacao ausente no callback do Google.');
    }
    if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) {
      throw new HttpError(400, 'As credenciais OAuth do Gmail ainda nao foram configuradas no Worker.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenPayload = (await tokenResponse.json()) as {
      refresh_token?: string;
      id_token?: string;
      scope?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenResponse.ok) {
      throw new HttpError(400, 'Google recusou a troca do codigo OAuth.', tokenPayload);
    }

    if (!tokenPayload.id_token) {
      throw new HttpError(400, 'O Google nao retornou um id_token para validar a conta autorizada.');
    }

    const identity = await verifyGoogleIdToken(c.env, tokenPayload.id_token, c.env.GOOGLE_CLIENT_ID);
    const authorizedEmail = identity.email.toLowerCase();
    const expectedSenderEmail = normalizeEmail(c.env.GMAIL_SENDER_EMAIL || 'leonardo@cuiabar.net');

    if (authorizedEmail !== expectedSenderEmail) {
      throw new HttpError(403, `A autorizacao precisa ser feita com ${expectedSenderEmail}.`);
    }

    if (!tokenPayload.refresh_token) {
      throw new HttpError(
        409,
        'O Google nao retornou refresh token. Revogue o acesso anterior do app nesta conta e autorize novamente.',
        { email: authorizedEmail, scope: tokenPayload.scope ?? null },
      );
    }

    await storeGmailOAuthConnection(c.env, {
      email: authorizedEmail,
      refreshToken: tokenPayload.refresh_token,
      scope: tokenPayload.scope ?? null,
      grantedAt: nowIso(),
      source: 'panel_oauth',
    });
    await auditLog(c.env, c.req.raw, null, 'gmail.oauth.exchange', 'app_settings', 'gmail_oauth_connection', {
      email: authorizedEmail,
      scope: tokenPayload.scope ?? null,
    });

    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Gmail autorizado</title><style>body{font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#eef4f7;color:#0f172a;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}.card{max-width:720px;background:#fff;padding:32px;border-radius:28px;box-shadow:0 30px 80px rgba(15,23,42,.10)}.ok{color:#166534}code{font-family:ui-monospace,SFMono-Regular,monospace}</style></head><body><main class="card"><h1 class="ok">Autorizacao concluida</h1><p>O Gmail de <strong>${authorizedEmail}</strong> foi autorizado e o <code>refresh token</code> ficou salvo temporariamente no CRM.</p><p>Volte ao chat e me responda <strong>autorizei</strong> para eu gravar isso como secret do Cloudflare e finalizar o envio.</p></main></body></html>`;
    return c.html(html);
  });

  app.post('/api/gmail/oauth/exchange', async (c) => {
    const requestedWith = c.req.header('x-requested-with');
    if (requestedWith !== 'XmlHttpRequest') {
      throw new HttpError(400, 'Cabecalho de seguranca ausente.');
    }

    const origin = c.req.header('origin');
    const requestOrigin = new URL(c.req.url).origin;
    if (origin && origin !== requestOrigin) {
      throw new HttpError(403, 'Origem bloqueada.');
    }

    if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) {
      throw new HttpError(400, 'As credenciais OAuth do Gmail ainda nao foram configuradas no Worker.');
    }

    const body = await requireJsonBody<{ code?: string }>(c.req.raw);
    const code = body.code?.trim();
    if (!code) {
      throw new HttpError(400, 'Codigo de autorizacao ausente.');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: requestOrigin,
        grant_type: 'authorization_code',
      }),
    });

    const tokenPayload = (await tokenResponse.json()) as {
      access_token?: string;
      refresh_token?: string;
      id_token?: string;
      scope?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenResponse.ok) {
      throw new HttpError(400, 'Google recusou a troca do codigo OAuth.', tokenPayload);
    }

    if (!tokenPayload.id_token) {
      throw new HttpError(400, 'O Google nao retornou um id_token para validar a conta autorizada.');
    }

    const identity = await verifyGoogleIdToken(c.env, tokenPayload.id_token, c.env.GOOGLE_CLIENT_ID);
    const authorizedEmail = identity.email.toLowerCase();
    const expectedSenderEmail = normalizeEmail(c.env.GMAIL_SENDER_EMAIL || 'leonardo@cuiabar.net');

    if (authorizedEmail !== expectedSenderEmail) {
      throw new HttpError(403, `A autorizacao precisa ser feita com ${expectedSenderEmail}.`);
    }

    if (!tokenPayload.refresh_token) {
      throw new HttpError(
        409,
        'O Google nao retornou refresh token. Revogue o acesso anterior do app nesta conta e autorize novamente.',
        { email: authorizedEmail, scope: tokenPayload.scope ?? null },
      );
    }

    await storeGmailOAuthConnection(c.env, {
      email: authorizedEmail,
      refreshToken: tokenPayload.refresh_token,
      scope: tokenPayload.scope ?? null,
      grantedAt: nowIso(),
      source: 'panel_oauth',
    });
    await auditLog(c.env, c.req.raw, null, 'gmail.oauth.exchange', 'app_settings', 'gmail_oauth_connection', {
      email: authorizedEmail,
      scope: tokenPayload.scope ?? null,
    });

    return c.json({
      ok: true,
      email: authorizedEmail,
      scope: tokenPayload.scope ?? null,
      stored: true,
    });
  });

  app.post('/api/bootstrap/admin', async (c) => {
    const count = await getUserCount(c.env);
    if (count > 0) {
      throw new HttpError(409, 'Bootstrap inicial ja foi concluido.');
    }

    const body = await requireJsonBody<{ token: string; email: string; password: string; displayName: string }>(c.req.raw);
    if (!c.env.SETUP_ADMIN_TOKEN || body.token !== c.env.SETUP_ADMIN_TOKEN) {
      throw new HttpError(403, 'Token de bootstrap invalido.');
    }

    const email = ensureEmail(body.email);
    requireStrongPassword(body.password);
    const password = await hashPassword(body.password);
    const userId = generateId('usr');
    await run(
      c.env.DB.prepare(
        `INSERT INTO users (id, email, password_hash, password_salt, password_iterations, display_name, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      ).bind(userId, email, password.hash, password.salt, password.iterations, body.displayName.trim(), nowIso(), nowIso()),
    );
    await run(c.env.DB.prepare(`INSERT INTO user_roles (user_id, role_id, created_at) VALUES (?, 'role_manager', ?)`).bind(userId, nowIso()));
    await auditLog(c.env, c.req.raw, userId, 'user.bootstrap', 'user', userId, { email });
    return c.json({ ok: true, userId });
  });

  app.post('/api/auth/login', async (c) => {
    if (isGoogleOnlyAuth(c.env)) {
      throw new HttpError(403, 'Este CRM aceita apenas autenticacao Google.');
    }

    const body = await requireJsonBody<{ email: string; password: string }>(c.req.raw);
    const email = ensureEmail(body.email);
    const user = await first<{
      id: string;
      email: string;
      password_hash: string;
      password_salt: string;
      password_iterations: number;
      display_name: string;
      status: string;
    }>(c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email));

    if (!user || user.status !== 'active') {
      throw new HttpError(401, 'Credenciais invalidas.');
    }

    const passwordMatches = await verifyPassword(body.password, user.password_salt, user.password_iterations, user.password_hash);
    if (!passwordMatches) {
      throw new HttpError(401, 'Credenciais invalidas.');
    }

    const { sessionId, csrfToken } = await createSession(c.env, c.req.raw, user.id);
    await run(c.env.DB.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?').bind(nowIso(), nowIso(), user.id));
    setSessionCookies(c, sessionId, csrfToken);
    await auditLog(c.env, c.req.raw, user.id, 'auth.login', 'session', sessionId, {});
    const bundle = await getSessionBundle(c.env, sessionId);

    return c.json({
      ok: true,
      user: bundle.user,
      csrfToken,
    });
  });

  app.post('/api/auth/google/verify', async (c) => {
    if (!isGoogleOnlyAuth(c.env)) {
      throw new HttpError(403, 'Google auth nao esta ativo neste ambiente.');
    }

    const body = await requireJsonBody<{ credential: string }>(c.req.raw);
    try {
      const identity = await verifyGoogleIdToken(c.env, body.credential);
      const userId = await ensureGoogleUser(c.env, identity.email.toLowerCase(), identity.name, identity.subject, identity.picture);
      const { sessionId, csrfToken } = await createSession(c.env, c.req.raw, userId);
      await run(c.env.DB.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?').bind(nowIso(), nowIso(), userId));
      setSessionCookies(c, sessionId, csrfToken);
      await auditLog(c.env, c.req.raw, userId, 'auth.google_login', 'session', sessionId, { email: identity.email });
      const bundle = await getSessionBundle(c.env, sessionId);

      return c.json({
        ok: true,
        user: bundle.user,
        csrfToken,
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Falha ao validar o login Google.';
      console.error('google_login_error', {
        message,
        hasClientId: Boolean(c.env.GOOGLE_AUTH_CLIENT_ID),
        allowedEmails: [...parseEmailSet(c.env.GOOGLE_ALLOWED_EMAILS)],
      });
      throw new HttpError(401, message);
    }
  });

  app.post('/api/auth/logout', async (c) => {
    const session = c.get('session');
    if (session) {
      await run(c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(session.id));
      await auditLog(c.env, c.req.raw, session.userId, 'auth.logout', 'session', session.id, {});
    }
    clearSessionCookies(c);
    return c.json({ ok: true });
  });

  app.get('/api/auth/session', async (c) =>
    c.json({
      ok: true,
      authenticated: Boolean(c.get('user') && c.get('session')),
      user: c.get('user'),
      csrfToken: c.get('session')?.csrfToken ?? null,
    }),
  );

  app.post('/api/auth/change-password', async (c) => {
    const user = requirePermission(c, 'dashboard:read');
    const body = await requireJsonBody<{ currentPassword: string; newPassword: string }>(c.req.raw);
    const row = await first<{
      password_hash: string;
      password_salt: string;
      password_iterations: number;
    }>(c.env.DB.prepare('SELECT password_hash, password_salt, password_iterations FROM users WHERE id = ?').bind(user.id));

    if (!row) {
      throw new HttpError(404, 'Usuario nao encontrado.');
    }

    const matches = await verifyPassword(body.currentPassword, row.password_salt, row.password_iterations, row.password_hash);
    if (!matches) {
      throw new HttpError(400, 'Senha atual incorreta.');
    }

    requireStrongPassword(body.newPassword);
    const next = await hashPassword(body.newPassword);
    await run(
      c.env.DB.prepare(
        `UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ? WHERE id = ?`,
      ).bind(next.hash, next.salt, next.iterations, nowIso(), user.id),
    );
    await auditLog(c.env, c.req.raw, user.id, 'auth.change_password', 'user', user.id, {});
    return c.json({ ok: true });
  });

  app.get('/api/users', async (c) => {
    requirePermission(c, 'users:manage');
    const rows = await all<{
      id: string;
      email: string;
      display_name: string;
      status: string;
      created_at: string;
      last_login_at: string | null;
      roles: string | null;
    }>(
      c.env.DB.prepare(
        `SELECT u.id, u.email, u.display_name, u.status, u.created_at, u.last_login_at, GROUP_CONCAT(r.name) AS roles
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN roles r ON r.id = ur.role_id
         GROUP BY u.id
         ORDER BY u.created_at DESC`,
      ),
    );
    return c.json({
      ok: true,
      users: rows.map((row) => ({
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        status: row.status,
        roles: (row.roles ?? '').split(',').filter(Boolean),
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at,
      })),
    });
  });

  app.post('/api/users', async (c) => {
    const actor = requirePermission(c, 'users:manage');
    const body = await requireJsonBody<{ email: string; displayName: string; password?: string; role: RoleName }>(c.req.raw);
    const email = ensureEmail(body.email);
    const roleId = body.role === 'gerente' ? 'role_manager' : 'role_marketing_operator';
    if (!isGoogleOnlyAuth(c.env) && !body.password) {
      throw new HttpError(400, 'Senha obrigatoria para usuarios locais.');
    }
    if (body.password && !isGoogleOnlyAuth(c.env)) {
      requireStrongPassword(body.password);
    }
    const password = await hashPassword(body.password && !isGoogleOnlyAuth(c.env) ? body.password : randomToken(24));
    const userId = generateId('usr');
    await run(
      c.env.DB.prepare(
        `INSERT INTO users (id, email, password_hash, password_salt, password_iterations, display_name, status, auth_provider, email_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      ).bind(
        userId,
        email,
        password.hash,
        password.salt,
        password.iterations,
        body.displayName.trim(),
        isGoogleOnlyAuth(c.env) ? 'google' : 'local_password',
        isGoogleOnlyAuth(c.env) ? 1 : 0,
        nowIso(),
        nowIso(),
      ),
    );
    await run(c.env.DB.prepare('INSERT INTO user_roles (user_id, role_id, created_at) VALUES (?, ?, ?)').bind(userId, roleId, nowIso()));
    await auditLog(c.env, c.req.raw, actor.id, 'user.create', 'user', userId, { email, role: body.role });
    return c.json({ ok: true, userId });
  });

  app.put('/api/users/:id', async (c) => {
    const actor = requirePermission(c, 'users:manage');
    const userId = c.req.param('id');
    const body = await requireJsonBody<{ displayName: string; status: 'active' | 'disabled'; role: RoleName; resetPassword?: string }>(c.req.raw);
    await run(
      c.env.DB.prepare('UPDATE users SET display_name = ?, status = ?, updated_at = ? WHERE id = ?').bind(
        body.displayName.trim(),
        body.status,
        nowIso(),
        userId,
      ),
    );
    await run(c.env.DB.prepare('DELETE FROM user_roles WHERE user_id = ?').bind(userId));
    await run(
      c.env.DB.prepare('INSERT INTO user_roles (user_id, role_id, created_at) VALUES (?, ?, ?)').bind(
        userId,
        body.role === 'gerente' ? 'role_manager' : 'role_marketing_operator',
        nowIso(),
      ),
    );

    if (body.resetPassword) {
      requireStrongPassword(body.resetPassword);
      const password = await hashPassword(body.resetPassword);
      await run(
        c.env.DB.prepare(
          `UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ? WHERE id = ?`,
        ).bind(password.hash, password.salt, password.iterations, nowIso(), userId),
      );
    }

    await auditLog(c.env, c.req.raw, actor.id, 'user.update', 'user', userId, { status: body.status, role: body.role });
    return c.json({ ok: true });
  });

  app.get('/api/contacts', async (c) => {
    requirePermission(c, 'contacts:read');
    const search = parseAudienceFilter(c.req.query('search') ?? null);
    const status = parseAudienceFilter(c.req.query('status') ?? null);
    const source = parseAudienceFilter(c.req.query('source') ?? null);
    const clauses: string[] = [];
    const params: string[] = [];

    if (search) {
      clauses.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      clauses.push('status = ?');
      params.push(status);
    }
    if (source) {
      clauses.push('source = ?');
      params.push(source);
    }

    const sql = `SELECT
        c.*,
        cpl.external_id AS zoho_external_id,
        cpl.sync_status AS zoho_sync_status,
        cpl.last_synced_at AS zoho_last_synced_at,
        cpl.last_error AS zoho_last_error
      FROM contacts c
      LEFT JOIN contact_provider_links cpl
        ON cpl.contact_id = c.id
       AND cpl.provider = 'zoho_crm'
       AND cpl.provider_module = 'Contacts'
      ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
      ORDER BY c.created_at DESC
      LIMIT 500`;
    const rows = await all<ContactListRow>(c.env.DB.prepare(sql).bind(...params));
    return c.json({ ok: true, contacts: rows.map((row) => mapContact(row, isZohoConfigured(c.env))) });
  });

  app.post('/api/contacts', async (c) => {
    const actor = requirePermission(c, 'contacts:write');
    const body = await requireJsonBody<{
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      source?: string;
      tags?: string[];
      status?: string;
      optInStatus?: string;
    }>(c.req.raw);
    const email = ensureEmail(body.email);
    const contactId = generateId('ctc');
    await run(
      c.env.DB.prepare(
        `INSERT INTO contacts
          (id, email, first_name, last_name, phone, source, tags_json, status, opt_in_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        contactId,
        email,
        body.firstName?.trim() || null,
        body.lastName?.trim() || null,
        body.phone?.trim() || null,
        body.source?.trim() || null,
        asJson(body.tags ?? []),
        body.status ?? 'active',
        body.optInStatus ?? 'confirmed',
        nowIso(),
        nowIso(),
      ),
    );
    const contact = await first<ContactRecord>(c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(contactId));
    const zohoSync = contact ? await syncContactToZoho(c.env, contact) : { configured: isZohoConfigured(c.env), synced: false, externalId: null, error: null };
    await auditLog(c.env, c.req.raw, actor.id, 'contact.create', 'contact', contactId, { email, zohoSync });
    return c.json({ ok: true, contactId, zohoSync });
  });

  app.put('/api/contacts/:id', async (c) => {
    const actor = requirePermission(c, 'contacts:write');
    const contactId = c.req.param('id');
    const body = await requireJsonBody<{
      firstName?: string;
      lastName?: string;
      phone?: string;
      source?: string;
      tags?: string[];
      status?: string;
      optInStatus?: string;
    }>(c.req.raw);
    await run(
      c.env.DB.prepare(
        `UPDATE contacts
         SET first_name = ?, last_name = ?, phone = ?, source = ?, tags_json = ?, status = ?, opt_in_status = ?, updated_at = ?
         WHERE id = ?`,
      ).bind(
        body.firstName?.trim() || null,
        body.lastName?.trim() || null,
        body.phone?.trim() || null,
        body.source?.trim() || null,
        asJson(body.tags ?? []),
        body.status ?? 'active',
        body.optInStatus ?? 'confirmed',
        nowIso(),
        contactId,
      ),
    );
    const contact = await first<ContactRecord>(c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(contactId));
    const zohoSync = contact ? await syncContactToZoho(c.env, contact) : { configured: isZohoConfigured(c.env), synced: false, externalId: null, error: null };
    await auditLog(c.env, c.req.raw, actor.id, 'contact.update', 'contact', contactId, { ...body, zohoSync });
    return c.json({ ok: true, zohoSync });
  });

  app.get('/api/contacts/:id/history', async (c) => {
    requirePermission(c, 'contacts:read');
    const contactId = c.req.param('id');
    const sendHistory = await all<{
      created_at: string;
      status: string;
      campaign_id: string;
      error_message: string | null;
    }>(
      c.env.DB.prepare(
        `SELECT created_at, status, campaign_id, error_message
         FROM send_events
         WHERE contact_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
      ).bind(contactId),
    );
    const clicks = await all<{ created_at: string; campaign_id: string; link_id: string }>(
      c.env.DB.prepare(
        `SELECT created_at, campaign_id, link_id
         FROM campaign_click_events
         WHERE contact_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
      ).bind(contactId),
    );
    const unsubscribes = await all<{ created_at: string; campaign_id: string | null }>(
      c.env.DB.prepare(
        `SELECT created_at, campaign_id
         FROM unsubscribe_events
         WHERE contact_id = ?
         ORDER BY created_at DESC
         LIMIT 20`,
      ).bind(contactId),
    );

    const zohoLink = await getContactZohoLink(c.env, contactId);
    const publicInteractions = await all<{
      created_at: string;
      event_name: string;
      event_category: string;
      source: string;
      channel: string | null;
      href: string | null;
      label: string | null;
    }>(
      c.env.DB.prepare(
        `SELECT created_at, event_name, event_category, source, channel, href, label
         FROM public_interaction_events
         WHERE contact_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
      ).bind(contactId),
    );

    return c.json({
      ok: true,
      sendHistory,
      clicks,
      unsubscribes,
      publicInteractions,
      zoho: zohoLink
        ? {
            externalId: zohoLink.external_id,
            status: zohoLink.sync_status,
            lastSyncedAt: zohoLink.last_synced_at,
            lastError: zohoLink.last_error,
          }
        : null,
    });
  });

  app.post('/api/contacts/import', async (c) => {
    const actor = requirePermission(c, 'contacts:write');
    const body = await requireJsonBody<{
      csvText: string;
      mapping: Record<string, string>;
      listId?: string | null;
      tags?: string[];
      source?: string;
    }>(c.req.raw);

    const rows = parseCsvText(body.csvText);
    if (rows.length < 2) {
      throw new HttpError(400, 'CSV vazio ou sem cabecalho.');
    }

    const [headers, ...entries] = rows;
    const importId = generateId('imp');
    const errors: string[] = [];
    let importedRows = 0;
    let skippedRows = 0;

    for (const [index, entry] of entries.entries()) {
      const values = Object.fromEntries(headers.map((header, headerIndex) => [header, entry[headerIndex] ?? '']));
      const emailField = body.mapping.email;
      const rawEmail = values[emailField];

      try {
        const email = ensureEmail(rawEmail, `Linha ${index + 2}: e-mail invalido.`);
        const existing = await first<{ id: string }>(c.env.DB.prepare('SELECT id FROM contacts WHERE email = ?').bind(email));
        const tags = new Set<string>(body.tags ?? []);
        if (body.mapping.tags && values[body.mapping.tags]) {
          for (const tag of values[body.mapping.tags].split(/[;,|]/).map((item) => item.trim()).filter(Boolean)) {
            tags.add(tag);
          }
        }

        const firstName = body.mapping.first_name ? values[body.mapping.first_name] : '';
        const lastName = body.mapping.last_name ? values[body.mapping.last_name] : '';
        const phone = body.mapping.phone ? values[body.mapping.phone] : '';
        const source = body.mapping.source ? values[body.mapping.source] : body.source ?? 'csv_import';
        const optInStatus = body.mapping.opt_in_status ? values[body.mapping.opt_in_status] || 'confirmed' : 'confirmed';

        const contactId = existing?.id ?? generateId('ctc');
        if (existing) {
          await run(
            c.env.DB.prepare(
              `UPDATE contacts
               SET first_name = COALESCE(NULLIF(?, ''), first_name),
                   last_name = COALESCE(NULLIF(?, ''), last_name),
                   phone = COALESCE(NULLIF(?, ''), phone),
                   source = COALESCE(NULLIF(?, ''), source),
                   tags_json = ?,
                   updated_at = ?
               WHERE id = ?`,
            ).bind(firstName, lastName, phone, source, asJson([...tags]), nowIso(), existing.id),
          );
          const contact = await first<ContactRecord>(c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(existing.id));
          if (contact) {
            await syncContactToZoho(c.env, contact);
          }
          skippedRows += 1;
        } else {
          await run(
            c.env.DB.prepare(
              `INSERT INTO contacts
                (id, email, first_name, last_name, phone, source, tags_json, status, opt_in_status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
            ).bind(contactId, email, firstName || null, lastName || null, phone || null, source || null, asJson([...tags]), optInStatus, nowIso(), nowIso()),
          );
          const contact = await first<ContactRecord>(c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(contactId));
          if (contact) {
            await syncContactToZoho(c.env, contact);
          }
          importedRows += 1;
        }

        if (body.listId) {
          await run(
            c.env.DB.prepare(
              `INSERT OR IGNORE INTO contact_list_items (id, list_id, contact_id, created_at)
               VALUES (?, ?, ?, ?)`,
            ).bind(generateId('cli'), body.listId, contactId, nowIso()),
          );
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : `Linha ${index + 2}: falha desconhecida.`);
      }
    }

    await run(
      c.env.DB.prepare(
        `INSERT INTO csv_imports
          (id, created_by_user_id, original_filename, total_rows, imported_rows, skipped_rows, error_rows, mapping_json, errors_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(importId, actor.id, 'upload.csv', entries.length, importedRows, skippedRows, errors.length, asJson(body.mapping), asJson(errors), nowIso()),
    );
    await auditLog(c.env, c.req.raw, actor.id, 'contacts.import_csv', 'csv_import', importId, {
      importedRows,
      skippedRows,
      errorRows: errors.length,
    });

    return c.json({
      ok: true,
      importId,
      importedRows,
      updatedRows: skippedRows,
      errors,
    });
  });

  app.post('/api/contacts/sync/zoho', async (c) => {
    const actor = requirePermission(c, 'contacts:write');
    const body = await requireJsonBody<{ contactIds?: string[] }>(c.req.raw).catch(() => ({} as { contactIds?: string[] }));
    const rows = body.contactIds?.length
      ? await all<ContactRecord>(
          c.env.DB.prepare(
            `SELECT * FROM contacts
             WHERE id IN (${body.contactIds.map(() => '?').join(',')})
             ORDER BY created_at DESC`,
          ).bind(...body.contactIds),
        )
      : await all<ContactRecord>(c.env.DB.prepare('SELECT * FROM contacts ORDER BY created_at DESC LIMIT 500'));

    const results: Array<{ contactId: string; email: string; synced: boolean; externalId: string | null; error: string | null }> = [];
    for (const row of rows) {
      const sync = await syncContactToZoho(c.env, row);
      results.push({
        contactId: row.id,
        email: row.email,
        synced: sync.synced,
        externalId: sync.externalId,
        error: sync.error,
      });
    }

    await auditLog(c.env, c.req.raw, actor.id, 'contact.sync_zoho_batch', 'contact', null, {
      requested: body.contactIds?.length ?? rows.length,
      synced: results.filter((item) => item.synced).length,
      failed: results.filter((item) => !item.synced).length,
    });

    return c.json({
      ok: true,
      total: results.length,
      synced: results.filter((item) => item.synced).length,
      failed: results.filter((item) => !item.synced).length,
      results,
    });
  });

  app.get('/api/lists', async (c) => {
    requirePermission(c, 'lists:read');
    const rows = await all<{
      id: string;
      name: string;
      description: string | null;
      kind: string;
      created_at: string;
      updated_at: string;
      contact_count: number;
    }>(
      c.env.DB.prepare(
        `SELECT cl.id, cl.name, cl.description, cl.kind, cl.created_at, cl.updated_at, COUNT(cli.id) AS contact_count
         FROM contact_lists cl
         LEFT JOIN contact_list_items cli ON cli.list_id = cl.id
         GROUP BY cl.id
         ORDER BY cl.created_at DESC`,
      ),
    );
    return c.json({ ok: true, lists: rows });
  });

  app.post('/api/lists', async (c) => {
    const actor = requirePermission(c, 'lists:write');
    const body = await requireJsonBody<{ name: string; description?: string; contactIds?: string[] }>(c.req.raw);
    const listId = generateId('lst');
    await run(
      c.env.DB.prepare(
        `INSERT INTO contact_lists (id, name, description, kind, created_by_user_id, created_at, updated_at)
         VALUES (?, ?, ?, 'static', ?, ?, ?)`,
      ).bind(listId, body.name.trim(), body.description?.trim() || null, actor.id, nowIso(), nowIso()),
    );
    for (const contactId of body.contactIds ?? []) {
      await run(
        c.env.DB.prepare(
          `INSERT OR IGNORE INTO contact_list_items (id, list_id, contact_id, created_at)
           VALUES (?, ?, ?, ?)`,
        ).bind(generateId('cli'), listId, contactId, nowIso()),
      );
    }
    await auditLog(c.env, c.req.raw, actor.id, 'list.create', 'contact_list', listId, { contactCount: body.contactIds?.length ?? 0 });
    return c.json({ ok: true, listId });
  });

  app.put('/api/lists/:id', async (c) => {
    const actor = requirePermission(c, 'lists:write');
    const listId = c.req.param('id');
    const body = await requireJsonBody<{ name: string; description?: string; contactIds?: string[] }>(c.req.raw);
    await run(
      c.env.DB.prepare('UPDATE contact_lists SET name = ?, description = ?, updated_at = ? WHERE id = ?').bind(
        body.name.trim(),
        body.description?.trim() || null,
        nowIso(),
        listId,
      ),
    );
    if (body.contactIds) {
      await run(c.env.DB.prepare('DELETE FROM contact_list_items WHERE list_id = ?').bind(listId));
      for (const contactId of body.contactIds) {
        await run(
          c.env.DB.prepare(
            `INSERT INTO contact_list_items (id, list_id, contact_id, created_at)
             VALUES (?, ?, ?, ?)`,
          ).bind(generateId('cli'), listId, contactId, nowIso()),
        );
      }
    }
    await auditLog(c.env, c.req.raw, actor.id, 'list.update', 'contact_list', listId, { contactCount: body.contactIds?.length ?? undefined });
    return c.json({ ok: true });
  });

  app.get('/api/segments', async (c) => {
    requirePermission(c, 'segments:read');
    const rows = await all<{
      id: string;
      name: string;
      description: string | null;
      rules_json: string;
      created_at: string;
      updated_at: string;
    }>(c.env.DB.prepare('SELECT * FROM segments ORDER BY created_at DESC'));
    return c.json({
      ok: true,
      segments: rows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        rules: parseJsonText<SegmentDefinition>(row.rules_json, { match: 'all', conditions: [] }),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  });

  app.post('/api/segments', async (c) => {
    const actor = requirePermission(c, 'segments:write');
    const body = await requireJsonBody<{ name: string; description?: string; rules: SegmentDefinition }>(c.req.raw);
    const segmentId = generateId('seg');
    await run(
      c.env.DB.prepare(
        `INSERT INTO segments (id, name, description, rules_json, created_by_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(segmentId, body.name.trim(), body.description?.trim() || null, asJson(body.rules), actor.id, nowIso(), nowIso()),
    );
    await auditLog(c.env, c.req.raw, actor.id, 'segment.create', 'segment', segmentId, body.rules);
    return c.json({ ok: true, segmentId });
  });

  app.put('/api/segments/:id', async (c) => {
    const actor = requirePermission(c, 'segments:write');
    const segmentId = c.req.param('id');
    const body = await requireJsonBody<{ name: string; description?: string; rules: SegmentDefinition }>(c.req.raw);
    await run(
      c.env.DB.prepare(
        `UPDATE segments
         SET name = ?, description = ?, rules_json = ?, updated_at = ?
         WHERE id = ?`,
      ).bind(body.name.trim(), body.description?.trim() || null, asJson(body.rules), nowIso(), segmentId),
    );
    await auditLog(c.env, c.req.raw, actor.id, 'segment.update', 'segment', segmentId, body.rules);
    return c.json({ ok: true });
  });

  app.get('/api/templates', async (c) => {
    requirePermission(c, 'templates:manage');
    const rows = await all<{
      id: string;
      name: string;
      subject: string;
      preheader: string | null;
      html_content: string;
      text_content: string;
      variables_json: string;
      created_at: string;
      updated_at: string;
    }>(c.env.DB.prepare('SELECT * FROM templates ORDER BY updated_at DESC'));
    return c.json({
      ok: true,
      templates: rows.map((row) => ({
        id: row.id,
        name: row.name,
        subject: row.subject,
        preheader: row.preheader ?? '',
        html: row.html_content,
        text: row.text_content,
        variables: parseJsonText<string[]>(row.variables_json, []),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  });

  app.post('/api/templates', async (c) => {
    const actor = requirePermission(c, 'templates:manage');
    const body = await requireJsonBody<{ name: string; subject: string; preheader?: string; html: string; text: string }>(c.req.raw);
    const variables = Array.from(new Set([...extractMergeVariables(body.html), ...extractMergeVariables(body.text), ...RESERVED_TEMPLATE_VARIABLES])).sort();
    const templateId = generateId('tpl');
    await run(
      c.env.DB.prepare(
        `INSERT INTO templates
          (id, name, subject, preheader, html_content, text_content, variables_json, created_by_user_id, updated_by_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(templateId, body.name.trim(), body.subject.trim(), body.preheader?.trim() || null, body.html, body.text, asJson(variables), actor.id, actor.id, nowIso(), nowIso()),
    );
    await auditLog(c.env, c.req.raw, actor.id, 'template.create', 'template', templateId, { variables });
    return c.json({ ok: true, templateId });
  });

  app.put('/api/templates/:id', async (c) => {
    const actor = requirePermission(c, 'templates:manage');
    const templateId = c.req.param('id');
    const body = await requireJsonBody<{ name: string; subject: string; preheader?: string; html: string; text: string }>(c.req.raw);
    const variables = Array.from(new Set([...extractMergeVariables(body.html), ...extractMergeVariables(body.text), ...RESERVED_TEMPLATE_VARIABLES])).sort();
    await run(
      c.env.DB.prepare(
        `UPDATE templates
         SET name = ?, subject = ?, preheader = ?, html_content = ?, text_content = ?, variables_json = ?, updated_by_user_id = ?, updated_at = ?
         WHERE id = ?`,
      ).bind(templateId, body.name.trim(), body.subject.trim(), body.preheader?.trim() || null, body.html, body.text, asJson(variables), actor.id, nowIso(), templateId),
    );
    await auditLog(c.env, c.req.raw, actor.id, 'template.update', 'template', templateId, { variables });
    return c.json({ ok: true });
  });

  app.post('/api/templates/:id/test-send', async (c) => {
    requirePermission(c, 'templates:manage');
    const templateId = c.req.param('id');
    const template = await getTemplate(c.env, templateId);
    const body = await requireJsonBody<{ emails: string[]; subject?: string }>(c.req.raw);

    for (const rawEmail of body.emails) {
      const email = ensureEmail(rawEmail);
      const merged = prepareTemplateContent(template.html_content, template.text_content, {
        first_name: 'Teste',
        email,
        unsubscribe_url: `${c.env.APP_BASE_URL}/unsubscribe/teste`,
        campaign_name: 'Teste de template',
      });

      await sendViaGmail(c.env, {
        fromName: getConfiguredSenderName(c.env),
        fromEmail: c.env.GMAIL_SENDER_EMAIL || c.env.DEFAULT_FROM_EMAIL,
        to: email,
        subject: body.subject?.trim() || template.subject,
        replyTo: c.env.DEFAULT_REPLY_TO,
        html: merged.html,
        text: merged.text,
        listUnsubscribeUrl: `${c.env.APP_BASE_URL}/unsubscribe/teste`,
      });
    }

    return c.json({ ok: true, sent: body.emails.length });
  });

  app.get('/api/campaigns', async (c) => {
    requirePermission(c, 'campaigns:read');
    const rows = await all<CampaignRecord>(c.env.DB.prepare('SELECT * FROM campaigns ORDER BY created_at DESC'));
    return c.json({ ok: true, campaigns: rows.map((row) => mapCampaign(row)) });
  });

  app.get('/api/campaigns/:id', async (c) => {
    requirePermission(c, 'campaigns:read');
    const campaign = await getCampaign(c.env, c.req.param('id'));
    const template = await getTemplate(c.env, campaign.template_id);
    const recipients = await first<{ total: number }>(
      c.env.DB.prepare('SELECT COUNT(*) AS total FROM campaign_recipients WHERE campaign_id = ?').bind(campaign.id),
    );
    return c.json({
      ok: true,
      campaign: {
        ...mapCampaign(campaign),
        templateName: template.name,
        estimatedRecipients: recipients?.total ?? campaign.total_recipients,
      },
    });
  });

  app.post('/api/campaigns', async (c) => {
    const actor = requirePermission(c, 'campaigns:write');
    const sendingSettings = await readSetting(c.env, 'sending', {
      batchSize: parseNumber(c.env.SEND_BATCH_SIZE, 25),
      ratePerMinute: parseNumber(c.env.SEND_RATE_PER_MINUTE, 45),
      pauseMs: parseNumber(c.env.SEND_PAUSE_MS, 1500),
      campaignMaxRecipients: parseNumber(c.env.CAMPAIGN_MAX_RECIPIENTS, 5000),
    });
    const body = await requireJsonBody<{
      name: string;
      subject: string;
      preheader?: string;
      templateId: string;
      segmentId?: string | null;
      listId?: string | null;
      fromName?: string;
      fromEmail?: string;
      replyTo?: string | null;
      scheduledAt?: string | null;
    }>(c.req.raw);

    const campaignId = generateId('cmp');
    await run(
      c.env.DB.prepare(
        `INSERT INTO campaigns
          (id, name, subject, preheader, template_id, segment_id, list_id, from_name, from_email, reply_to, status, scheduled_at,
           send_batch_size, send_rate_per_minute, send_pause_ms, max_recipients, created_by_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        campaignId,
        body.name.trim(),
        body.subject.trim(),
        body.preheader?.trim() || null,
        body.templateId,
        body.segmentId ?? null,
        body.listId ?? null,
        body.fromName?.trim() || getConfiguredSenderName(c.env),
        body.fromEmail?.trim() || c.env.GMAIL_SENDER_EMAIL || c.env.DEFAULT_FROM_EMAIL,
        body.replyTo?.trim() || c.env.DEFAULT_REPLY_TO || null,
        body.scheduledAt ?? null,
        sendingSettings.batchSize,
        sendingSettings.ratePerMinute,
        sendingSettings.pauseMs,
        sendingSettings.campaignMaxRecipients,
        actor.id,
        nowIso(),
        nowIso(),
      ),
    );
    await auditLog(c.env, c.req.raw, actor.id, 'campaign.create', 'campaign', campaignId, {
      segmentId: body.segmentId ?? null,
      listId: body.listId ?? null,
    });
    return c.json({ ok: true, campaignId });
  });

  app.post('/api/campaigns/quick-send', async (c) => {
    const actor = requirePermission(c, 'campaigns:send');
    const sendingSettings = await readSetting(c.env, 'sending', {
      batchSize: parseNumber(c.env.SEND_BATCH_SIZE, 25),
      ratePerMinute: parseNumber(c.env.SEND_RATE_PER_MINUTE, 45),
      pauseMs: parseNumber(c.env.SEND_PAUSE_MS, 1500),
      campaignMaxRecipients: parseNumber(c.env.CAMPAIGN_MAX_RECIPIENTS, 5000),
    });
    const body = await requireJsonBody<{
      emails: string[];
      templateId: string;
      salutationMode?: 'personalized' | 'generic';
      campaignName?: string;
      subject?: string;
    }>(c.req.raw);

    const normalizedEmails = [...new Set((body.emails ?? []).map((email) => ensureEmail(email)).filter(Boolean))];
    if (normalizedEmails.length === 0) {
      throw new HttpError(400, 'Informe ao menos um e-mail de destino para o disparador.');
    }

    const template = await getTemplate(c.env, body.templateId);
    const contacts = await all<ContactRecord>(
      c.env.DB.prepare(
        `SELECT * FROM contacts
         WHERE email IN (${normalizedEmails.map(() => '?').join(',')})`,
      ).bind(...normalizedEmails),
    );

    const mappedContacts = contacts.map((row) => mapContact(row));
    const foundEmails = new Set(mappedContacts.map((contact) => normalizeEmail(contact.email)));
    const missingEmails = normalizedEmails.filter((email) => !foundEmails.has(normalizeEmail(email)));
    const eligibleContacts = await filterEligibleContacts(c.env, mappedContacts);
    if (eligibleContacts.length === 0) {
      throw new HttpError(400, 'Nenhum contato elegivel foi encontrado para este disparo rapido.');
    }

    const campaignId = generateId('cmp');
    const campaignName = body.campaignName?.trim() || `Disparo rapido ${new Date().toLocaleString('pt-BR')}`;
    const subject = body.subject?.trim() || template.subject;

    await run(
      c.env.DB.prepare(
        `INSERT INTO campaigns
          (id, name, subject, preheader, template_id, segment_id, list_id, from_name, from_email, reply_to, status, scheduled_at,
           send_batch_size, send_rate_per_minute, send_pause_ms, max_recipients, created_by_user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, null, null, ?, ?, ?, 'draft', null, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        campaignId,
        campaignName,
        subject,
        template.preheader ?? null,
        template.id,
        getConfiguredSenderName(c.env),
        c.env.GMAIL_SENDER_EMAIL || c.env.DEFAULT_FROM_EMAIL,
        c.env.DEFAULT_REPLY_TO || null,
        sendingSettings.batchSize,
        sendingSettings.ratePerMinute,
        sendingSettings.pauseMs,
        sendingSettings.campaignMaxRecipients,
        actor.id,
        nowIso(),
        nowIso(),
      ),
    );

    const campaign = await getCampaign(c.env, campaignId);
    const recipientCount = await queueSpecificRecipients(c.env, campaign, eligibleContacts, {
      salutationMode: body.salutationMode === 'generic' ? 'generic' : 'personalized',
    });

    await run(
      c.env.DB.prepare(
        `UPDATE campaigns
         SET status = 'sending', started_at = COALESCE(started_at, ?), updated_at = ?
         WHERE id = ?`,
      ).bind(nowIso(), nowIso(), campaignId),
    );

    const processed = await processCampaignQueue(c.env, c.req.raw, campaignId);
    await auditLog(c.env, c.req.raw, actor.id, 'campaign.quick_send', 'campaign', campaignId, {
      recipientCount,
      missingEmails,
      salutationMode: body.salutationMode === 'generic' ? 'generic' : 'personalized',
      templateId: template.id,
    });

    return c.json({
      ok: true,
      campaignId,
      recipientCount,
      missingEmails,
      processed,
    });
  });

  app.put('/api/campaigns/:id', async (c) => {
    const actor = requirePermission(c, 'campaigns:write');
    const campaignId = c.req.param('id');
    const body = await requireJsonBody<{
      name: string;
      subject: string;
      preheader?: string;
      templateId: string;
      segmentId?: string | null;
      listId?: string | null;
      fromName: string;
      fromEmail: string;
      replyTo?: string | null;
      scheduledAt?: string | null;
      status?: string;
      sendBatchSize?: number;
      sendRatePerMinute?: number;
      maxRecipients?: number;
    }>(c.req.raw);
    await run(
      c.env.DB.prepare(
        `UPDATE campaigns
         SET name = ?, subject = ?, preheader = ?, template_id = ?, segment_id = ?, list_id = ?, from_name = ?, from_email = ?, reply_to = ?,
             scheduled_at = ?, status = COALESCE(?, status), send_batch_size = COALESCE(?, send_batch_size),
             send_rate_per_minute = COALESCE(?, send_rate_per_minute), max_recipients = COALESCE(?, max_recipients),
             updated_at = ?
         WHERE id = ?`,
      ).bind(
        body.name.trim(),
        body.subject.trim(),
        body.preheader?.trim() || null,
        body.templateId,
        body.segmentId ?? null,
        body.listId ?? null,
        body.fromName.trim(),
        body.fromEmail.trim(),
        body.replyTo?.trim() || null,
        body.scheduledAt ?? null,
        body.status ?? null,
        body.sendBatchSize ?? null,
        body.sendRatePerMinute ?? null,
        body.maxRecipients ?? null,
        nowIso(),
        campaignId,
      ),
    );
    await auditLog(c.env, c.req.raw, actor.id, 'campaign.update', 'campaign', campaignId, body);
    return c.json({ ok: true });
  });

  app.post('/api/campaigns/:id/send-test', async (c) => {
    requirePermission(c, 'campaigns:write');
    const campaign = await getCampaign(c.env, c.req.param('id'));
    const template = await getTemplate(c.env, campaign.template_id);
    const body = await requireJsonBody<{ emails: string[] }>(c.req.raw);
    for (const rawEmail of body.emails) {
      const email = ensureEmail(rawEmail);
      const rendered = prepareTemplateContent(template.html_content, template.text_content, {
        first_name: 'Teste',
        email,
        unsubscribe_url: `${c.env.APP_BASE_URL}/unsubscribe/teste`,
        campaign_name: campaign.name,
      });
      await sendViaGmail(c.env, {
        fromName: campaign.from_name,
        fromEmail: campaign.from_email,
        to: email,
        subject: campaign.subject,
        replyTo: campaign.reply_to,
        html: rendered.html,
        text: rendered.text,
        listUnsubscribeUrl: `${c.env.APP_BASE_URL}/unsubscribe/teste`,
      });
    }
    return c.json({ ok: true, sent: body.emails.length });
  });

  app.post('/api/campaigns/:id/launch', async (c) => {
    const actor = requirePermission(c, 'campaigns:send');
    const campaign = await getCampaign(c.env, c.req.param('id'));
    if (!['draft', 'scheduled', 'failed', 'paused'].includes(campaign.status)) {
      throw new HttpError(400, 'A campanha nao pode ser preparada para envio neste estado.');
    }
    const body = await requireJsonBody<{ scheduledAt?: string | null }>(c.req.raw);
    const recipientCount = await queueCampaignRecipients(c.env, campaign);
    const nextStatus = body.scheduledAt ? 'scheduled' : 'sending';
    await run(
      c.env.DB.prepare(
        `UPDATE campaigns
         SET status = ?, scheduled_at = ?, started_at = CASE WHEN ? = 'sending' THEN COALESCE(started_at, ?) ELSE started_at END, updated_at = ?
         WHERE id = ?`,
      ).bind(nextStatus, body.scheduledAt ?? null, nextStatus, nowIso(), nowIso(), campaign.id),
    );
    await auditLog(c.env, c.req.raw, actor.id, 'campaign.launch', 'campaign', campaign.id, {
      recipientCount,
      scheduledAt: body.scheduledAt ?? null,
    });
    const processed = body.scheduledAt ? [] : await processCampaignQueue(c.env, c.req.raw, campaign.id);
    return c.json({ ok: true, recipientCount, processed });
  });

  app.post('/api/campaigns/:id/process', async (c) => {
    requirePermission(c, 'campaigns:send');
    const summaries = await processCampaignQueue(c.env, c.req.raw, c.req.param('id'));
    return c.json({ ok: true, summaries });
  });

  app.post('/api/campaigns/:id/pause', async (c) => {
    const actor = requirePermission(c, 'campaigns:send');
    await run(c.env.DB.prepare(`UPDATE campaigns SET status = 'paused', updated_at = ? WHERE id = ?`).bind(nowIso(), c.req.param('id')));
    await auditLog(c.env, c.req.raw, actor.id, 'campaign.pause', 'campaign', c.req.param('id'), {});
    return c.json({ ok: true });
  });

  app.post('/api/campaigns/:id/cancel', async (c) => {
    const actor = requirePermission(c, 'campaigns:send');
    await run(
      c.env.DB.prepare(`UPDATE campaigns SET status = 'cancelled', finished_at = ?, updated_at = ? WHERE id = ?`).bind(
        nowIso(),
        nowIso(),
        c.req.param('id'),
      ),
    );
    await auditLog(c.env, c.req.raw, actor.id, 'campaign.cancel', 'campaign', c.req.param('id'), {});
    return c.json({ ok: true });
  });

  app.get('/api/campaigns/:id/metrics', async (c) => {
    requirePermission(c, 'reports:read');
    const campaignId = c.req.param('id');
    await refreshCampaignStats(c.env, campaignId);
    const campaign = await getCampaign(c.env, campaignId);
    const topLinks = await all<{
      id: string;
      original_url: string;
      click_count_total: number;
      click_count_unique: number;
    }>(
      c.env.DB.prepare(
        `SELECT id, original_url, click_count_total, click_count_unique
         FROM campaign_links
         WHERE campaign_id = ?
         ORDER BY click_count_unique DESC, click_count_total DESC`,
      ).bind(campaignId),
    );
    const recipients = await all<{
      email_snapshot: string;
      status: string;
      sent_at: string | null;
      opened_at: string | null;
      clicked_at: string | null;
      unsubscribed_at: string | null;
      last_error: string | null;
    }>(
      c.env.DB.prepare(
        `SELECT email_snapshot, status, sent_at, opened_at, clicked_at, unsubscribed_at, last_error
         FROM campaign_recipients
         WHERE campaign_id = ?
         ORDER BY created_at ASC`,
      ).bind(campaignId),
    );
    return c.json({
      ok: true,
      campaign: mapCampaign(campaign),
      metrics: {
        recipients: campaign.total_recipients,
        sent: campaign.total_sent,
        failed: campaign.total_failed,
        opensTotal: campaign.total_open_events,
        opensUnique: campaign.total_unique_opens,
        openedContacts: campaign.total_opened,
        clicksTotal: campaign.total_click_events,
        clicksUnique: campaign.total_unique_clicks,
        clickedContacts: campaign.total_clicked,
        unsubscribed: campaign.total_unsubscribed,
        openRate: campaign.total_sent ? Number(((campaign.total_unique_opens / campaign.total_sent) * 100).toFixed(2)) : 0,
        ctr: campaign.total_sent ? Number(((campaign.total_unique_clicks / campaign.total_sent) * 100).toFixed(2)) : 0,
        deliveryObservedRate: campaign.total_sent ? Number((campaign.delivery_observed_rate * 100).toFixed(2)) : 0,
      },
      topLinks,
      recipients,
    });
  });

  app.get('/api/reports/dashboard', async (c) => {
    requirePermission(c, 'dashboard:read');
    const [campaigns, contacts, opens, clicks, failures, unsubscribes, period] = await Promise.all([
      first<{ total: number }>(c.env.DB.prepare('SELECT COUNT(*) AS total FROM campaigns')),
      first<{ total: number }>(c.env.DB.prepare(`SELECT COUNT(*) AS total FROM contacts WHERE status = 'active'`)),
      first<{ total: number }>(c.env.DB.prepare('SELECT COUNT(*) AS total FROM campaign_open_events')),
      first<{ total: number }>(c.env.DB.prepare('SELECT COUNT(*) AS total FROM campaign_click_events')),
      first<{ total: number }>(c.env.DB.prepare(`SELECT COUNT(*) AS total FROM send_events WHERE status = 'failed'`)),
      first<{ total: number }>(c.env.DB.prepare('SELECT COUNT(*) AS total FROM unsubscribe_events')),
      all<{ day: string; total: number }>(
        c.env.DB.prepare(
          `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS total
           FROM send_events
           WHERE created_at >= ?
           GROUP BY substr(created_at, 1, 10)
           ORDER BY day ASC`,
        ).bind(new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString()),
      ),
    ]);

    const totalSentRow = await first<{ total: number }>(c.env.DB.prepare(`SELECT COUNT(*) AS total FROM send_events WHERE status = 'success'`));
    return c.json({
      ok: true,
      metrics: {
        campaignsSent: campaigns?.total ?? 0,
        activeContacts: contacts?.total ?? 0,
        totalOpens: opens?.total ?? 0,
        openRate: (totalSentRow?.total ?? 0) > 0 ? Number((((opens?.total ?? 0) / Math.max(totalSentRow?.total ?? 0, 1)) * 100).toFixed(2)) : 0,
        totalClicks: clicks?.total ?? 0,
        ctr: (totalSentRow?.total ?? 0) > 0 ? Number((((clicks?.total ?? 0) / Math.max(totalSentRow?.total ?? 0, 1)) * 100).toFixed(2)) : 0,
        failures: failures?.total ?? 0,
        unsubscribes: unsubscribes?.total ?? 0,
        sentByPeriod: period,
      },
    });
  });

  app.get('/api/audit-logs', async (c) => {
    requirePermission(c, 'audit:read');
    const rows = await all<{
      id: string;
      user_id: string | null;
      action: string;
      entity_type: string;
      entity_id: string | null;
      metadata_json: string;
      ip: string | null;
      user_agent: string | null;
      created_at: string;
      display_name: string | null;
      email: string | null;
    }>(
      c.env.DB.prepare(
        `SELECT a.*, u.display_name, u.email
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.user_id
         ORDER BY a.created_at DESC
         LIMIT 300`,
      ),
    );
    return c.json({
      ok: true,
      logs: rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        actor: row.display_name || row.email || 'sistema',
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        metadata: parseJsonText<Record<string, unknown>>(row.metadata_json, {}),
        ip: row.ip,
        userAgent: row.user_agent,
        createdAt: row.created_at,
      })),
    });
  });

  app.get('/api/settings', async (c) => {
    requirePermission(c, 'settings:manage');
    const checklist = await buildDeliverabilityChecklist(c.env);
    const gmailOauthConnection = await readGmailOAuthConnection(c.env);
    const metaConnector = await readMetaConnectorSettings(c.env);
    const googleAdsConnector = await readGoogleAdsConnectorSettings(c.env);
    const sending = await readSetting(c.env, 'sending', {
      batchSize: parseNumber(c.env.SEND_BATCH_SIZE, 25),
      ratePerMinute: parseNumber(c.env.SEND_RATE_PER_MINUTE, 45),
      pauseMs: parseNumber(c.env.SEND_PAUSE_MS, 1500),
      campaignMaxRecipients: parseNumber(c.env.CAMPAIGN_MAX_RECIPIENTS, 5000),
      retryLimit: 2,
    });
    const deliverability = await readSetting(c.env, 'deliverability', {});
    const gmailConfigured = Boolean(c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET && (gmailOauthConnection?.refreshToken || c.env.GOOGLE_REFRESH_TOKEN));
    const activeGmailConnection = gmailOauthConnection?.refreshToken ? gmailOauthConnection : null;
    const metaReady = isMetaConfigured(c.env);
    const metaGraphReady = isMetaGraphConfigured(c.env);
    const googleAdsReady = isGoogleAdsConfigured(c.env);
    const latestMetaSync = await first<{ status: string; started_at: string; finished_at: string | null; error: string | null; summary_json: string }>(
      c.env.DB.prepare(
        `SELECT status, started_at, finished_at, error, summary_json
         FROM ad_platform_sync_runs
         WHERE provider = 'meta'
         ORDER BY started_at DESC
         LIMIT 1`,
      ),
    );
    const latestGoogleAdsSync = await first<{ status: string; started_at: string; finished_at: string | null; error: string | null; summary_json: string }>(
      c.env.DB.prepare(
        `SELECT status, started_at, finished_at, error, summary_json
         FROM ad_platform_sync_runs
         WHERE provider = 'google_ads'
         ORDER BY started_at DESC
         LIMIT 1`,
      ),
    );
    const metaCampaignStats = await first<{ total: number; last_synced_at: string | null }>(
      c.env.DB.prepare(
        `SELECT COUNT(*) AS total, MAX(synced_at) AS last_synced_at
         FROM ad_platform_campaign_metrics
         WHERE provider = 'meta'`,
      ),
    );
    const metaLeadStats = await first<{ total: number; synced_contacts: number; last_lead_at: string | null }>(
      c.env.DB.prepare(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN synced_to_contact = 1 THEN 1 ELSE 0 END) AS synced_contacts,
                MAX(lead_created_at) AS last_lead_at
         FROM ad_platform_leads
         WHERE provider = 'meta'`,
      ),
    );
    const googleCampaignStats = await first<{ total: number; last_synced_at: string | null }>(
      c.env.DB.prepare(
        `SELECT COUNT(*) AS total, MAX(synced_at) AS last_synced_at
         FROM ad_platform_campaign_metrics
         WHERE provider = 'google_ads'`,
      ),
    );
    const googleConversionStats = await first<{ total: number; success_count: number; last_upload_at: string | null }>(
      c.env.DB.prepare(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_count,
                MAX(created_at) AS last_upload_at
         FROM ad_platform_conversion_uploads
         WHERE provider = 'google_ads'`,
      ),
    );
    let metaStatus = {
      configured: metaReady,
      graphConfigured: metaGraphReady,
      apiVersion: c.env.META_GRAPH_API_VERSION || 'v22.0',
      pixelId: getMetaPixelId(c.env),
      pixelName: null as string | null,
      adAccountId: metaConnector.adAccountId ?? null,
      leadFormIds: metaConnector.leadFormIds ?? [],
      autoCreateContacts: metaConnector.autoCreateContacts !== false,
      lookbackDays: metaConnector.lookbackDays ?? DEFAULT_META_LOOKBACK_DAYS,
      campaignsIndexed: Number(metaCampaignStats?.total ?? 0),
      leadsIndexed: Number(metaLeadStats?.total ?? 0),
      leadsSyncedToContacts: Number(metaLeadStats?.synced_contacts ?? 0),
      lastLeadAt: metaLeadStats?.last_lead_at ?? null,
      lastSyncedAt: metaCampaignStats?.last_synced_at ?? null,
      lastSync: latestMetaSync
        ? {
            status: latestMetaSync.status,
            startedAt: latestMetaSync.started_at,
            finishedAt: latestMetaSync.finished_at,
            error: latestMetaSync.error,
            summary: parseJsonText<Record<string, unknown>>(latestMetaSync.summary_json, {}),
          }
        : null,
      error: null as string | null,
    };
    if (metaGraphReady) {
      try {
        const pixel = await getMetaPixelSummary(c.env);
        metaStatus.pixelName = pixel.name;
      } catch (error) {
        metaStatus.error = error instanceof Error ? error.message : 'Falha ao validar a Meta.';
      }
    }

    let googleAdsStatus = {
      configured: googleAdsReady,
      apiVersion: c.env.GOOGLE_ADS_API_VERSION || 'v20',
      customerId: googleAdsConnector.customerId ?? null,
      loginCustomerId: googleAdsConnector.loginCustomerId ?? null,
      conversionAction: googleAdsConnector.conversionAction ?? null,
      lookbackDays: googleAdsConnector.lookbackDays ?? DEFAULT_GOOGLE_ADS_LOOKBACK_DAYS,
      autoUploadLeadConversions: googleAdsConnector.autoUploadLeadConversions !== false,
      conversionValue: googleAdsConnector.conversionValue ?? 1,
      currencyCode: googleAdsConnector.currencyCode ?? 'BRL',
      customerName: null as string | null,
      accessibleCustomers: 0,
      campaignsIndexed: Number(googleCampaignStats?.total ?? 0),
      conversionsLogged: Number(googleConversionStats?.total ?? 0),
      successfulConversions: Number(googleConversionStats?.success_count ?? 0),
      lastUploadAt: googleConversionStats?.last_upload_at ?? null,
      lastSyncedAt: googleCampaignStats?.last_synced_at ?? null,
      lastSync: latestGoogleAdsSync
        ? {
            status: latestGoogleAdsSync.status,
            startedAt: latestGoogleAdsSync.started_at,
            finishedAt: latestGoogleAdsSync.finished_at,
            error: latestGoogleAdsSync.error,
            summary: parseJsonText<Record<string, unknown>>(latestGoogleAdsSync.summary_json, {}),
          }
        : null,
      error: null as string | null,
    };

    if (googleAdsReady && googleAdsConnector.customerId) {
      try {
        const [summary, accessibleCustomers] = await Promise.all([
          getGoogleAdsCustomerSummary(c.env, googleAdsConnector.customerId),
          listGoogleAdsAccessibleCustomers(c.env),
        ]);
        googleAdsStatus.customerName = summary.descriptiveName;
        googleAdsStatus.accessibleCustomers = accessibleCustomers.length;
      } catch (error) {
        googleAdsStatus.error = error instanceof Error ? error.message : 'Falha ao validar o Google Ads.';
      }
    }

    const zohoReady = isZohoConfigured(c.env);
    let zohoStatus: {
      configured: boolean;
      apiDomain: string | null;
      accountsDomain: string | null;
      organizationId: string | null;
      organizationName: string | null;
      organizationEmail: string | null;
      scope: string | null;
      error: string | null;
    } = {
      configured: zohoReady,
      apiDomain: c.env.ZOHO_API_DOMAIN || null,
      accountsDomain: c.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.com',
      organizationId: null,
      organizationName: null,
      organizationEmail: null,
      scope: null,
      error: null,
    };

    if (zohoReady) {
      try {
        const zoho = await getZohoOrganization(c.env);
        zohoStatus = {
          configured: true,
          apiDomain: zoho.apiDomain,
          accountsDomain: c.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.com',
          organizationId: zoho.organization.id,
          organizationName: zoho.organization.companyName,
          organizationEmail: zoho.organization.primaryEmail,
          scope: zoho.scope,
          error: null,
        };
      } catch (error) {
        zohoStatus.error = error instanceof Error ? error.message : 'Falha ao validar Zoho CRM.';
      }
    }

    return c.json({
      ok: true,
      gmail: {
        configured: gmailConfigured,
        senderEmail: c.env.GMAIL_SENDER_EMAIL || c.env.DEFAULT_FROM_EMAIL,
        senderName: getConfiguredSenderName(c.env),
        authorizedEmail: activeGmailConnection?.email ?? (c.env.GMAIL_SENDER_EMAIL || c.env.DEFAULT_FROM_EMAIL),
        connectedAt: activeGmailConnection?.grantedAt ?? null,
        connectionSource: activeGmailConnection?.refreshToken
          ? activeGmailConnection.source ?? 'panel_oauth'
          : c.env.GOOGLE_REFRESH_TOKEN
            ? 'cloudflare_secret'
            : null,
      },
      meta: metaStatus,
      googleAds: googleAdsStatus,
      zoho: zohoStatus,
      connectors: {
        meta: metaConnector,
        googleAds: googleAdsConnector,
      },
      auth: {
        mode: isGoogleOnlyAuth(c.env) ? 'google_only' : 'local_password',
        googleClientConfigured: Boolean(c.env.GOOGLE_AUTH_CLIENT_ID && !c.env.GOOGLE_AUTH_CLIENT_ID.startsWith('REPLACE_WITH')),
        allowedEmails: [...parseEmailSet(c.env.GOOGLE_ALLOWED_EMAILS)],
      },
      sending,
      deliverability,
      checklist,
      notices: {
        openTracking: await isOpenTrackingEnabled(c.env),
        clickTrackingReliable: true,
        inboxPlacementGuaranteed: false,
      },
    });
  });

  app.put('/api/settings/deliverability', async (c) => {
    const actor = requirePermission(c, 'settings:manage');
    const body = await requireJsonBody<Record<string, unknown>>(c.req.raw);
    await writeSetting(c.env, 'deliverability', body, actor.id);
    await auditLog(c.env, c.req.raw, actor.id, 'settings.deliverability.update', 'app_settings', 'deliverability', body);
    return c.json({ ok: true });
  });

  app.put('/api/settings/sending', async (c) => {
    const actor = requirePermission(c, 'settings:manage');
    const body = await requireJsonBody<Record<string, unknown>>(c.req.raw);
    await writeSetting(c.env, 'sending', body, actor.id);
    await auditLog(c.env, c.req.raw, actor.id, 'settings.sending.update', 'app_settings', 'sending', body);
    return c.json({ ok: true });
  });

  app.put('/api/settings/meta', async (c) => {
    const actor = requirePermission(c, 'settings:manage');
    const body = await requireJsonBody<Record<string, unknown>>(c.req.raw);
    await writeSetting(c.env, 'meta_connector', body, actor.id);
    await auditLog(c.env, c.req.raw, actor.id, 'settings.meta.update', 'app_settings', 'meta_connector', body);
    return c.json({ ok: true });
  });

  app.put('/api/settings/google-ads', async (c) => {
    const actor = requirePermission(c, 'settings:manage');
    const body = await requireJsonBody<Record<string, unknown>>(c.req.raw);
    await writeSetting(c.env, 'google_ads_connector', body, actor.id);
    await auditLog(c.env, c.req.raw, actor.id, 'settings.google_ads.update', 'app_settings', 'google_ads_connector', body);
    return c.json({ ok: true });
  });

  app.post('/api/settings/gmail/test', async (c) => {
    const actor = requirePermission(c, 'settings:manage');
    const body = await requireJsonBody<{ email?: string }>(c.req.raw);
    const targetEmail = ensureEmail(body.email || actor.email || c.env.GMAIL_SENDER_EMAIL || c.env.DEFAULT_FROM_EMAIL);
    const senderEmail = c.env.GMAIL_SENDER_EMAIL || c.env.DEFAULT_FROM_EMAIL;
    const senderName = getConfiguredSenderName(c.env);
    const sentAt = nowIso();

    const html = `<!doctype html><html lang="pt-BR"><body style="font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#f8fafc;color:#0f172a;padding:24px"><main style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e2e8f0"><p style="margin:0 0 8px;color:#475569;font-size:12px;letter-spacing:.18em;text-transform:uppercase">Cuiabar CRM</p><h1 style="margin:0 0 16px;font-size:28px;line-height:1.1">Teste operacional do Gmail</h1><p style="margin:0 0 16px;line-height:1.7;color:#334155">Este e-mail confirma que a conta remetente <strong>${senderEmail}</strong> conseguiu autenticar, renovar token e enviar pela Gmail API.</p><p style="margin:0 0 8px;color:#475569"><strong>Origem:</strong> painel de Configuracoes</p><p style="margin:0 0 8px;color:#475569"><strong>Executado por:</strong> ${actor.displayName}</p><p style="margin:0;color:#475569"><strong>Timestamp:</strong> ${sentAt}</p></main></body></html>`;
    const text = `Cuiabar CRM\n\nTeste operacional do Gmail.\n\nConta remetente: ${senderEmail}\nExecutado por: ${actor.displayName}\nTimestamp: ${sentAt}`;

    const result = await sendViaGmail(c.env, {
      fromName: senderName,
      fromEmail: senderEmail,
      to: targetEmail,
      subject: `Teste operacional do Gmail - ${new Date().toLocaleDateString('pt-BR')}`,
      replyTo: c.env.DEFAULT_REPLY_TO,
      html,
      text,
      listUnsubscribeUrl: `${c.env.APP_BASE_URL}/unsubscribe/teste`,
    });

    await auditLog(c.env, c.req.raw, actor.id, 'settings.gmail.test_send', 'app_settings', 'gmail_oauth_connection', {
      to: targetEmail,
      providerMessageId: result.id,
    });

    return c.json({
      ok: true,
      email: targetEmail,
      providerMessageId: result.id,
    });
  });

  app.post('/api/settings/meta/test', async (c) => {
    const actor = requirePermission(c, 'settings:manage');
    const metaConnector = await readMetaConnectorSettings(c.env);

    if (!isMetaGraphConfigured(c.env)) {
      throw new HttpError(400, 'Meta ainda nao foi configurada no Worker com token server-side.');
    }

    const pixel = await getMetaPixelSummary(c.env);
    await auditLog(c.env, c.req.raw, actor.id, 'settings.meta.test_connection', 'app_settings', 'meta_connector', {
      pixelId: pixel.id,
      pixelName: pixel.name,
      adAccountId: metaConnector.adAccountId,
      leadFormIds: metaConnector.leadFormIds,
    });

    return c.json({
      ok: true,
      meta: {
        pixel,
        adAccountId: metaConnector.adAccountId,
        leadFormIds: metaConnector.leadFormIds,
      },
    });
  });

  app.post('/api/settings/meta/sync', async (c) => {
    const actor = requirePermission(c, 'settings:manage');
    const metaConnector = await readMetaConnectorSettings(c.env);

    if (!isMetaGraphConfigured(c.env)) {
      throw new HttpError(400, 'Meta ainda nao foi configurada no Worker com token server-side.');
    }

    if (!metaConnector.adAccountId && (!metaConnector.leadFormIds || metaConnector.leadFormIds.length === 0)) {
      throw new HttpError(400, 'Informe ao menos um adAccountId ou leadFormIds na configuracao da Meta.');
    }

    const syncRunId = await startConnectorSyncRun(c.env, 'meta', 'campaigns_and_leads', metaConnector.adAccountId ?? null);
    try {
      let campaignCount = 0;
      let leadCount = 0;
      let contactsCreated = 0;
      const since = new Date(Date.now() - ((metaConnector.lookbackDays ?? DEFAULT_META_LOOKBACK_DAYS) - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const until = new Date().toISOString().slice(0, 10);

      if (metaConnector.adAccountId) {
        const metrics = await fetchMetaCampaignMetrics(c.env, metaConnector.adAccountId, since, until);
        for (const metric of metrics) {
          await upsertAdCampaignMetric(c.env, 'meta', metric.accountId || metaConnector.adAccountId, metric.campaignId, metric.dateStart || metric.dateStop || until, {
            campaignName: metric.campaignName,
            campaignStatus: metric.campaignStatus,
            impressions: metric.impressions,
            clicks: metric.clicks,
            interactions: metric.clicks,
            ctr: metric.ctr,
            spendAmount: metric.spendAmount,
            spendCurrency: metric.spendCurrency,
            conversions: metric.conversions,
            raw: metric.raw,
          });
          campaignCount += 1;
        }
        await upsertAdPlatformAccount(c.env, 'meta', metaConnector.adAccountId, 'Meta Ads', 'active', {
          pixelId: getMetaPixelId(c.env),
          lookbackDays: metaConnector.lookbackDays,
        });
      }

      if (metaConnector.leadFormIds && metaConnector.leadFormIds.length > 0) {
        const leads = await fetchMetaLeadAds(c.env, metaConnector.leadFormIds);
        for (const lead of leads) {
          let contactId: string | null = null;
          let syncedToContact = false;
          if (metaConnector.autoCreateContacts && (lead.email || lead.phone)) {
            const contact = await upsertExternalContact(c.env, {
              email: lead.email,
              phone: lead.phone,
              fullName: lead.fullName,
              source: 'meta_lead_ads',
              tags: ['meta', 'meta-lead-ads'],
              optInStatus: 'pending',
            });
            if (contact) {
              contactId = contact.id;
              syncedToContact = true;
              contactsCreated += 1;
              await syncContactToZoho(c.env, contact);
            }
          }

          await recordAdLead(c.env, {
            provider: 'meta',
            externalLeadId: lead.id,
            accountId: metaConnector.adAccountId,
            formId: lead.formId,
            campaignId: lead.campaignId,
            adsetId: lead.adsetId,
            adId: lead.adId,
            contactId,
            email: lead.email,
            phone: lead.phone,
            fullName: lead.fullName,
            leadCreatedAt: lead.createdTime,
            syncedToContact,
            raw: lead.raw,
          });
          leadCount += 1;
        }
      }

      const summary = {
        campaignCount,
        leadCount,
        contactsCreated,
        adAccountId: metaConnector.adAccountId,
        leadFormIds: metaConnector.leadFormIds,
        lookbackDays: metaConnector.lookbackDays,
      };
      await finishConnectorSyncRun(c.env, syncRunId, 'success', summary);
      await auditLog(c.env, c.req.raw, actor.id, 'settings.meta.sync', 'app_settings', 'meta_connector', summary);
      return c.json({ ok: true, summary });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar Meta.';
      await finishConnectorSyncRun(c.env, syncRunId, 'error', {}, message);
      throw new HttpError(502, message);
    }
  });

  app.post('/api/settings/google-ads/test', async (c) => {
    const actor = requirePermission(c, 'settings:manage');
    const googleAdsConnector = await readGoogleAdsConnectorSettings(c.env);
    const customerId = googleAdsConnector.customerId;

    if (!isGoogleAdsConfigured(c.env) || !customerId) {
      throw new HttpError(400, 'Google Ads ainda nao foi configurado com credenciais server-side e customer ID.');
    }

    const [summary, accessibleCustomers] = await Promise.all([
      getGoogleAdsCustomerSummary(c.env, customerId),
      listGoogleAdsAccessibleCustomers(c.env),
    ]);

    await auditLog(c.env, c.req.raw, actor.id, 'settings.google_ads.test_connection', 'app_settings', 'google_ads_connector', {
      customerId,
      customerName: summary.descriptiveName,
      accessibleCustomers: accessibleCustomers.length,
    });

    return c.json({
      ok: true,
      googleAds: {
        customer: summary,
        accessibleCustomers,
      },
    });
  });

  app.post('/api/settings/google-ads/sync', async (c) => {
    const actor = requirePermission(c, 'settings:manage');
    const googleAdsConnector = await readGoogleAdsConnectorSettings(c.env);
    const customerId = googleAdsConnector.customerId;

    if (!isGoogleAdsConfigured(c.env) || !customerId) {
      throw new HttpError(400, 'Google Ads ainda nao foi configurado com credenciais server-side e customer ID.');
    }

    const syncRunId = await startConnectorSyncRun(c.env, 'google_ads', 'campaign_metrics', customerId);
    try {
      const [summary, metrics] = await Promise.all([
        getGoogleAdsCustomerSummary(c.env, customerId),
        fetchGoogleAdsCampaignMetrics(c.env, customerId, googleAdsConnector.lookbackDays ?? DEFAULT_GOOGLE_ADS_LOOKBACK_DAYS),
      ]);

      await upsertAdPlatformAccount(c.env, 'google_ads', customerId, summary.descriptiveName, 'active', {
        currencyCode: summary.currencyCode,
        timeZone: summary.timeZone,
        lookbackDays: googleAdsConnector.lookbackDays,
      });

      for (const metric of metrics) {
        await upsertAdCampaignMetric(c.env, 'google_ads', metric.customerId, metric.campaignId, metric.metricDate, {
          campaignName: metric.campaignName,
          campaignStatus: metric.campaignStatus,
          impressions: metric.impressions,
          clicks: metric.clicks,
          interactions: metric.interactions,
          ctr: metric.ctr,
          spendAmount: metric.costMicros / 1_000_000,
          spendCurrency: summary.currencyCode,
          conversions: metric.conversions,
          raw: metric.raw,
        });
      }

      const summaryPayload = {
        customerId,
        customerName: summary.descriptiveName,
        campaignsIndexed: metrics.length,
        lookbackDays: googleAdsConnector.lookbackDays,
      };
      await finishConnectorSyncRun(c.env, syncRunId, 'success', summaryPayload);
      await auditLog(c.env, c.req.raw, actor.id, 'settings.google_ads.sync', 'app_settings', 'google_ads_connector', summaryPayload);

      return c.json({
        ok: true,
        summary: summaryPayload,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao sincronizar Google Ads.';
      await finishConnectorSyncRun(c.env, syncRunId, 'error', {}, message);
      throw new HttpError(502, message);
    }
  });

  app.post('/api/settings/zoho/test', async (c) => {
    const actor = requirePermission(c, 'settings:manage');
    if (!isZohoConfigured(c.env)) {
      throw new HttpError(400, 'Credenciais do Zoho CRM ainda nao foram configuradas no ambiente.');
    }

    const zoho = await getZohoOrganization(c.env);
    await auditLog(c.env, c.req.raw, actor.id, 'settings.zoho.test_connection', 'app_settings', 'zoho_crm', {
      organizationId: zoho.organization.id,
      organizationName: zoho.organization.companyName,
      apiDomain: zoho.apiDomain,
      scope: zoho.scope,
    });

    return c.json({
      ok: true,
      zoho: {
        apiDomain: zoho.apiDomain,
        scope: zoho.scope,
        organization: zoho.organization,
      },
    });
  });

  app.get('/api/deliverability/checklist', async (c) => {
    requirePermission(c, 'dashboard:read');
    return c.json({ ok: true, checklist: await buildDeliverabilityChecklist(c.env) });
  });

  app.get('/api/exports/:type', async (c) => {
    requirePermission(c, 'reports:read');
    const exportType = c.req.param('type');
    if (exportType === 'contacts.csv') {
      const rows = await all<ContactRecord>(c.env.DB.prepare('SELECT * FROM contacts ORDER BY created_at DESC'));
      return csvResponse(
        buildCsv(
          ['id', 'email', 'first_name', 'last_name', 'phone', 'source', 'tags', 'status', 'opt_in_status', 'unsubscribed_at', 'created_at'],
          rows.map((row) => [row.id, row.email, row.first_name, row.last_name, row.phone, row.source, row.tags_json, row.status, row.opt_in_status, row.unsubscribed_at, row.created_at]),
        ),
        'contacts.csv',
      );
    }

    if (exportType === 'campaigns.csv') {
      const rows = await all<CampaignRecord>(c.env.DB.prepare('SELECT * FROM campaigns ORDER BY created_at DESC'));
      return csvResponse(
        buildCsv(
          ['id', 'name', 'subject', 'status', 'scheduled_at', 'started_at', 'finished_at', 'total_recipients', 'total_sent', 'total_failed', 'total_clicked', 'total_unsubscribed'],
          rows.map((row) => [row.id, row.name, row.subject, row.status, row.scheduled_at, row.started_at, row.finished_at, row.total_recipients, row.total_sent, row.total_failed, row.total_clicked, row.total_unsubscribed]),
        ),
        'campaigns.csv',
      );
    }

    if (exportType === 'clicks.csv') {
      const rows = await all<{
        campaign_id: string;
        contact_id: string;
        link_id: string;
        request_ip: string | null;
        user_agent: string | null;
        referer: string | null;
        is_unique: number;
        created_at: string;
      }>(c.env.DB.prepare('SELECT * FROM campaign_click_events ORDER BY created_at DESC'));
      return csvResponse(
        buildCsv(
          ['campaign_id', 'contact_id', 'link_id', 'request_ip', 'user_agent', 'referer', 'is_unique', 'created_at'],
          rows.map((row) => [row.campaign_id, row.contact_id, row.link_id, row.request_ip, row.user_agent, row.referer, row.is_unique, row.created_at]),
        ),
        'clicks.csv',
      );
    }

    if (exportType === 'unsubscribes.csv') {
      const rows = await all<{
        campaign_id: string | null;
        contact_id: string;
        request_ip: string | null;
        user_agent: string | null;
        created_at: string;
      }>(c.env.DB.prepare('SELECT * FROM unsubscribe_events ORDER BY created_at DESC'));
      return csvResponse(
        buildCsv(
          ['campaign_id', 'contact_id', 'request_ip', 'user_agent', 'created_at'],
          rows.map((row) => [row.campaign_id, row.contact_id, row.request_ip, row.user_agent, row.created_at]),
        ),
        'unsubscribes.csv',
      );
    }

    if (exportType === 'failures.csv') {
      const rows = await all<{
        campaign_id: string;
        recipient_id: string | null;
        contact_id: string;
        error_code: string | null;
        error_message: string | null;
        created_at: string;
      }>(
        c.env.DB.prepare(
          `SELECT campaign_id, recipient_id, contact_id, error_code, error_message, created_at
           FROM send_events
           WHERE status = 'failed'
           ORDER BY created_at DESC`,
        ),
      );
      return csvResponse(
        buildCsv(
          ['campaign_id', 'recipient_id', 'contact_id', 'error_code', 'error_message', 'created_at'],
          rows.map((row) => [row.campaign_id, row.recipient_id, row.contact_id, row.error_code, row.error_message, row.created_at]),
        ),
        'failures.csv',
      );
    }

    throw new HttpError(404, 'Exportacao nao encontrada.');
  });

  app.get('/o/:trackingToken', async (c) => {
    const trackingToken = c.req.param('trackingToken');
    const recipient = await first<RecipientRecord>(c.env.DB.prepare('SELECT * FROM campaign_recipients WHERE tracking_token = ?').bind(trackingToken));

    const headers = new Headers({
      'content-type': 'image/gif',
      'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
      pragma: 'no-cache',
    });

    if (recipient) {
      const recentDuplicate = await first<{ created_at: string }>(
        c.env.DB.prepare(
          `SELECT created_at FROM campaign_open_events
           WHERE recipient_id = ? AND created_at >= ?
           ORDER BY created_at DESC
           LIMIT 1`,
        ).bind(recipient.id, new Date(Date.now() - 15_000).toISOString()),
      );

      if (!recentDuplicate) {
        const priorOpen = await first<{ total: number }>(
          c.env.DB.prepare('SELECT COUNT(*) AS total FROM campaign_open_events WHERE recipient_id = ?').bind(recipient.id),
        );
        const isUnique = (priorOpen?.total ?? 0) === 0 ? 1 : 0;
        await run(
          c.env.DB.prepare(
            `INSERT INTO campaign_open_events
              (id, campaign_id, contact_id, recipient_id, request_ip, user_agent, referer, is_unique, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ).bind(
            generateId('opn'),
            recipient.campaign_id,
            recipient.contact_id,
            recipient.id,
            getRequestIp(c.req.raw),
            c.req.header('user-agent'),
            c.req.header('referer'),
            isUnique,
            nowIso(),
          ),
        );
        await run(c.env.DB.prepare('UPDATE campaign_recipients SET opened_at = COALESCE(opened_at, ?), updated_at = ? WHERE id = ?').bind(nowIso(), nowIso(), recipient.id));
        await refreshCampaignStats(c.env, recipient.campaign_id);
      }
    }

    return new Response(Uint8Array.from(atob(TRANSPARENT_GIF_BASE64), (char) => char.charCodeAt(0)), {
      status: 200,
      headers,
    });
  });

  app.get('/c/:token', async (c) => {
    const token = c.req.param('token');
    const { trackingToken, linkId } = parseTrackingToken(token);
    const recipient = await first<RecipientRecord>(c.env.DB.prepare('SELECT * FROM campaign_recipients WHERE tracking_token = ?').bind(trackingToken));
    if (!recipient) {
      throw new HttpError(404, 'Tracking nao encontrado.');
    }
    const link = await first<CampaignLinkRecord>(
      c.env.DB.prepare('SELECT * FROM campaign_links WHERE id = ? AND campaign_id = ?').bind(linkId, recipient.campaign_id),
    );
    if (!link) {
      throw new HttpError(404, 'Link rastreavel nao encontrado.');
    }

    const recentDuplicate = await first<{ created_at: string }>(
      c.env.DB.prepare(
        `SELECT created_at FROM campaign_click_events
         WHERE recipient_id = ? AND link_id = ? AND created_at >= ?
         ORDER BY created_at DESC
         LIMIT 1`,
      ).bind(recipient.id, link.id, new Date(Date.now() - 30_000).toISOString()),
    );

    if (!recentDuplicate) {
      const priorClick = await first<{ total: number }>(
        c.env.DB.prepare(`SELECT COUNT(*) AS total FROM campaign_click_events WHERE recipient_id = ? AND link_id = ?`).bind(recipient.id, link.id),
      );
      const isUnique = (priorClick?.total ?? 0) === 0 ? 1 : 0;
      await run(
        c.env.DB.prepare(
          `INSERT INTO campaign_click_events
            (id, campaign_id, contact_id, recipient_id, link_id, request_ip, user_agent, referer, is_unique, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          generateId('clk'),
          recipient.campaign_id,
          recipient.contact_id,
          recipient.id,
          link.id,
          getRequestIp(c.req.raw),
          c.req.header('user-agent'),
          c.req.header('referer'),
          isUnique,
          nowIso(),
        ),
      );
      await run(
        c.env.DB.prepare(
          `UPDATE campaign_links
           SET click_count_total = click_count_total + 1,
               click_count_unique = click_count_unique + ?
           WHERE id = ?`,
        ).bind(isUnique, link.id),
      );
      await run(c.env.DB.prepare('UPDATE campaign_recipients SET clicked_at = COALESCE(clicked_at, ?), updated_at = ? WHERE id = ?').bind(nowIso(), nowIso(), recipient.id));
      await run(c.env.DB.prepare('UPDATE contacts SET last_clicked_at = ?, updated_at = ? WHERE id = ?').bind(nowIso(), nowIso(), recipient.contact_id));
      await refreshCampaignStats(c.env, recipient.campaign_id);
    }

    return c.redirect(link.original_url, 302);
  });

  app.get('/unsubscribe/:token', async (c) => {
    const result = await unsubscribeByToken(c.env, c.req.raw, c.req.param('token'));
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Descadastro confirmado</title><style>body{font-family:ui-sans-serif,system-ui,sans-serif;background:#f3efe5;color:#1e1b16;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}.card{max-width:640px;background:#fff;padding:32px;border-radius:24px;box-shadow:0 24px 60px rgba(0,0,0,.08)}a{color:#8c4a21}</style></head><body><main class="card"><h1>Descadastro confirmado</h1><p>O contato <strong>${result.contact.email}</strong> foi removido desta comunicacao.</p><p>Voce nao recebera novos envios desta base enquanto permanecer descadastrado.</p><p><a href="${c.env.APP_BASE_URL}">Voltar</a></p></main></body></html>`;
    return c.html(html);
  });

  app.post('/unsubscribe/:token', async (c) => {
    const result = await unsubscribeByToken(c.env, c.req.raw, c.req.param('token'));
    return c.json({ ok: true, unsubscribed: true, campaignId: result.campaignId, contact: result.contact });
  });

  return app;
};

export const runScheduledWork = async (env: Env) => {
  await publishScheduledBlogPosts(env);
  await processCampaignQueue(env);
};
