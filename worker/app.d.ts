import { Hono } from 'hono';
import type { AppVariables, Env } from './types';
export declare const createApp: () => Hono<{
    Bindings: Env;
    Variables: AppVariables;
}, import("hono/types").BlankSchema, "/">;
export declare const runScheduledWork: (env: Env) => Promise<void>;
