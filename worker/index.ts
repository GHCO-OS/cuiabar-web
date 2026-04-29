import { createApp, runScheduledWork } from './app';
import type { Env } from './types';

const app = createApp();
const BLOG_EDITOR_PATH = '/editor';
const MEUCUIABAR_LEGACY_PATH = '/meucuiabar';
const MEUCUIABAR_HOST = 'meu.cuiabar.com';
const BURGER_ARCHIVED_HOST = 'burger.cuiabar.com';
const BURGER_N_SMOKE_HOST = 'burgersnsmoke.com';
const BURGER_N_SMOKE_ROOT = `https://${BURGER_N_SMOKE_HOST}/`;
const BURGER_N_SMOKE_PREVIEW_PATH = '/burger-n-smoke';
const MAIN_SITE_ORIGIN = 'https://cuiabar.com';
const BURGER_N_SMOKE_ROBOTS = `User-agent: *\nAllow: /\n\nSitemap: ${BURGER_N_SMOKE_ROOT}sitemap.xml\n`;
const BURGER_N_SMOKE_SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${BURGER_N_SMOKE_ROOT}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`;

const isEditorRequest = (url: URL) => url.hostname === 'blog.cuiabar.com' && (url.pathname === BLOG_EDITOR_PATH || url.pathname.startsWith(`${BLOG_EDITOR_PATH}/`));
const isInternalPortalHost = (hostname: string) => hostname === 'crm.cuiabar.com' || hostname === MEUCUIABAR_HOST;
const normalizePathname = (pathname: string) => (pathname === '/' ? '/' : pathname.replace(/\/+$/, '') || '/');

const stripEditorPrefix = (pathname: string) => {
  const nextPath = pathname.slice(BLOG_EDITOR_PATH.length);
  return nextPath.length > 0 ? nextPath : '/';
};

const rewriteEditorLocation = (location: string, publicOrigin: string, upstreamOrigin: string) => {
  if (!location) {
    return location;
  }

  if (location.startsWith('./')) {
    return `${publicOrigin}${BLOG_EDITOR_PATH}/${location.slice(2)}`;
  }

  if (!location.startsWith('http://') && !location.startsWith('https://') && !location.startsWith('/')) {
    return `${publicOrigin}${BLOG_EDITOR_PATH}/${location}`;
  }

  if (location.startsWith('/')) {
    return `${publicOrigin}${BLOG_EDITOR_PATH}${location}`;
  }

  if (location.startsWith(upstreamOrigin)) {
    return `${publicOrigin}${BLOG_EDITOR_PATH}${location.slice(upstreamOrigin.length)}`;
  }

  return location;
};

const proxyEditorRequest = async (request: Request, env: Env) => {
  const upstreamBase = (env.BLOG_EDITOR_UPSTREAM_URL ?? '').trim().replace(/\/$/, '');

  if (!upstreamBase) {
    return new Response('BLOG_EDITOR_UPSTREAM_URL nao configurado.', { status: 503 });
  }

  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(upstreamBase);
  upstreamUrl.pathname = stripEditorPrefix(incomingUrl.pathname);
  upstreamUrl.search = incomingUrl.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('x-forwarded-host', incomingUrl.host);
  headers.set('x-forwarded-proto', incomingUrl.protocol.replace(':', ''));
  headers.set('x-forwarded-prefix', BLOG_EDITOR_PATH);
  headers.set('x-forwarded-uri', incomingUrl.pathname + incomingUrl.search);

  const proxiedRequest = new Request(upstreamUrl.toString(), {
    method: request.method,
    headers,
    body: request.body,
    redirect: 'manual',
  });

  const response = await fetch(proxiedRequest);
  const responseHeaders = new Headers(response.headers);
  const location = responseHeaders.get('location');

  if (location) {
    responseHeaders.set('location', rewriteEditorLocation(location, incomingUrl.origin, upstreamUrl.origin));
  }

  responseHeaders.set('x-robots-tag', 'noindex, nofollow');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};

const redirectLegacyMeuCuiabarRoute = (url: URL) => {
  const suffix = url.pathname.slice(MEUCUIABAR_LEGACY_PATH.length);
  const nextPath = suffix.length > 0 ? suffix : '/';
  const destination = new URL(`https://${MEUCUIABAR_HOST}${nextPath}`);
  destination.search = url.search;
  return Response.redirect(destination.toString(), 308);
};

