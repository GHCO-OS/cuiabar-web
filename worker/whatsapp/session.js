import { CLASSIFICATION_CACHE_TTL_SECONDS, SESSION_TTL_SECONDS } from './constants';
import { sha256Hex } from './utils';
const sessionKey = (phoneE164) => `wa:session:${phoneE164}`;
const cacheKey = async (prefix, value) => `wa:cache:${prefix}:${await sha256Hex(value)}`;
export const loadSession = async (env, phoneE164) => {
    const stored = await env.WHATSAPP_KV.get(sessionKey(phoneE164), 'json');
    if (!stored || typeof stored !== 'object') {
        return { fallbackCount: 0 };
    }
    return stored;
};
export const saveSession = async (env, phoneE164, state) => {
    await env.WHATSAPP_KV.put(sessionKey(phoneE164), JSON.stringify(state), {
        expirationTtl: SESSION_TTL_SECONDS,
    });
};
export const getCachedJson = async (env, prefix, value) => {
    const key = await cacheKey(prefix, value);
    return (await env.WHATSAPP_KV.get(key, 'json'));
};
export const putCachedJson = async (env, prefix, value, payload, ttlSeconds = CLASSIFICATION_CACHE_TTL_SECONDS) => {
    const key = await cacheKey(prefix, value);
    await env.WHATSAPP_KV.put(key, JSON.stringify(payload), {
        expirationTtl: ttlSeconds,
    });
};
