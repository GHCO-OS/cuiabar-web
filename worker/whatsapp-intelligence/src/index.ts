import { BaileysSessionDO } from './BaileysSessionDO';
import { executeCrmCommands } from './crmCommander';
import { llamaProcessMessage } from './llamaProcessor';
import { ensureInboundEvent, getCustomerContext, saveConversation } from './storage';
import type { BaileysWebhookPayload, LlamaAction } from './types';

export interface Env {
  AI: Ai;
  BAILEYS_SESSION: DurableObjectNamespace;
  DB: D1Database;
  CRM_INTERNAL_SECRET: string;
  WEBHOOK_SHARED_SECRET: string;
  BAILEYS_GATEWAY_TOKEN: string;
  CRM_INTERNAL_API_BASE: string;
  BAILEYS_GATEWAY_BASE_URL: string;
  ENVIRONMENT: string;
  WHATSAPP_INTELLIGENCE_ENABLED?: string;
}

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

const unauthorized = () => json({ ok: false, error: 'unauthorized' }, 401);
const serviceUnavailable = (error = 'whatsapp_intelligence_disabled') => json({ ok: false, error }, 503);
const isWhatsAppEnabled = (env: Env) => env.WHATSAPP_INTELLIGENCE_ENABLED === 'true';

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    throw new Error('Telefone ausente no payload.');
  }
  if (digits.length >= 12 && digits.startsWith('55')) {
    return `+${digits}`;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }
  throw new Error('Telefone fora do formato esperado.');
};

const secureEqual = (a: string, b: string) => {
  const aa = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let index = 0; index < aa.length; index += 1) {
    diff |= aa[index] ^ bb[index];
  }
  return diff === 0;
};

const parsePayload = async (request: Request): Promise<BaileysWebhookPayload> => {
  const body = (await request.json()) as Partial<BaileysWebhookPayload>;

  if (!body.messageId || !body.phone || !body.message) {
    throw new Error('Payload invalido. Campos obrigatorios: messageId, phone, message.');
  }

  return {
    messageId: body.messageId,
    phone: body.phone,
    message: body.message,
    pushName: body.pushName,
    timestamp: body.timestamp,
  };
};

const clampActions = (actions: LlamaAction[]) => actions.slice(0, 4);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({
        ok: true,
        service: 'cuiabar-whatsapp-intelligence',
        env: env.ENVIRONMENT || 'unknown',
        enabled: isWhatsAppEnabled(env),
      });
    }

    if (url.pathname === '/webhook/baileys' && request.method === 'POST') {
      if (!isWhatsAppEnabled(env)) {
        return serviceUnavailable();
      }

      const incomingSecret = request.headers.get('x-internal-secret') || '';
      if (!incomingSecret || !secureEqual(incomingSecret, env.WEBHOOK_SHARED_SECRET)) {
        return unauthorized();
      }

      try {
        const payload = await parsePayload(request);
        const normalizedPhone = normalizePhone(payload.phone);

        const firstSeen = await ensureInboundEvent(env.DB, payload.messageId, normalizedPhone, payload.timestamp || null);
        if (!firstSeen) {
          return json({ ok: true, deduplicated: true });
        }

        const customer = await getCustomerContext(env.DB, normalizedPhone, payload.pushName);
        const llama = await llamaProcessMessage(payload.message, normalizedPhone, customer, env);
        const actions = clampActions(llama.actions);

        await executeCrmCommands(actions, env, {
          phone: normalizedPhone,
          customer,
          originalMessage: payload.message,
          modelResponse: llama.response,
        });

        await saveConversation(env.DB, {
          phone: normalizedPhone,
          messageId: payload.messageId,
          messageIn: payload.message,
          messageOut: llama.response,
          actions,
          modelRaw: llama.rawModelResponse || null,
        });

        const sessionName = `session-${normalizedPhone}`;
        const stub = env.BAILEYS_SESSION.get(env.BAILEYS_SESSION.idFromName(sessionName));
        const delivery = await stub.fetch('http://baileys-session/send', {
          method: 'POST',
          headers: { 'content-type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ to: normalizedPhone, text: llama.response }),
        });

        if (!delivery.ok) {
          return json({ ok: false, error: 'failed_to_deliver_message' }, 502);
        }

        return json({ ok: true, actionsExecuted: actions.length });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown_error';
        return json({ ok: false, error: message }, 400);
      }
    }

    return new Response('Cuiabar WhatsApp Intelligence Layer', { status: 200 });
  },
};

export { BaileysSessionDO };