const buildPublicSiteRedirect = (url: URL) => {
  const normalizedPath = normalizePathname(url.pathname);

  if (normalizedPath === '/burger' || normalizedPath === '/burguer' || normalizedPath === '/burguer-cuiabar') {
    return BURGER_N_SMOKE_ROOT;
  }

  if (normalizedPath === '/blog' || normalizedPath.startsWith('/blog/')) {
    return 'https://cuiabar.com/presencial/';
  }

  if (
    normalizedPath === '/agenda' ||
    normalizedPath.startsWith('/agenda/') ||
    normalizedPath === '/bar-jardim-aurelia-musica-ao-vivo'
  ) {
    return 'https://cuiabar.com/presencial/#agenda-casa';
  }

  if (normalizedPath === '/prorefeicao') {
    return 'https://prorefeicao.cuiabar.com/';
  }

  const mirroredPublicPaths = new Set([
    '/menu',
    '/reservas',
    '/vagas',
    '/links',
    '/presencial',
    '/expresso',
    '/espetaria',
    '/delivery',
    '/marmita',
    '/online-ordering',
    '/pedidos-online',
    '/services-5',
    '/bio',
    '/acessos',
    '/canal',
    '/asianrestaurant',
    '/restaurante-jardim-aurelia-campinas',
    '/restaurante-perto-do-enxuto-dunlop',
  ]);

  if (!mirroredPublicPaths.has(normalizedPath)) {
    return null;
  }

  const destination = new URL(MAIN_SITE_ORIGIN);
  destination.pathname = normalizedPath === '/' ? '/' : `${normalizedPath}/`;
  destination.search = url.search;
  return destination.toString();
};

const withInternalPortalHeaders = async (request: Request, env: Env) => {
  const assetResponse = await env.ASSETS.fetch(request);
  const headers = new Headers(assetResponse.headers);
  headers.set('x-robots-tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
  headers.set('cache-control', 'no-store, max-age=0, private');

  return new Response(assetResponse.body, {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers,
  });
};

const serveBurgerHost = async (request: Request, env: Env) => {
  const url = new URL(request.url);

  if (url.hostname === `www.${BURGER_N_SMOKE_HOST}`) {
    url.hostname = BURGER_N_SMOKE_HOST;
    url.pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/+$/, '') || '/';
    return Response.redirect(url.toString(), 301);
  }

  if (url.hostname === BURGER_ARCHIVED_HOST || url.hostname === `www.${BURGER_ARCHIVED_HOST}`) {
    return Response.redirect(BURGER_N_SMOKE_ROOT, 301);
  }

  if (url.pathname === '/robots.txt') {
    return new Response(BURGER_N_SMOKE_ROBOTS, {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    });
  }

  if (url.pathname === '/sitemap.xml') {
    return new Response(BURGER_N_SMOKE_SITEMAP, {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    });
  }

  if (url.pathname === BURGER_N_SMOKE_PREVIEW_PATH) {
    return Response.redirect(BURGER_N_SMOKE_ROOT, 301);
  }

  if (url.pathname !== '/') {
    return env.ASSETS.fetch(request);
  }

  const assetUrl = new URL(request.url);
  assetUrl.pathname = `${BURGER_N_SMOKE_PREVIEW_PATH}/`;
  const assetRequest = new Request(assetUrl.toString(), request);
  const assetResponse = await env.ASSETS.fetch(assetRequest);

  return new HTMLRewriter()
    .on('link[rel="canonical"]', {
      element(element) {
        element.setAttribute('href', BURGER_N_SMOKE_ROOT);
      },
    })
    .on('meta[property="og:url"]', {
      element(element) {
        element.setAttribute('content', BURGER_N_SMOKE_ROOT);
      },
    })
    .on('meta[name="twitter:url"]', {
      element(element) {
        element.setAttribute('content', BURGER_N_SMOKE_ROOT);
      },
    })
    .on('meta[property="og:site_name"]', {
      element(element) {
        element.setAttribute('content', "Burger N' Smoke");
      },
    })
    .on('meta[name="twitter:site"]', {
      element(element) {
        element.setAttribute('content', '@burgernsmoke');
      },
    })
    .transform(assetResponse);
};

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (isEditorRequest(url)) {
      return proxyEditorRequest(request, env);
    }

    if (url.hostname === 'crm.cuiabar.com' && (pathname === MEUCUIABAR_LEGACY_PATH || pathname.startsWith(`${MEUCUIABAR_LEGACY_PATH}/`))) {
      return redirectLegacyMeuCuiabarRoute(url);
    }

    if (url.hostname === 'crm.cuiabar.com') {
      const publicSiteRedirect = buildPublicSiteRedirect(url);

      if (publicSiteRedirect) {
        return Response.redirect(publicSiteRedirect, 301);
      }
    }

    if (
      pathname.startsWith('/api/') ||
      pathname.startsWith('/c/') ||
      pathname.startsWith('/unsubscribe/') ||
      pathname.startsWith('/oauth/') ||
      pathname.startsWith('/go/') ||
      pathname === '/ifood' ||
      pathname === '/99food'
    ) {
      return app.fetch(request, env, ctx);
    }

    if (url.hostname === BURGER_ARCHIVED_HOST || url.hostname === `www.${BURGER_ARCHIVED_HOST}` || url.hostname === BURGER_N_SMOKE_HOST || url.hostname === `www.${BURGER_N_SMOKE_HOST}`) {
      return serveBurgerHost(request, env);
    }

    if (isInternalPortalHost(url.hostname)) {
      return withInternalPortalHeaders(request, env);
    }

    return env.ASSETS.fetch(request);
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runScheduledWork(env));
  },
};
