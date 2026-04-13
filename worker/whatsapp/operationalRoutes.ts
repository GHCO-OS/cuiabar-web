import type { Hono } from 'hono';
import { first, parseJsonText } from '../lib/db';
import { HttpError, requireJsonBody } from '../lib/http';
import type { AppVariables, Env } from '../types';
import {
  getBridgeControlRequest,
  getBridgeRuntimeStatus,
  getPendingBridgeControlRequest,
  getWhatsAppAutomationSettings,
  getWhatsAppTestModeSettings,
  requestBridgeControl,
  resolveBridgeControlRequest,
  resolveCustomerCategory,
  setWhatsAppAutomationSettings,
  setWhatsAppTestModeSettings,
  updateBridgeRuntimeStatus,
  updateCustomerCategory,
  type BridgeStatusHeartbeatPayload,
  type CustomerCategory,
} from './control';
import { syncConversationToLocalCrm } from './crmAdapter';
import {
  acknowledgeOutboundDelivery,
  cancelAutomaticOutboundForSafety,
  createManualOutboundCommand,
  failOutboundDelivery,
  getOutboundCommandDetail,
  processInboundMessage,
  processStatusUpdate,
  pullPendingOutboundCommands,
} from './service';
import {
  getConversationDetail,
  insertAuditLog,
  listConversationRows,
  openHandoff,
  updateConversation,
} from './repository';
import type { CrmSyncPayload, InboundBridgePayload, ParsedStatusUpdate } from './types';

type WhatsAppOpsApp = Hono<{ Bindings: Env; Variables: AppVariables }>;

const requireAuthenticatedUser = (c: { get: (key: 'user') => AppVariables['user'] }) => {
  const user = c.get('user');
  if (!user) {
    throw new HttpError(401, 'Autenticacao necessaria para acessar o modulo de WhatsApp.');
  }
  return user;
};

const requireManager = (c: { get: (key: 'user') => AppVariables['user'] }) => {
  const user = requireAuthenticatedUser(c);
  if (!user.roles.includes('gerente')) {
    throw new HttpError(403, 'Apenas gerentes podem executar esta acao.');
  }
  return user;
};

const verifyInternalToken = (request: Request, env: Env) => {
  const expected = env.CRM_INTERNAL_TOKEN?.trim();
  if (!expected) {
    throw new HttpError(503, 'Token interno do CRM nao configurado.');
  }

  const provided = request.headers.get('x-internal-token')?.trim();
  if (!provided || provided !== expected) {
    throw new HttpError(401, 'Token interno invalido.');
  }
};

