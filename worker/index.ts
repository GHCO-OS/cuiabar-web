import { createApp, runScheduledWork } from './app';
import type { Env } from './types';

const app = createApp();
const BLOG_EDITOR_PATH = '/editor';
const MEUCUIABAR_LEGACY_PATH = '/meucuiabar';
const MEUCUIABAR_HOST = 'meu.cuiabar.com';

const isEditorRequest = (url: URL) => url.hostname === 'blog.cuiabar.com' && (url.pathname === BLOG_EDITOR_PATH || url.pathname.startsWith(`${BLOG_EDITOR_PATH}/`));
const isInternalPortalHost = (hostname: string) => hostname === 'crm.cuiabar.com' || hostname === MEUCUIABAR_HOST;

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

    if (isInternalPortalHost(url.hostname)) {
      return withInternalPortalHeaders(request, env);
    }

    return env.ASSETS.fetch(request);
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runScheduledWork(env));
  },
};
