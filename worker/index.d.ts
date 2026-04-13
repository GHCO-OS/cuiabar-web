import type { Env } from './types';
declare const _default: {
    fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response>;
    scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void>;
};
export default _default;
