import { createApp, runScheduledWork } from './app';
import type { Env } from './types';

const app = createApp();

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const pathname = url.pathname;

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

    return env.ASSETS.fetch(request);
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runScheduledWork(env));
  },
};
