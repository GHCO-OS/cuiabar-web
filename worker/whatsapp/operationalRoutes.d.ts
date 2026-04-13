import type { Hono } from 'hono';
import type { AppVariables, Env } from '../types';
type WhatsAppOpsApp = Hono<{
    Bindings: Env;
    Variables: AppVariables;
}>;
export declare const registerWhatsAppOperationalRoutes: (app: WhatsAppOpsApp) => void;
export {};
