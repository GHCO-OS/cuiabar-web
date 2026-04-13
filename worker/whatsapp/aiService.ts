import type { Env } from '../types';
import { DEFAULT_WHATSAPP_AI_MODEL } from './constants';
import { buildKnowledgeBullets } from './knowledge';
import type { AiMode, BusinessContext, IntentResult, SessionState, WhatsAppIntent } from './types';
import { getCachedJson, putCachedJson } from './session';
import { parseJsonObjectFromText, sanitizeMessageText } from './utils';

type RawAiResponse = {
  response?: string;
  result?: {
    response?: string;
  };
};

type IntentClassificationPayload = {
  intent: WhatsAppIntent;
  confidence: number;
  matchedKeywords?: string[];
};

const getAiMode = (env: Env): AiMode => {
  const value = (env.WHATSAPP_AI_MODE ?? '').trim().toLowerCase();
  if (value === 'rest' || value === 'binding' || value === 'off') {
    return value;
  }
  return env.AI ? 'binding' : env.CLOUDFLARE_AI_API_TOKEN ? 'rest' : 'off';
};

const getAiModel = (env: Env) => env.WHATSAPP_AI_MODEL?.trim() || DEFAULT_WHATSAPP_AI_MODEL;

const unwrapResponseText = (payload: unknown) => {
  const typed = payload as RawAiResponse;
  return typed?.response ?? typed?.result?.response ?? '';
};

const callAiBinding = async (env: Env, prompt: string) => {
  if (!env.AI) {
    return '';
  }
  const response = await env.AI.run(getAiModel(env) as keyof AiModels, {
    prompt,
  });
  return unwrapResponseText(response);
};

const callAiRest = async (env: Env, prompt: string) => {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token = env.CLOUDFLARE_AI_API_TOKEN?.trim();
  if (!accountId || !token) {
    return '';
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${getAiModel(env)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Workers AI REST failed with status ${response.status}`);
  }

  return unwrapResponseText(await response.json());
};

const runAi = async (env: Env, prompt: string) => {
  const mode = getAiMode(env);
  if (mode === 'off') {
    return null;
  }
  if (mode === 'rest') {
    return callAiRest(env, prompt);
  }
  return callAiBinding(env, prompt);
};

export const classifyIntentWithAi = async (
  env: Env,
  text: string,
  context: BusinessContext,
  session: SessionState,
): Promise<IntentResult | null> => {
  const normalizedText = sanitizeMessageText(text);
  if (!normalizedText) {
    return null;
  }

  const cached = await getCachedJson<IntentClassificationPayload>(env, 'intent', normalizedText);
  if (cached?.intent) {
    return {
      intent: cached.intent,
      confidence: cached.confidence,
      matchedKeywords: cached.matchedKeywords ?? [],
      source: 'ai',
    };
  }

  const prompt = [
    'Voce classifica mensagens de WhatsApp do Villa Cuiabar.',
    'Escolha exatamente um intent da lista: menu, delivery, hamburguer, marmita, reserva, evento, localizacao, horarios, reclamacao, humano, unknown.',
    'Retorne apenas JSON no formato {"intent":"...","confidence":0.0,"matchedKeywords":["..."]}.',
    'Se houver risco de inventar, use unknown.',
    `Ultimo intent conhecido: ${session.lastIntent ?? 'unknown'}.`,
    `Mensagem do cliente: ${normalizedText}`,
    ...buildKnowledgeBullets(context),
  ].join('\n');

  const responseText = await runAi(env, prompt);
  if (!responseText) {
    return null;
  }

  const parsed = parseJsonObjectFromText<IntentClassificationPayload>(responseText);
  if (!parsed?.intent) {
    return null;
  }

  const intentResult: IntentResult = {
    intent: parsed.intent,
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords.map((item) => sanitizeMessageText(String(item), 40)) : [],
    source: 'ai',
  };

  await putCachedJson(env, 'intent', normalizedText, {
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    matchedKeywords: intentResult.matchedKeywords,
  });

  return intentResult;
};

export const summarizeConversationWithAi = async (env: Env, context: BusinessContext, transcript: string) => {
  const prompt = [
    'Resuma a conversa em portugues, em no maximo 3 frases curtas.',
    'Inclua apenas fatos confirmados: intenção principal, proximo passo e qualquer pendencia.',
    'Nao invente.',
    ...buildKnowledgeBullets(context),
    `Transcricao:\n${transcript}`,
  ].join('\n');

  const response = await runAi(env, prompt);
  return response ? sanitizeMessageText(response, 320) : null;
};

export const generateGroundedReplyWithAi = async (env: Env, context: BusinessContext, text: string) => {
  const prompt = [
    'Voce responde clientes do Villa Cuiabar por WhatsApp.',
    'Tom: comercial, natural, objetivo e util.',
    'Use apenas os fatos fornecidos.',
    'Se faltar base, diga que vai direcionar para atendimento humano.',
    'Nao use markdown.',
    ...buildKnowledgeBullets(context),
    `Mensagem do cliente: ${sanitizeMessageText(text)}`,
  ].join('\n');

  const response = await runAi(env, prompt);
  return response ? sanitizeMessageText(response, 600) : null;
};

export const getAiModelName = (env: Env) => getAiModel(env);
