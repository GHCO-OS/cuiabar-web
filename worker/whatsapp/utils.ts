import { HttpError } from '../lib/http';

const encoder = new TextEncoder();

export const normalizePhoneE164 = (value: string) => {
  const digits = value.replace(/\D/g, '');

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return `+${digits}`;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  throw new HttpError(400, 'Numero de WhatsApp invalido.');
};

export const tryNormalizePhoneE164 = (value: string | null | undefined) => {
  if (!value?.trim()) {
    return null;
  }

  try {
    return normalizePhoneE164(value);
  } catch {
    return null;
  }
};

export const phonesMatch = (left: string | null | undefined, right: string | null | undefined) => {
  const normalizedLeft = tryNormalizePhoneE164(left);
  const normalizedRight = tryNormalizePhoneE164(right);

  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
};

export const sanitizeMessageText = (value: string | null | undefined, maxLength = 1200) =>
  (value ?? '')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

export const normalizeFreeText = (value: string | null | undefined) =>
  sanitizeMessageText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export const isFullName = (value: string | null | undefined) => sanitizeMessageText(value).split(' ').filter(Boolean).length >= 2;

export const parseJsonObjectFromText = <T>(value: string): T | null => {
  const firstBrace = value.indexOf('{');
  const lastBrace = value.lastIndexOf('}');

  if (firstBrace < 0 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = value.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
};

export const sha256Hex = async (value: string) => {
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(buffer)].map((item) => item.toString(16).padStart(2, '0')).join('');
};

export const safeFirstName = (value: string | null | undefined) => sanitizeMessageText(value).split(' ')[0] || null;

export const appendUniqueTags = (current: string[], next: string[]) =>
  [...new Set([...current.map((item) => item.trim()).filter(Boolean), ...next.map((item) => item.trim()).filter(Boolean)])];

export const boolFromEnv = (value: string | undefined, fallback = false) => {
  if (value == null) {
    return fallback;
  }
  return value === '1' || value.toLowerCase() === 'true';
};
