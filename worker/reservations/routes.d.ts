import type { Hono } from 'hono';
import type { AppVariables, Env } from '../types';
type ReservationApp = Hono<{
    Bindings: Env;
    Variables: AppVariables;
}>;
export declare const registerReservationRoutes: (app: ReservationApp) => void;
export {};
