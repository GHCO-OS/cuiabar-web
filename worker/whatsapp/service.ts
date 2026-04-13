import { nowIso } from '../lib/db';
import type { Env } from '../types';
import { summarizeConversationWithAi } from './aiService';
import { getWhatsAppAutomationSettings, getWhatsAppTestModeSettings } from './control';
import { createCrmAdapter } from './crmAdapter';
import { detectIntent } from './intentEngine';
import { buildBusinessContext } from './knowledge';
import { logStructured } from './logger';
import {
  acknowledgeOutboundCommand,
  claimPendingOutboundCommands,
  cancelPendingOutboundCommands,
  createOutboundCommand,
  failOutboundCommand,
  findMessageByProviderId,
  getOpenReservationFlow,
  getOrCreateConversation,
  getOutboundCommand,
  getRecentTranscript,
  insertAuditLog,
  insertConversationMessage,
  markMessageProcessed,
  openHandoff,
  updateConversation,
  updateCustomerProfileSummary,
  updateMessageStatus,
  upsertCustomerProfile,
  upsertReservationFlow,
} from './repository';
import { evaluateRules } from './rulesEngine';
import { loadSession, saveSession } from './session';
import type { InboundProcessResult, OutboundCommandRecord, ParsedInboundMessage, ParsedStatusUpdate, RuleResult, SessionState } from './types';
import { phonesMatch, sanitizeMessageText } from './utils';

const buildFallbackSummary = (params: {
  intent: string;
  summaryHint?: string;
  lastCustomerMessage: string;
  replyText: string | null;
}) => {
  const parts = [
    `Intent principal: ${params.intent}.`,
    params.summaryHint ? `Resumo: ${params.summaryHint}` : '',
    params.lastCustomerMessage ? `Cliente disse: ${sanitizeMessageText(params.lastCustomerMessage, 140)}.` : '',
    params.replyText ? `Resposta preparada: ${sanitizeMessageText(params.replyText, 160)}.` : '',
  ].filter(Boolean);
  return parts.join(' ');
};

const updateSessionFromRule = (session: SessionState, rule: RuleResult, contextChannelUrl: string): SessionState => {
  const inviteSent = Boolean(rule.reply?.text.includes(contextChannelUrl));
  const fallbackCount = rule.intent.intent === 'unknown' ? session.fallbackCount + 1 : 0;

  return {
    ...session,
    fallbackCount,
    lastIntent: rule.intent.intent,
    lastInviteAt: inviteSent ? new Date().toISOString() : session.lastInviteAt,
    handoffOpen: rule.openHandoff ? true : session.handoffOpen,
  };
};

const buildInteractionType = (hasHandoff: boolean, hasReservationFlow: boolean, intent: string) =>
  hasHandoff ? 'handoff_opened' : hasReservationFlow || intent === 'reserva' ? 'reservation_message' : 'conversation_message';

const finalizeSuppressedInbound = async (params: {
  env: Env;
  message: ParsedInboundMessage;
  session: SessionState;
  conversationId: string;
  customerProfileId: string;
  customerDisplayName: string | null;
  intent: Awaited<ReturnType<typeof detectIntent>>;
  summaryHint: string;
  tags: string[];
  eventType: string;
  metadata: Record<string, unknown>;
}) => {
  const context = buildBusinessContext(params.env);
  const transcript = await getRecentTranscript(params.env, params.conversationId);
  const summary =
    (await summarizeConversationWithAi(params.env, context, transcript)) ??
    buildFallbackSummary({
      intent: params.intent.intent,
      summaryHint: params.summaryHint,
      lastCustomerMessage: params.message.text,
      replyText: null,
    });

  await markMessageProcessed(params.env, params.message.providerMessageId, {
    intent: params.intent.intent,
    intentConfidence: params.intent.confidence,
    ruleName: params.eventType,
    templateKey: null,
    aiModel: null,
  });

  await updateConversation(params.env, params.conversationId, {
    status: 'active',
    stage: 'assistant',
    currentIntent: params.intent.intent,
    currentFlow: null,
    handoffRequested: false,
    tags: params.tags,
    summary,
    lastInboundAt: params.message.timestamp,
  });
  await updateCustomerProfileSummary(params.env, params.customerProfileId, summary, params.tags);

  const crmAdapter = createCrmAdapter(params.env);
  await crmAdapter.syncConversation({
    customerProfileId: params.customerProfileId,
    conversationId: params.conversationId,
    phoneE164: params.message.fromPhone,
    displayName: params.customerDisplayName,
    summary,
    tags: params.tags,
    latestIntent: params.intent.intent,
    interactionType: 'conversation_message',
    messageText: params.message.text,
    metadata: params.metadata,
  });

  const nextSession: SessionState = {
    ...params.session,
    conversationId: params.conversationId,
    customerProfileId: params.customerProfileId,
    lastIntent: params.intent.intent,
    summary,
  };
  await saveSession(params.env, params.message.fromPhone, nextSession);

  await insertAuditLog(params.env, {
    conversationId: params.conversationId,
    customerProfileId: params.customerProfileId,
    eventType: params.eventType,
    details: {
      providerMessageId: params.message.providerMessageId,
      intent: params.intent.intent,
      ...params.metadata,
    },
  });

  return {
    conversationId: params.conversationId,
    customerProfileId: params.customerProfileId,
    summary,
    outboundCommand: null,
  } satisfies InboundProcessResult;
};

