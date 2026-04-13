import type { Env } from '../types';
import { CLASSIFICATION_CACHE_TTL_SECONDS, SESSION_TTL_SECONDS } from './constants';
import type { SessionState } from './types';
import { sha256Hex } from './utils';

const sessionKey = (phoneE164: string) => `wa:session:${phoneE164}`;
const cacheKey = async (prefix: string, value: string) => `wa:cache:${prefix}:${await sha256Hex(value)}`;

export const loadSession = async (env: Env, phoneE164: string): Promise<SessionState> => {
  const stored = await env.WHATSAPP_KV.get(sessionKey(phoneE164), 'json');
  if (!stored || typeof stored !== 'object') {
    return { fallbackCount: 0 };
  }
  return stored as SessionState;
};

export const saveSession = async (env: Env, phoneE164: string, state: SessionState) => {
  await env.WHATSAPP_KV.put(sessionKey(phoneE164), JSON.stringify(state), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
};

export const getCachedJson = async <T>(env: Env, prefix: string, value: string) => {
  const key = await cacheKey(prefix, value);
  return (await env.WHATSAPP_KV.get(key, 'json')) as T | null;
};

export const putCachedJson = async <T>(env: Env, prefix: string, value: string, payload: T, ttlSeconds = CLASSIFICATION_CACHE_TTL_SECONDS) => {
  const key = await cacheKey(prefix, value);
  await env.WHATSAPP_KV.put(key, JSON.stringify(payload), {
    expirationTtl: ttlSeconds,
  });
};
