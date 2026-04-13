import { createApp, runScheduledWork } from './app';
const app = createApp();
const BLOG_EDITOR_PATH = '/editor';
const isEditorRequest = (url) => url.hostname === 'blog.cuiabar.com' && (url.pathname === BLOG_EDITOR_PATH || url.pathname.startsWith(`${BLOG_EDITOR_PATH}/`));
const stripEditorPrefix = (pathname) => {
    const nextPath = pathname.slice(BLOG_EDITOR_PATH.length);
    return nextPath.length > 0 ? nextPath : '/';
};
const rewriteEditorLocation = (location, publicOrigin, upstreamOrigin) => {
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
const proxyEditorRequest = async (request, env) => {
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
export default {
    fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;
        if (isEditorRequest(url)) {
            return proxyEditorRequest(request, env);
        }
        if (pathname.startsWith('/api/') ||
            pathname.startsWith('/c/') ||
            pathname.startsWith('/unsubscribe/') ||
            pathname.startsWith('/oauth/') ||
            pathname.startsWith('/go/') ||
            pathname === '/ifood' ||
            pathname === '/99food') {
            return app.fetch(request, env, ctx);
        }
        return env.ASSETS.fetch(request);
    },
    async scheduled(_controller, env, ctx) {
        ctx.waitUntil(runScheduledWork(env));
    },
};
