import type { Env } from '../types';
import type { SessionState } from './types';
export declare const loadSession: (env: Env, phoneE164: string) => Promise<SessionState>;
export declare const saveSession: (env: Env, phoneE164: string, state: SessionState) => Promise<void>;
export declare const getCachedJson: <T>(env: Env, prefix: string, value: string) => Promise<T | null>;
export declare const putCachedJson: <T>(env: Env, prefix: string, value: string, payload: T, ttlSeconds?: number) => Promise<void>;