export const processInboundMessage = async (env: Env, message: ParsedInboundMessage): Promise<InboundProcessResult> => {
  const existingMessage = await findMessageByProviderId(env, message.providerMessageId);
  if (existingMessage?.processed_at) {
    logStructured('whatsapp_inbound_duplicate_ignored', {
      providerMessageId: message.providerMessageId,
    });

    const session = await loadSession(env, message.fromPhone);
    return {
      conversationId: session.conversationId ?? '',
      customerProfileId: session.customerProfileId ?? '',
      summary: session.summary ?? 'Mensagem duplicada ignorada.',
      outboundCommand: null,
    };
  }

  const context = buildBusinessContext(env);
  const profile = await upsertCustomerProfile(env, {
    phoneE164: message.fromPhone,
    whatsappWaId: message.whatsappWaId,
    displayName: message.contactName,
  });
  const conversation = await getOrCreateConversation(env, {
    customerProfileId: profile.id,
    phoneE164: message.fromPhone,
    whatsappWaId: message.whatsappWaId,
    whatsappProfileName: message.contactName,
  });
  const session = await loadSession(env, message.fromPhone);
  const currentFlow = await getOpenReservationFlow(env, conversation.id);

  if (!existingMessage) {
    await insertConversationMessage(env, {
      conversationId: conversation.id,
      direction: 'inbound',
      providerMessageId: message.providerMessageId,
      messageType: message.messageType,
      messageText: message.text,
      normalizedText: message.text,
      payload: message.rawPayload,
    });
  }

  const automationSettings = await getWhatsAppAutomationSettings(env);
  const intent = await detectIntent(env, context, session, message.text);
  const testModeSettings = await getWhatsAppTestModeSettings(env);
  const blockedByTestMode = testModeSettings.enabled && !phonesMatch(message.fromPhone, testModeSettings.allowedPhoneE164);

  if (blockedByTestMode) {
    return finalizeSuppressedInbound({
      env,
      message,
      session,
      conversationId: conversation.id,
      customerProfileId: profile.id,
      customerDisplayName: profile.display_name,
      intent,
      summaryHint: testModeSettings.allowedPhoneE164
        ? `Modo teste ativo. Apenas ${testModeSettings.allowedPhoneE164} recebe respostas automaticas.`
        : 'Modo teste ativo sem numero liberado. Nenhuma resposta automatica foi enviada.',
      tags: [`intent:${intent.intent}`, 'test_mode_blocked'],
      eventType: 'test_mode_no_reply',
      metadata: {
        automationEnabled: automationSettings.enabled,
        testModeEnabled: true,
        allowedPhoneE164: testModeSettings.allowedPhoneE164,
      },
    });
  }

  if (!automationSettings.enabled) {
    return finalizeSuppressedInbound({
      env,
      message,
      session,
      conversationId: conversation.id,
      customerProfileId: profile.id,
      customerDisplayName: profile.display_name,
      intent,
      summaryHint: 'Automacao pausada manualmente no painel do CRM.',
      tags: [`intent:${intent.intent}`, 'automation_paused'],
      eventType: 'automation_paused_no_reply',
      metadata: {
        automationEnabled: false,
        testModeEnabled: testModeSettings.enabled,
        allowedPhoneE164: testModeSettings.allowedPhoneE164,
      },
    });
  }

  const rule = await evaluateRules(env, context, {
    intent,
    session,
    messageText: message.text,
    messageType: message.messageType,
    currentFlow,
    fallbackCustomerName: profile.display_name,
    phoneE164: message.fromPhone,
    profileEmail: profile.email,
  });

  let handoffId: string | null = null;
  if (rule.reservationFlowUpdate) {
    const flow = await upsertReservationFlow(env, {
      flowId: currentFlow?.id,
      conversationId: conversation.id,
      customerProfileId: profile.id,
      status: rule.reservationFlowUpdate.status,
      currentStep: rule.reservationFlowUpdate.currentStep,
      customerName: rule.reservationFlowUpdate.customerName,
      reservationDate: rule.reservationFlowUpdate.reservationDate,
      reservationTime: rule.reservationFlowUpdate.reservationTime,
      guestCount: rule.reservationFlowUpdate.guestCount,
      notes: rule.reservationFlowUpdate.notes,
      reservationId: rule.reservationFlowUpdate.reservationId,
      reservationCode: rule.reservationFlowUpdate.reservationCode,
      metadata: rule.reservationFlowUpdate.metadata,
      completedAt: rule.reservationFlowUpdate.completedAt,
    });
    session.activeReservationFlowId = flow.id;
  }

  if (rule.openHandoff) {
    const handoff = await openHandoff(env, {
      conversationId: conversation.id,
      customerProfileId: profile.id,
      reason: rule.openHandoff.reason,
      priority: rule.openHandoff.priority,
      notes: rule.openHandoff.notes ?? null,
      metadata: {
        lastIntent: rule.intent.intent,
      },
    });
    handoffId = handoff.id;
  }

  const outboundCommand = rule.reply
    ? await createOutboundCommand(env, {
        conversationId: conversation.id,
        customerProfileId: profile.id,
        phoneE164: message.fromPhone,
        textBody: rule.reply.text,
        source: 'assistant',
        status: 'processing',
        intent: rule.reply.intent,
        templateKey: rule.reply.templateKey,
        ruleName: rule.reply.ruleName,
        aiModel: rule.reply.aiModel ?? null,
        payload: {
          auto: true,
          triggerMessageId: message.providerMessageId,
        },
      })
    : null;

  await markMessageProcessed(env, message.providerMessageId, {
    intent: rule.intent.intent,
    intentConfidence: rule.intent.confidence,
    ruleName: rule.reply?.ruleName ?? null,
    templateKey: rule.reply?.templateKey ?? null,
    aiModel: rule.reply?.aiModel ?? null,
  });

  const transcript = await getRecentTranscript(env, conversation.id);
  const summary =
    (await summarizeConversationWithAi(env, context, transcript)) ??
    buildFallbackSummary({
      intent: rule.intent.intent,
      summaryHint: rule.summaryHint,
      lastCustomerMessage: message.text,
      replyText: rule.reply?.text ?? null,
    });

  const stage =
    rule.openHandoff
      ? 'human_handoff'
      : rule.reservationFlowUpdate && rule.reservationFlowUpdate.status !== 'submitted' && rule.reservationFlowUpdate.status !== 'cancelled'
        ? 'reservation'
        : 'assistant';
  const status = rule.openHandoff ? 'human_handoff' : 'active';

  await updateConversation(env, conversation.id, {
    status,
    stage,
    currentIntent: rule.intent.intent,
    currentFlow: rule.reservationFlowUpdate ? 'reservation' : null,
    handoffRequested: Boolean(rule.openHandoff),
    tags: [...rule.tags, `intent:${rule.intent.intent}`],
    summary,
    lastInboundAt: message.timestamp,
  });
  await updateCustomerProfileSummary(env, profile.id, summary, [...rule.tags, `intent:${rule.intent.intent}`]);

  const crmAdapter = createCrmAdapter(env);
  await crmAdapter.syncConversation({
    customerProfileId: profile.id,
    conversationId: conversation.id,
    phoneE164: message.fromPhone,
    displayName: profile.display_name,
    summary,
    tags: [...rule.tags, `intent:${rule.intent.intent}`],
    latestIntent: rule.intent.intent,
    interactionType: buildInteractionType(Boolean(handoffId), Boolean(currentFlow), rule.intent.intent),
    messageText: message.text,
    metadata: {
      handoffId,
      outboundCommandId: outboundCommand?.id ?? null,
    },
  });

  const nextSession = updateSessionFromRule(session, rule, context.whatsappChannelUrl);
  nextSession.conversationId = conversation.id;
  nextSession.customerProfileId = profile.id;
  nextSession.summary = summary;
  if (rule.reservationFlowUpdate?.status === 'submitted' || rule.reservationFlowUpdate?.status === 'cancelled' || rule.reservationFlowUpdate?.status === 'handoff') {
    nextSession.activeReservationFlowId = undefined;
  }
  await saveSession(env, message.fromPhone, nextSession);

  await insertAuditLog(env, {
    conversationId: conversation.id,
    customerProfileId: profile.id,
    eventType: 'inbound_message_processed',
    details: {
      providerMessageId: message.providerMessageId,
      intent: rule.intent.intent,
      handoffId,
      outboundCommandId: outboundCommand?.id ?? null,
    },
  });

  return {
    conversationId: conversation.id,
    customerProfileId: profile.id,
    summary,
    outboundCommand: outboundCommand
      ? {
          id: outboundCommand.id,
          toPhone: outboundCommand.phone_e164,
          text: outboundCommand.text_body,
        }
      : null,
  };
};

