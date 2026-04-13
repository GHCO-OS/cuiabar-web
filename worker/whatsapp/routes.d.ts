import type { Hono } from 'hono';
import type { AppVariables, Env } from '../types';
type WaApp = Hono<{
    Bindings: Env;
    Variables: AppVariables;
}>;
export declare const registerWhatsAppRoutes: (app: WaApp) => void;
export {};
