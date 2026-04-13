import { jidNormalizedUser } from 'baileys';
import type { WAMessage } from 'baileys';
import type { MessageKind, NormalizedInboundMessage } from './types.js';

const sanitizeText = (value: string | null | undefined, maxLength = 4000) =>
  (value ?? '')
    .replace(/\r/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const normalizePhoneE164 = (value: string) => {
  const digits = value.replace(/\D/g, '');

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    return `+${digits}`;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  throw new Error(`Numero de WhatsApp invalido: ${value}`);
};

const tryNormalizePhoneE164 = (value: string) => {
  try {
    return normalizePhoneE164(value);
  } catch {
    return null;
  }
};

const messageTimestampToIso = (value: unknown) => {
  if (typeof value === 'number') {
    return new Date(value * 1000).toISOString();
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return new Date(parsed * 1000).toISOString();
    }
  }

  if (typeof value === 'object' && value && 'low' in value && typeof (value as { low?: unknown }).low === 'number') {
    return new Date((value as { low: number }).low * 1000).toISOString();
  }

  return new Date().toISOString();
};

const extractTextFromMessage = (message: WAMessage['message']): { messageType: MessageKind; text: string } => {
  if (!message) {
    return { messageType: 'unsupported', text: '' };
  }

  if (typeof message.conversation === 'string') {
    return { messageType: 'text', text: sanitizeText(message.conversation) };
  }

  if (message.extendedTextMessage?.text) {
    return { messageType: 'text', text: sanitizeText(message.extendedTextMessage.text) };
  }

  if (message.imageMessage?.caption) {
    return { messageType: 'text', text: sanitizeText(message.imageMessage.caption) };
  }

  if (message.videoMessage?.caption) {
    return { messageType: 'text', text: sanitizeText(message.videoMessage.caption) };
  }

  if (message.buttonsResponseMessage?.selectedDisplayText) {
    return { messageType: 'button', text: sanitizeText(message.buttonsResponseMessage.selectedDisplayText) };
  }

  if (message.templateButtonReplyMessage?.selectedDisplayText) {
    return { messageType: 'button', text: sanitizeText(message.templateButtonReplyMessage.selectedDisplayText) };
  }

  if (message.listResponseMessage?.title || message.listResponseMessage?.singleSelectReply?.selectedRowId) {
    return {
      messageType: 'interactive',
      text: sanitizeText(message.listResponseMessage.title || message.listResponseMessage.singleSelectReply?.selectedRowId || ''),
    };
  }

  if (message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
    return {
      messageType: 'interactive',
      text: sanitizeText(message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson),
    };
  }

  return {
    messageType: 'unsupported',
    text: 'Mensagem nao textual recebida.',
  };
};

const extractPhoneFromJid = (jid: string | null | undefined) => {
  const candidate = (jid ?? '').split(':')[0]?.split('@')[0] ?? '';
  return tryNormalizePhoneE164(candidate);
};

const shouldIgnoreInboundPayload = (message: WAMessage['message']) => {
  if (!message) {
    return true;
  }

  // Ignore service/sync payloads that are not customer-authored content.
  if (message.protocolMessage || message.senderKeyDistributionMessage) {
    return true;
  }

  return false;
};

export const buildRecipientJid = (phoneE164: string) => {
  const digits = phoneE164.replace(/\D/g, '');
  return jidNormalizedUser(`${digits}@s.whatsapp.net`);
};

export const normalizeIncomingMessage = (message: WAMessage): NormalizedInboundMessage | null => {
  const remoteJid = message.key.remoteJid;
  if (!remoteJid || message.key.fromMe) {
    return null;
  }

  if (remoteJid === 'status@broadcast' || remoteJid.endsWith('@broadcast') || remoteJid.endsWith('@g.us') || remoteJid.includes('newsletter')) {
    return null;
  }

  if (!message.key.id) {
    return null;
  }

  if (shouldIgnoreInboundPayload(message.message)) {
    return null;
  }

  const { messageType, text } = extractTextFromMessage(message.message);
  const fromPhone = extractPhoneFromJid(remoteJid);
  if (!fromPhone) {
    return null;
  }

  return {
    providerMessageId: message.key.id,
    timestamp: messageTimestampToIso(message.messageTimestamp),
    fromPhone,
    whatsappWaId: fromPhone.replace(/\D/g, ''),
    contactName: sanitizeText(message.pushName, 160) || null,
    messageType,
    text,
    rawPayload: {
      key: message.key,
      pushName: message.pushName ?? null,
      message: message.message ?? null,
      messageTimestamp: String(message.messageTimestamp ?? ''),
    },
  };
};