export const processStatusUpdate = async (env: Env, status: ParsedStatusUpdate) => {
  await updateMessageStatus(env, status.providerMessageId, status.status, status.rawPayload);
};

export const acknowledgeOutboundDelivery = async (
  env: Env,
  params: {
    commandId: string;
    providerMessageId: string | null;
    payload?: Record<string, unknown>;
  },
) => {
  const command = await acknowledgeOutboundCommand(env, params);
  if (!command) {
    throw new Error('Comando de saida nao encontrado.');
  }

  await insertConversationMessage(env, {
    conversationId: command.conversation_id,
    direction: 'outbound',
    providerMessageId: params.providerMessageId,
    providerStatus: 'sent',
    messageType: 'text',
    messageText: command.text_body,
    normalizedText: command.text_body,
    intent: command.intent,
    ruleName: command.rule_name,
    templateKey: command.template_key,
    aiModel: command.ai_model,
    payload: params.payload ?? {},
    processedAt: nowIso(),
  });

  await updateConversation(env, command.conversation_id, {
    lastOutboundAt: nowIso(),
  });

  await insertAuditLog(env, {
    conversationId: command.conversation_id,
    customerProfileId: command.customer_profile_id,
    eventType: 'outbound_command_sent',
    details: {
      commandId: command.id,
      providerMessageId: params.providerMessageId,
    },
  });

  return command;
};

