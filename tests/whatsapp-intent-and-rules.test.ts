import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_BUSINESS_CONTEXT } from '../worker/whatsapp/constants';
import { detectIntent } from '../worker/whatsapp/intentEngine';
import { evaluateRules } from '../worker/whatsapp/rulesEngine';

const emptyEnv = {} as never;

test('detectIntent prioriza regra de delivery', async () => {
  const result = await detectIntent(emptyEnv, DEFAULT_BUSINESS_CONTEXT, { fallbackCount: 0 }, 'Quero pedir delivery hoje');

  assert.equal(result.intent, 'delivery');
  assert.equal(result.source, 'rule');
  assert.ok(result.confidence >= 0.75);
});

test('evaluateRules abre handoff quando cliente pede humano', async () => {
  const result = await evaluateRules(emptyEnv, DEFAULT_BUSINESS_CONTEXT, {
    intent: {
      intent: 'humano',
      confidence: 0.98,
      matchedKeywords: ['atendente'],
      source: 'rule',
    },
    session: { fallbackCount: 0 },
    messageText: 'Quero falar com um atendente',
    messageType: 'text',
    currentFlow: null,
    fallbackCustomerName: 'Leonardo Silva',
    phoneE164: '+551933058878',
    profileEmail: null,
  });

  assert.equal(result.openHandoff?.priority, 'normal');
  assert.equal(result.reply?.templateKey, 'handoff');
});