export const registerWhatsAppOperationalRoutes = (app: WhatsAppOpsApp) => {
  app.post('/api/internal/whatsapp/crm/sync', async (c) => {
    verifyInternalToken(c.req.raw, c.env);
    const payload = await requireJsonBody<CrmSyncPayload>(c.req.raw);
    const result = await syncConversationToLocalCrm(c.env, payload);
    return c.json({ ok: true, result });
  });

  app.post('/api/internal/whatsapp/inbound', async (c) => {
    verifyInternalToken(c.req.raw, c.env);
    const payload = await requireJsonBody<InboundBridgePayload>(c.req.raw);
    const result = await processInboundMessage(c.env, payload.message);
    return c.json({ ok: true, result });
  });

  app.post('/api/internal/whatsapp/status', async (c) => {
    verifyInternalToken(c.req.raw, c.env);
    const payload = await requireJsonBody<{ status: ParsedStatusUpdate }>(c.req.raw);
    await processStatusUpdate(c.env, payload.status);
    return c.json({ ok: true });
  });

  app.post('/api/internal/whatsapp/bridge/heartbeat', async (c) => {
    verifyInternalToken(c.req.raw, c.env);
    const payload = await requireJsonBody<{ status: BridgeStatusHeartbeatPayload }>(c.req.raw);
    const status = await updateBridgeRuntimeStatus(c.env, payload.status);
    return c.json({ ok: true, status });
  });

  app.get('/api/internal/whatsapp/bridge/control', async (c) => {
    verifyInternalToken(c.req.raw, c.env);
    const request = await getPendingBridgeControlRequest(c.env);
    return c.json({ ok: true, request });
  });

  app.post('/api/internal/whatsapp/bridge/control/:id/ack', async (c) => {
    verifyInternalToken(c.req.raw, c.env);
    const body = await requireJsonBody<{ status: 'completed' | 'failed' | 'ignored'; resultMessage?: string | null }>(c.req.raw);
    const request = await resolveBridgeControlRequest(c.env, {
      id: c.req.param('id'),
      status: body.status,
      resultMessage: body.resultMessage ?? null,
    });

    if (!request) {
      throw new HttpError(404, 'Solicitacao de controle nao encontrada.');
    }

    await insertAuditLog(c.env, {
      eventType: 'bridge_control_acknowledged',
      actor: 'baileys_bridge',
      details: {
        requestId: request.id,
        action: request.action,
        status: request.status,
        resultMessage: request.resultMessage,
      },
    });

    return c.json({ ok: true, request });
  });

  app.get('/api/internal/whatsapp/outbound/pull', async (c) => {
    verifyInternalToken(c.req.raw, c.env);
    const limit = Math.min(Math.max(Number(c.req.query('limit') || '10'), 1), 25);
    const commands = await pullPendingOutboundCommands(c.env, limit);
    return c.json({
      ok: true,
      commands: commands.map((command) => ({
        id: command.id,
        conversationId: command.conversation_id,
        customerProfileId: command.customer_profile_id,
        phoneE164: command.phone_e164,
        text: command.text_body,
        source: command.source,
        intent: command.intent,
        templateKey: command.template_key,
        ruleName: command.rule_name,
        createdAt: command.created_at,
      })),
    });
  });

  app.post('/api/internal/whatsapp/outbound/:id/ack', async (c) => {
    verifyInternalToken(c.req.raw, c.env);
    const commandId = c.req.param('id');
    const body = await requireJsonBody<{ providerMessageId?: string | null; payload?: Record<string, unknown> }>(c.req.raw);
    const command = await acknowledgeOutboundDelivery(c.env, {
      commandId,
      providerMessageId: body.providerMessageId ?? null,
      payload: body.payload,
    });
    return c.json({ ok: true, commandId: command.id });
  });

  app.post('/api/internal/whatsapp/outbound/:id/fail', async (c) => {
    verifyInternalToken(c.req.raw, c.env);
    const commandId = c.req.param('id');
    const body = await requireJsonBody<{ errorMessage?: string; payload?: Record<string, unknown> }>(c.req.raw);
    if (!body.errorMessage?.trim()) {
      throw new HttpError(400, 'Informe errorMessage para falha do comando.');
    }
    const command = await failOutboundDelivery(c.env, {
      commandId,
      errorMessage: body.errorMessage.trim(),
      payload: body.payload,
    });
    return c.json({ ok: true, commandId: command.id });
  });

  app.get('/api/internal/whatsapp/outbound/:id', async (c) => {
    verifyInternalToken(c.req.raw, c.env);
    const command = await getOutboundCommandDetail(c.env, c.req.param('id'));
    if (!command) {
      throw new HttpError(404, 'Comando nao encontrado.');
    }
    return c.json({ ok: true, command });
  });

  app.get('/api/admin/whatsapp/overview', async (c) => {
    requireAuthenticatedUser(c);

    const openConversations = await first<{ total: number }>(
      c.env.DB.prepare(`SELECT COUNT(*) AS total FROM whatsapp_conversations WHERE status IN ('active', 'human_handoff')`),
    );
    const handoffs = await first<{ total: number }>(
      c.env.DB.prepare(`SELECT COUNT(*) AS total FROM whatsapp_handoffs WHERE status IN ('open', 'claimed')`),
    );
    const reservations = await first<{ total: number }>(
      c.env.DB.prepare(`SELECT COUNT(*) AS total FROM whatsapp_reservation_flows WHERE status IN ('collecting', 'ready', 'submitted')`),
    );
    const pendingCommands = await first<{ total: number }>(
      c.env.DB.prepare(`SELECT COUNT(*) AS total FROM whatsapp_outbound_commands WHERE status IN ('pending', 'processing')`),
    );

    return c.json({
      ok: true,
      metrics: {
        activeConversations: openConversations?.total ?? 0,
        openHandoffs: handoffs?.total ?? 0,
        activeReservationFlows: reservations?.total ?? 0,
        pendingOutboundCommands: pendingCommands?.total ?? 0,
      },
    });
  });

  app.get('/api/admin/whatsapp/control-center', async (c) => {
    requireAuthenticatedUser(c);

    const [automation, bridge, bridgeControl, testMode, conversations, openConversations, handoffs, reservations, pendingCommands] = await Promise.all([
      getWhatsAppAutomationSettings(c.env),
      getBridgeRuntimeStatus(c.env),
      getBridgeControlRequest(c.env),
      getWhatsAppTestModeSettings(c.env),
      listConversationRows(c.env, {}),
      first<{ total: number }>(c.env.DB.prepare(`SELECT COUNT(*) AS total FROM whatsapp_conversations WHERE status IN ('active', 'human_handoff')`)),
      first<{ total: number }>(c.env.DB.prepare(`SELECT COUNT(*) AS total FROM whatsapp_handoffs WHERE status IN ('open', 'claimed')`)),
      first<{ total: number }>(c.env.DB.prepare(`SELECT COUNT(*) AS total FROM whatsapp_reservation_flows WHERE status IN ('collecting', 'ready', 'submitted')`)),
      first<{ total: number }>(c.env.DB.prepare(`SELECT COUNT(*) AS total FROM whatsapp_outbound_commands WHERE status IN ('pending', 'processing')`)),
    ]);

    const houseCustomers = conversations.filter((row) => resolveCustomerCategory(row.metadata_json, row.crm_contact_id) === 'house').length;
    const newCustomers = conversations.length - houseCustomers;
    const respondedRows = conversations.filter((row) => row.outbound_count > 0 || Boolean(row.last_outbound_at));
    const respondedNumbers = respondedRows.slice(0, 40).map((row) => ({
      conversationId: row.conversation_id,
      customerProfileId: row.customer_profile_id,
      phoneE164: row.phone_e164,
      displayName: row.display_name,
      category: resolveCustomerCategory(row.metadata_json, row.crm_contact_id),
      outboundCount: row.outbound_count,
      inboundCount: row.inbound_count,
      lastOutboundAt: row.last_outbound_at,
      lastInboundAt: row.last_inbound_at,
      status: row.status,
    }));

    return c.json({
      ok: true,
      automation,
      bridge,
      bridgeControl,
      testMode,
      metrics: {
        activeConversations: openConversations?.total ?? 0,
        openHandoffs: handoffs?.total ?? 0,
        activeReservationFlows: reservations?.total ?? 0,
        pendingOutboundCommands: pendingCommands?.total ?? 0,
        respondedNumbers: respondedRows.length,
        houseCustomers,
        newCustomers,
      },
      respondedNumbers,
    });
  });

  app.get('/api/admin/whatsapp/conversations', async (c) => {
    requireAuthenticatedUser(c);
    const rows = await listConversationRows(c.env, {
      status: c.req.query('status'),
      query: c.req.query('q'),
    });

    return c.json({
      ok: true,
      conversations: rows.map((row) => ({
        id: row.conversation_id,
        phoneE164: row.phone_e164,
        status: row.status,
        stage: row.stage,
        currentIntent: row.current_intent,
        handoffRequested: row.handoff_requested === 1,
        lastMessageAt: row.last_message_at,
        summary: row.summary_text,
        tags: parseJsonText<string[]>(row.tags_json, []),
        customerProfileId: row.customer_profile_id,
        displayName: row.display_name,
        crmContactId: row.crm_contact_id,
        category: resolveCustomerCategory(row.metadata_json, row.crm_contact_id),
        lastInboundAt: row.last_inbound_at,
        lastOutboundAt: row.last_outbound_at,
        inboundCount: row.inbound_count,
        outboundCount: row.outbound_count,
      })),
    });
  });

  app.get('/api/admin/whatsapp/conversations/:id', async (c) => {
    requireAuthenticatedUser(c);
    const detail = await getConversationDetail(c.env, c.req.param('id'));
    if (!detail) {
      throw new HttpError(404, 'Conversa nao encontrada.');
    }

    return c.json({
      ok: true,
      conversation: {
        id: detail.conversation.id,
        phoneE164: detail.conversation.phone_e164,
        status: detail.conversation.status,
        stage: detail.conversation.stage,
        currentIntent: detail.conversation.current_intent,
        summary: detail.conversation.summary_text,
        tags: parseJsonText<string[]>(detail.conversation.tags_json, []),
        handoffRequested: detail.conversation.handoff_requested === 1,
        lastMessageAt: detail.conversation.last_message_at,
      },
      profile: {
        id: detail.profile.id,
        displayName: detail.profile.display_name,
        email: detail.profile.email,
        phoneE164: detail.profile.phone_e164,
        crmContactId: detail.profile.crm_contact_id,
        category: resolveCustomerCategory(detail.profile.metadata_json, detail.profile.crm_contact_id),
        tags: parseJsonText<string[]>(detail.profile.tags_json, []),
        summary: detail.profile.summary_text,
      },
      messages: detail.messages.map((message) => ({
        id: message.id,
        direction: message.direction,
        providerMessageId: message.provider_message_id,
        providerStatus: message.provider_status,
        messageType: message.message_type,
        text: message.message_text,
        intent: message.intent,
        intentConfidence: message.intent_confidence,
        ruleName: message.rule_name,
        templateKey: message.template_key,
        aiModel: message.ai_model,
        createdAt: message.created_at,
        processedAt: message.processed_at,
      })),
      handoffs: detail.handoffs,
      reservationFlow: detail.reservationFlow,
    });
  });

  app.post('/api/admin/whatsapp/conversations/:id/handoff', async (c) => {
    const user = requireManager(c);
    const conversationId = c.req.param('id');
    const detail = await getConversationDetail(c.env, conversationId);
    if (!detail) {
      throw new HttpError(404, 'Conversa nao encontrada.');
    }

    const body = await requireJsonBody<{ reason?: string; priority?: 'normal' | 'high' | 'urgent'; notes?: string }>(c.req.raw);
    const handoff = await openHandoff(c.env, {
      conversationId,
      customerProfileId: detail.profile.id,
      reason: body.reason?.trim() || 'Handoff manual pelo painel CRM.',
      priority: body.priority ?? 'normal',
      requestedBy: user.email,
      notes: body.notes?.trim() || null,
    });

    await updateConversation(c.env, conversationId, {
      status: 'human_handoff',
      stage: 'human_handoff',
      handoffRequested: true,
      tags: ['handoff_open', 'manual_handoff'],
    });
    await insertAuditLog(c.env, {
      conversationId,
      customerProfileId: detail.profile.id,
      eventType: 'manual_handoff_opened',
      actor: user.email,
      details: {
        handoffId: handoff.id,
      },
    });

    return c.json({ ok: true, handoff });
  });

  app.post('/api/admin/whatsapp/conversations/:id/reply', async (c) => {
    const user = requireManager(c);
    const conversationId = c.req.param('id');
    const detail = await getConversationDetail(c.env, conversationId);
    if (!detail) {
      throw new HttpError(404, 'Conversa nao encontrada.');
    }

    const body = await requireJsonBody<{ text?: string }>(c.req.raw);
    const replyText = body.text?.trim();
    if (!replyText) {
      throw new HttpError(400, 'Informe o texto da resposta manual.');
    }

    const command = await createManualOutboundCommand(c.env, {
      conversationId,
      customerProfileId: detail.profile.id,
      phoneE164: detail.conversation.phone_e164,
      text: replyText,
      actor: user.email,
    });

    return c.json({ ok: true, commandId: command.id });
  });

  app.post('/api/admin/whatsapp/automation', async (c) => {
    const user = requireManager(c);
    const body = await requireJsonBody<{ enabled?: boolean; note?: string | null }>(c.req.raw);
    if (typeof body.enabled !== 'boolean') {
      throw new HttpError(400, 'Informe enabled como true ou false.');
    }

    const settings = await setWhatsAppAutomationSettings(c.env, {
      enabled: body.enabled,
      updatedBy: user.email,
      note: body.note ?? null,
    });
    const cancelledCount = body.enabled
      ? 0
      : await cancelAutomaticOutboundForSafety(c.env, {
          reason: 'Automacao desligada manualmente no painel do CRM.',
        });

    await insertAuditLog(c.env, {
      eventType: 'automation_toggled',
      actor: user.email,
      details: {
        enabled: settings.enabled,
        note: settings.note,
        cancelledCount,
      },
    });

    return c.json({ ok: true, automation: settings, cancelledCount });
  });

  app.post('/api/admin/whatsapp/test-mode', async (c) => {
    const user = requireManager(c);
    const body = await requireJsonBody<{ enabled?: boolean; phoneE164?: string | null }>(c.req.raw);
    if (typeof body.enabled !== 'boolean') {
      throw new HttpError(400, 'Informe enabled como true ou false.');
    }
    if (body.enabled && !body.phoneE164?.trim()) {
      throw new HttpError(400, 'Informe o numero de teste para ativar o modo seguro.');
    }

    const settings = await setWhatsAppTestModeSettings(c.env, {
      enabled: body.enabled,
      allowedPhoneE164: body.phoneE164 ?? null,
      updatedBy: user.email,
    });
    const cancelledCount = settings.enabled
      ? await cancelAutomaticOutboundForSafety(c.env, {
          reason: settings.allowedPhoneE164
            ? `Modo teste ativo. Somente ${settings.allowedPhoneE164} pode receber respostas automaticas.`
            : 'Modo teste ativo sem numero liberado.',
          excludedPhoneE164: settings.allowedPhoneE164,
        })
      : 0;

    await insertAuditLog(c.env, {
      eventType: 'test_mode_updated',
      actor: user.email,
      details: {
        enabled: settings.enabled,
        allowedPhoneE164: settings.allowedPhoneE164,
        cancelledCount,
      },
    });

    return c.json({ ok: true, testMode: settings, cancelledCount });
  });

  app.post('/api/admin/whatsapp/bridge/reset-session', async (c) => {
    const user = requireManager(c);
    const body = await requireJsonBody<{ note?: string | null }>(c.req.raw);
    const request = await requestBridgeControl(c.env, {
      action: 'reset_session',
      requestedBy: user.email,
      note: body.note ?? 'Troca manual do numero conectado via portal CRM.',
    });

    await insertAuditLog(c.env, {
      eventType: 'bridge_reset_requested',
      actor: user.email,
      details: {
        requestId: request.id,
        note: request.note,
      },
    });

    return c.json({ ok: true, request });
  });

  app.post('/api/admin/whatsapp/profiles/:id/classification', async (c) => {
    const user = requireAuthenticatedUser(c);
    const body = await requireJsonBody<{ category?: CustomerCategory }>(c.req.raw);
    if (body.category !== 'house' && body.category !== 'new') {
      throw new HttpError(400, 'Categoria invalida. Use house ou new.');
    }

    const category = await updateCustomerCategory(c.env, {
      profileId: c.req.param('id'),
      category: body.category,
    });

    if (!category) {
      throw new HttpError(404, 'Perfil nao encontrado.');
    }

    await insertAuditLog(c.env, {
      customerProfileId: c.req.param('id'),
      eventType: 'customer_category_updated',
      actor: user.email,
      details: {
        category,
      },
    });

    return c.json({ ok: true, category });
  });
};