export const failOutboundDelivery = async (
  env: Env,
  params: {
    commandId: string;
    errorMessage: string;
    payload?: Record<string, unknown>;
  },
) => {
  const command = await failOutboundCommand(env, params);
  if (!command) {
    throw new Error('Comando de saida nao encontrado.');
  }

  await insertAuditLog(env, {
    conversationId: command.conversation_id,
    customerProfileId: command.customer_profile_id,
    eventType: 'outbound_command_failed',
    level: 'error',
    details: {
      commandId: command.id,
      errorMessage: params.errorMessage,
    },
  });

  return command;
};

export const pullPendingOutboundCommands = async (env: Env, limit = 10) => {
  const automationSettings = await getWhatsAppAutomationSettings(env);
  const testModeSettings = await getWhatsAppTestModeSettings(env);
  return claimPendingOutboundCommands(env, limit, {
    allowedSources: automationSettings.enabled ? ['assistant', 'admin', 'system'] : ['admin', 'system'],
    assistantPhoneAllowlist: testModeSettings.enabled ? (testModeSettings.allowedPhoneE164 ? [testModeSettings.allowedPhoneE164] : []) : undefined,
  });
};

export const cancelAutomaticOutboundForSafety = async (
  env: Env,
  params: {
    reason: string;
    excludedPhoneE164?: string | null;
  },
) =>
  cancelPendingOutboundCommands(env, {
    reason: params.reason,
    sources: ['assistant'],
    excludedPhoneE164: params.excludedPhoneE164 ?? null,
  });

export const createManualOutboundCommand = async (
  env: Env,
  params: {
    conversationId: string;
    customerProfileId: string;
    phoneE164: string;
    text: string;
    actor: string;
  },
) => {
  const command = await createOutboundCommand(env, {
    conversationId: params.conversationId,
    customerProfileId: params.customerProfileId,
    phoneE164: params.phoneE164,
    textBody: params.text,
    source: 'admin',
    intent: 'humano',
    templateKey: 'manual_admin_reply',
    ruleName: 'manual_admin_reply',
    payload: {
      actor: params.actor,
    },
  });

  await updateConversation(env, params.conversationId, {
    status: 'human_handoff',
    stage: 'human_handoff',
    currentIntent: 'humano',
    handoffRequested: true,
    tags: ['manual_reply', 'handoff_open'],
    summary: `Resposta manual preparada por ${params.actor}: ${params.text}`,
  });

  await insertAuditLog(env, {
    conversationId: params.conversationId,
    customerProfileId: params.customerProfileId,
    eventType: 'manual_reply_queued',
    actor: params.actor,
    details: {
      commandId: command.id,
    },
  });

  return command;
};

export const getOutboundCommandDetail = (env: Env, commandId: string): Promise<OutboundCommandRecord | null> => getOutboundCommand(env, commandId);
