import path from 'node:path';
import type { BridgeConfig } from './types.js';

const requireEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
  return value;
};

const readInt = (name: string, fallback: number, min: number, max: number) => {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Variavel ${name} precisa ser numerica.`);
  }

  return Math.min(Math.max(Math.trunc(parsed), min), max);
};

const readBool = (name: string, fallback: boolean) => {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }

  return raw === '1' || raw.toLowerCase() === 'true';
};

const readOptionalInt = (name: string, min: number, max: number) => {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Variavel ${name} precisa ser numerica.`);
  }

  return Math.min(Math.max(Math.trunc(parsed), min), max);
};

const readEnum = <T extends string>(name: string, allowed: readonly T[], fallback: T): T => {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) {
    return fallback;
  }

  if (allowed.includes(raw as T)) {
    return raw as T;
  }

  throw new Error(`Variavel ${name} precisa ser uma destas opcoes: ${allowed.join(', ')}.`);
};

const normalizePairingPhone = (value: string | undefined) => {
  const digits = (value ?? '').replace(/\D/g, '');
  return digits || null;
};

const normalizePhoneE164 = (value: string | undefined) => {
  const digits = (value ?? '').replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return `+${digits}`;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  throw new Error(`Numero invalido em WHATSAPP_TEST_RECIPIENT: ${value}`);
};

const parsePinnedVersion = (value: string | undefined) => {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  const parts = raw.split(/[.,]/).map((entry) => Number(entry.trim()));
  if (parts.length !== 3 || parts.some((entry) => !Number.isFinite(entry) || entry < 0)) {
    throw new Error('Variavel BAILEYS_PINNED_VERSION precisa seguir o formato 2.3000.123456789.');
  }

  return [Math.trunc(parts[0]), Math.trunc(parts[1]), Math.trunc(parts[2])] as [number, number, number];
};

const normalizeCountryCode = (value: string | undefined) => {
  const raw = value?.trim().toUpperCase();
  if (!raw) {
    return 'BR';
  }

  if (!/^[A-Z]{2}$/.test(raw)) {
    throw new Error('Variavel BAILEYS_COUNTRY_CODE precisa ter duas letras, por exemplo BR.');
  }

  return raw;
};

export const loadConfig = (): BridgeConfig => {
  const config: BridgeConfig = {
    workerBaseUrl: requireEnv('WHATSAPP_WORKER_BASE_URL').replace(/\/$/, ''),
    internalToken: requireEnv('WHATSAPP_INTERNAL_TOKEN'),
    authDir: path.resolve(process.cwd(), process.env.BAILEYS_AUTH_DIR?.trim() || './.auth'),
    pollIntervalMs: readInt('BAILEYS_POLL_INTERVAL_MS', 3000, 1000, 30000),
    pullBatchSize: readInt('BAILEYS_PULL_BATCH_SIZE', 10, 1, 25),
    statusHost: process.env.BAILEYS_STATUS_HOST?.trim() || '127.0.0.1',
    statusPort: readInt('BAILEYS_STATUS_PORT', 8788, 1, 65535),
    logLevel: process.env.BAILEYS_LOG_LEVEL?.trim() || 'info',
    markIncomingAsRead: readBool('BAILEYS_MARK_INCOMING_AS_READ', true),
    reconnectDelayMs: readInt('BAILEYS_RECONNECT_DELAY_MS', 5000, 1000, 60000),
    connectTimeoutMs: readInt('BAILEYS_CONNECT_TIMEOUT_MS', 20000, 5000, 120000),
    defaultQueryTimeoutMs: readOptionalInt('BAILEYS_DEFAULT_QUERY_TIMEOUT_MS', 5000, 180000),
    countryCode: normalizeCountryCode(process.env.BAILEYS_COUNTRY_CODE),
    browserPreset: readEnum(
      'BAILEYS_BROWSER_PRESET',
      ['windows_desktop', 'windows_chrome', 'mac_desktop', 'mac_chrome'] as const,
      'windows_desktop',
    ),
    versionSource: readEnum('BAILEYS_VERSION_SOURCE', ['wa_web', 'baileys', 'pinned'] as const, 'wa_web'),
    pinnedVersion: parsePinnedVersion(process.env.BAILEYS_PINNED_VERSION),
    pairingMode: readEnum('BAILEYS_PAIRING_MODE', ['qr', 'code'] as const, 'qr'),
    pairingPhone: normalizePairingPhone(process.env.BAILEYS_PAIRING_PHONE),
    pairingCodeDelayMs: readInt('BAILEYS_PAIRING_CODE_DELAY_MS', 3000, 500, 15000),
    testRecipient: normalizePhoneE164(process.env.WHATSAPP_TEST_RECIPIENT),
  };

  if (config.pairingMode === 'code' && !config.pairingPhone) {
    throw new Error('BAILEYS_PAIRING_PHONE e obrigatoria quando BAILEYS_PAIRING_MODE=code.');
  }

  if (config.versionSource === 'pinned' && !config.pinnedVersion) {
    throw new Error('BAILEYS_PINNED_VERSION e obrigatoria quando BAILEYS_VERSION_SOURCE=pinned.');
  }

  return config;
};
