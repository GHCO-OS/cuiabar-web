import { createApp, runScheduledWork } from './app';
const app = createApp();
export default {
    fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;
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
