import { all, asJson, first, nowIso, parseJsonText, run } from '../lib/db';
import { generateId } from '../lib/security';
import type { Env } from '../types';
import type {
  ConversationDetail,
  ConversationRecord,
  ConversationStage,
  ConversationStatus,
  CustomerProfileRecord,
  HandoffPriority,
  HandoffRecord,
  MessageDirection,
  MessageRecord,
  OutboundCommandRecord,
  OutboundCommandSource,
  ReservationFlowRecord,
  ReservationFlowStatus,
  ReservationFlowStep,
  WhatsAppIntent,
} from './types';
import { appendUniqueTags, isFullName, safeFirstName, sanitizeMessageText } from './utils';

const splitFullName = (value: string | null | undefined) => {
  const sanitized = sanitizeMessageText(value, 160);
  if (!sanitized) {
    return { firstName: null, lastName: null };
  }

  const parts = sanitized.split(' ').filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

const mapConversation = (row: ConversationRecord) => row;
const mapProfile = (row: CustomerProfileRecord) => row;
const mapMessage = (row: MessageRecord) => row;
const mapHandoff = (row: HandoffRecord) => row;
const mapReservationFlow = (row: ReservationFlowRecord) => row;
const mapOutboundCommand = (row: OutboundCommandRecord) => row;
const OUTBOUND_COMMAND_LOCK_TIMEOUT_MS = 1000 * 60 * 3;

export const insertWebhookEvent = async (env: Env, eventType: string, payload: unknown, signature: string | null, providerEventId: string | null) => {
  const id = generateId('waevt');
  const timestamp = nowIso();

  await run(
    env.DB.prepare(
      `INSERT INTO whatsapp_webhook_events (id, provider_event_id, event_type, signature, payload_json, processing_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'queued', ?, ?)`,
    ).bind(id, providerEventId, eventType, signature, asJson(payload), timestamp, timestamp),
  );

  return id;
};

export const updateWebhookEventStatus = async (env: Env, webhookEventId: string, status: 'processed' | 'ignored' | 'failed', errorMessage?: string | null) => {
  await run(
    env.DB.prepare(
      'UPDATE whatsapp_webhook_events SET processing_status = ?, error_message = ?, updated_at = ? WHERE id = ?',
    ).bind(status, errorMessage ?? null, nowIso(), webhookEventId),
  );
};

export const findMessageByProviderId = async (env: Env, providerMessageId: string) =>
  first<MessageRecord>(env.DB.prepare('SELECT * FROM whatsapp_messages WHERE provider_message_id = ?').bind(providerMessageId));

export const upsertCustomerProfile = async (
  env: Env,
  params: {
    phoneE164: string;
    whatsappWaId: string | null;
    displayName: string | null;
    source?: string;
  },
) => {
  const existing = await first<CustomerProfileRecord>(
    env.DB.prepare(
      `SELECT *
       FROM customer_profiles
       WHERE phone_e164 = ?
          OR (? IS NOT NULL AND whatsapp_wa_id = ?)
       LIMIT 1`,
    ).bind(params.phoneE164, params.whatsappWaId, params.whatsappWaId),
  );

  const displayName = sanitizeMessageText(params.displayName, 160) || existing?.display_name || null;
  const names = splitFullName(displayName);
  const timestamp = nowIso();

  if (existing) {
    await run(
      env.DB.prepare(
        `UPDATE customer_profiles
         SET display_name = COALESCE(?, display_name),
             first_name = COALESCE(?, first_name),
             last_name = COALESCE(?, last_name),
             phone_e164 = COALESCE(?, phone_e164),
             whatsapp_wa_id = COALESCE(?, whatsapp_wa_id),
             source = COALESCE(?, source),
             last_interaction_at = ?,
             updated_at = ?
         WHERE id = ?`,
      ).bind(
        displayName,
        names.firstName,
        names.lastName,
        params.phoneE164,
        params.whatsappWaId,
        params.source ?? null,
        timestamp,
        timestamp,
        existing.id,
      ),
    );

    return (
      await first<CustomerProfileRecord>(env.DB.prepare('SELECT * FROM customer_profiles WHERE id = ?').bind(existing.id))
    )!;
  }

  const id = generateId('cprof');
  await run(
    env.DB.prepare(
      `INSERT INTO customer_profiles (
        id, display_name, first_name, last_name, phone_e164, whatsapp_wa_id, preferred_channel, source,
        tags_json, summary_text, metadata_json, last_interaction_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'whatsapp', ?, '[]', NULL, '{}', ?, ?, ?)`,
    ).bind(id, displayName, names.firstName, names.lastName, params.phoneE164, params.whatsappWaId, params.source ?? 'whatsapp_assistant', timestamp, timestamp, timestamp),
  );

  return (await first<CustomerProfileRecord>(env.DB.prepare('SELECT * FROM customer_profiles WHERE id = ?').bind(id)))!;
};

export const updateCustomerProfileSummary = async (env: Env, profileId: string, summary: string, tags: string[]) => {
  const existing = await first<Pick<CustomerProfileRecord, 'tags_json'>>(env.DB.prepare('SELECT tags_json FROM customer_profiles WHERE id = ?').bind(profileId));
  const mergedTags = appendUniqueTags(parseJsonText<string[]>(existing?.tags_json, []), tags);

  await run(
    env.DB.prepare(
      `UPDATE customer_profiles
       SET summary_text = ?, tags_json = ?, last_interaction_at = ?, updated_at = ?
       WHERE id = ?`,
    ).bind(summary, asJson(mergedTags), nowIso(), nowIso(), profileId),
  );
};

export const getOrCreateConversation = async (
  env: Env,
  params: {
    customerProfileId: string;
    phoneE164: string;
    whatsappWaId: string | null;
    whatsappProfileName: string | null;
  },
) => {
  const existing = await first<ConversationRecord>(env.DB.prepare('SELECT * FROM whatsapp_conversations WHERE phone_e164 = ? LIMIT 1').bind(params.phoneE164));
  const timestamp = nowIso();

  if (existing) {
    await run(
      env.DB.prepare(
        `UPDATE whatsapp_conversations
         SET customer_profile_id = ?,
             whatsapp_wa_id = COALESCE(?, whatsapp_wa_id),
             whatsapp_profile_name = COALESCE(?, whatsapp_profile_name),
             updated_at = ?
         WHERE id = ?`,
      ).bind(params.customerProfileId, params.whatsappWaId, params.whatsappProfileName, timestamp, existing.id),
    );
    return (await first<ConversationRecord>(env.DB.prepare('SELECT * FROM whatsapp_conversations WHERE id = ?').bind(existing.id)))!;
  }

  const id = generateId('waconv');
  await run(
    env.DB.prepare(
      `INSERT INTO whatsapp_conversations (
        id, customer_profile_id, phone_e164, whatsapp_wa_id, whatsapp_profile_name,
        status, stage, current_intent, handoff_requested, tags_json, metadata_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', 'assistant', 'unknown', 0, '[]', '{}', ?, ?)`,
    ).bind(id, params.customerProfileId, params.phoneE164, params.whatsappWaId, params.whatsappProfileName, timestamp, timestamp),
  );
  return (await first<ConversationRecord>(env.DB.prepare('SELECT * FROM whatsapp_conversations WHERE id = ?').bind(id)))!;
};

export const updateConversation = async (
  env: Env,
  conversationId: string,
  changes: {
    status?: ConversationStatus;
    stage?: ConversationStage;
    currentIntent?: WhatsAppIntent;
    currentFlow?: string | null;
    handoffRequested?: boolean;
    tags?: string[];
    summary?: string | null;
    lastInboundAt?: string | null;
    lastOutboundAt?: string | null;
  },
) => {
  const current = await first<Pick<ConversationRecord, 'tags_json'>>(env.DB.prepare('SELECT tags_json FROM whatsapp_conversations WHERE id = ?').bind(conversationId));
  const tags = changes.tags ? appendUniqueTags(parseJsonText<string[]>(current?.tags_json, []), changes.tags) : null;
  const lastMessageAt = changes.lastInboundAt ?? changes.lastOutboundAt ?? nowIso();

  await run(
    env.DB.prepare(
      `UPDATE whatsapp_conversations
       SET status = COALESCE(?, status),
           stage = COALESCE(?, stage),
           current_intent = COALESCE(?, current_intent),
           current_flow = COALESCE(?, current_flow),
           handoff_requested = COALESCE(?, handoff_requested),
           tags_json = COALESCE(?, tags_json),
           summary_text = COALESCE(?, summary_text),
           last_message_at = ?,
           last_inbound_at = COALESCE(?, last_inbound_at),
           last_outbound_at = COALESCE(?, last_outbound_at),
           updated_at = ?
       WHERE id = ?`,
    ).bind(
      changes.status ?? null,
      changes.stage ?? null,
      changes.currentIntent ?? null,
      changes.currentFlow === undefined ? null : changes.currentFlow,
      changes.handoffRequested === undefined ? null : changes.handoffRequested ? 1 : 0,
      tags ? asJson(tags) : null,
      changes.summary ?? null,
      lastMessageAt,
      changes.lastInboundAt ?? null,
      changes.lastOutboundAt ?? null,
      nowIso(),
      conversationId,
    ),
  );
};

export const insertConversationMessage = async (
  env: Env,
  params: {
    conversationId: string;
    direction: MessageDirection;
    messageType: string;
    providerMessageId?: string | null;
    providerStatus?: string | null;
    messageText?: string | null;
    normalizedText?: string | null;
    intent?: string | null;
    intentConfidence?: number | null;
    ruleName?: string | null;
    templateKey?: string | null;
    aiModel?: string | null;
    payload: unknown;
    processedAt?: string | null;
  },
) => {
  const id = generateId('wamsg');
  await run(
    env.DB.prepare(
      `INSERT INTO whatsapp_messages (
        id, conversation_id, direction, provider_message_id, provider_status, message_type, message_text,
        normalized_text, intent, intent_confidence, rule_name, template_key, ai_model, payload_json, processed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      params.conversationId,
      params.direction,
      params.providerMessageId ?? null,
      params.providerStatus ?? null,
      params.messageType,
      params.messageText ?? null,
      params.normalizedText ?? null,
      params.intent ?? null,
      params.intentConfidence ?? null,
      params.ruleName ?? null,
      params.templateKey ?? null,
      params.aiModel ?? null,
      asJson(params.payload),
      params.processedAt ?? null,
      nowIso(),
    ),
  );
  return id;
};

export const updateMessageStatus = async (env: Env, providerMessageId: string, status: string, payload: unknown) => {
  await run(
    env.DB.prepare(
      `UPDATE whatsapp_messages
       SET provider_status = ?, payload_json = ?, processed_at = ?
       WHERE provider_message_id = ?`,
    ).bind(status, asJson(payload), nowIso(), providerMessageId),
  );
};

export const markMessageProcessed = async (
  env: Env,
  providerMessageId: string,
  params: {
    intent?: string | null;
    intentConfidence?: number | null;
    ruleName?: string | null;
    templateKey?: string | null;
    aiModel?: string | null;
  },
) => {
  await run(
    env.DB.prepare(
      `UPDATE whatsapp_messages
       SET intent = COALESCE(?, intent),
           intent_confidence = COALESCE(?, intent_confidence),
           rule_name = COALESCE(?, rule_name),
           template_key = COALESCE(?, template_key),
           ai_model = COALESCE(?, ai_model),
           processed_at = ?
       WHERE provider_message_id = ?`,
    ).bind(
      params.intent ?? null,
      params.intentConfidence ?? null,
      params.ruleName ?? null,
      params.templateKey ?? null,
      params.aiModel ?? null,
      nowIso(),
      providerMessageId,
    ),
  );
};

export const getOpenReservationFlow = async (env: Env, conversationId: string) =>
  first<ReservationFlowRecord>(
    env.DB.prepare(
      `SELECT *
       FROM whatsapp_reservation_flows
       WHERE conversation_id = ?
         AND status IN ('collecting', 'ready', 'submitted')
       ORDER BY created_at DESC
       LIMIT 1`,
    ).bind(conversationId),
  );

export const upsertReservationFlow = async (
  env: Env,
  params: {
    flowId?: string | null;
    conversationId: string;
    customerProfileId: string;
    status?: ReservationFlowStatus;
    currentStep?: ReservationFlowStep;
    customerName?: string | null;
    reservationDate?: string | null;
    reservationTime?: string | null;
    guestCount?: number | null;
    notes?: string | null;
    reservationId?: string | null;
    reservationCode?: string | null;
    metadata?: Record<string, unknown>;
    completedAt?: string | null;
  },
) => {
  const timestamp = nowIso();
  const existing =
    (params.flowId
      ? await first<ReservationFlowRecord>(env.DB.prepare('SELECT * FROM whatsapp_reservation_flows WHERE id = ?').bind(params.flowId))
      : await getOpenReservationFlow(env, params.conversationId)) ?? null;

  if (existing) {
    await run(
      env.DB.prepare(
        `UPDATE whatsapp_reservation_flows
         SET status = COALESCE(?, status),
             current_step = COALESCE(?, current_step),
             customer_name = COALESCE(?, customer_name),
             reservation_date = COALESCE(?, reservation_date),
             reservation_time = COALESCE(?, reservation_time),
             guest_count = COALESCE(?, guest_count),
             notes = COALESCE(?, notes),
             reservation_id = COALESCE(?, reservation_id),
             reservation_code = COALESCE(?, reservation_code),
             metadata_json = COALESCE(?, metadata_json),
             completed_at = COALESCE(?, completed_at),
             updated_at = ?
         WHERE id = ?`,
      ).bind(
        params.status ?? null,
        params.currentStep ?? null,
        params.customerName ?? null,
        params.reservationDate ?? null,
        params.reservationTime ?? null,
        params.guestCount ?? null,
        params.notes ?? null,
        params.reservationId ?? null,
        params.reservationCode ?? null,
        params.metadata ? asJson(params.metadata) : null,
        params.completedAt ?? null,
        timestamp,
        existing.id,
      ),
    );
    return (await first<ReservationFlowRecord>(env.DB.prepare('SELECT * FROM whatsapp_reservation_flows WHERE id = ?').bind(existing.id)))!;
  }

  const id = generateId('warflow');
  await run(
    env.DB.prepare(
      `INSERT INTO whatsapp_reservation_flows (
        id, conversation_id, customer_profile_id, status, current_step, customer_name, reservation_date,
        reservation_time, guest_count, notes, reservation_id, reservation_code, metadata_json, completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      params.conversationId,
      params.customerProfileId,
      params.status ?? 'collecting',
      params.currentStep ?? 'date',
      params.customerName ?? null,
      params.reservationDate ?? null,
      params.reservationTime ?? null,
      params.guestCount ?? null,
      params.notes ?? null,
      params.reservationId ?? null,
      params.reservationCode ?? null,
      params.metadata ? asJson(params.metadata) : '{}',
      params.completedAt ?? null,
      timestamp,
      timestamp,
    ),
  );
  return (await first<ReservationFlowRecord>(env.DB.prepare('SELECT * FROM whatsapp_reservation_flows WHERE id = ?').bind(id)))!;
};

export const openHandoff = async (
  env: Env,
  params: {
    conversationId: string;
    customerProfileId: string;
    reason: string;
    priority: HandoffPriority;
    requestedBy?: string;
    notes?: string | null;
    metadata?: Record<string, unknown>;
  },
) => {
  const existing = await first<HandoffRecord>(
    env.DB.prepare(
      `SELECT *
       FROM whatsapp_handoffs
       WHERE conversation_id = ?
         AND status IN ('open', 'claimed')
       ORDER BY created_at DESC
       LIMIT 1`,
    ).bind(params.conversationId),
  );

  const timestamp = nowIso();
  if (existing) {
    await run(
      env.DB.prepare(
        `UPDATE whatsapp_handoffs
         SET reason = ?,
             priority = ?,
             notes = COALESCE(?, notes),
             metadata_json = COALESCE(?, metadata_json),
             updated_at = ?
         WHERE id = ?`,
      ).bind(params.reason, params.priority, params.notes ?? null, params.metadata ? asJson(params.metadata) : null, timestamp, existing.id),
    );
    return (await first<HandoffRecord>(env.DB.prepare('SELECT * FROM whatsapp_handoffs WHERE id = ?').bind(existing.id)))!;
  }

  const id = generateId('wahnd');
  await run(
    env.DB.prepare(
      `INSERT INTO whatsapp_handoffs (
        id, conversation_id, customer_profile_id, reason, priority, status,
        requested_by, notes, metadata_json, opened_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      params.conversationId,
      params.customerProfileId,
      params.reason,
      params.priority,
      params.requestedBy ?? 'assistant',
      params.notes ?? null,
      params.metadata ? asJson(params.metadata) : '{}',
      timestamp,
      timestamp,
      timestamp,
    ),
  );
  return (await first<HandoffRecord>(env.DB.prepare('SELECT * FROM whatsapp_handoffs WHERE id = ?').bind(id)))!;
};

export const closeHandoff = async (env: Env, handoffId: string, actor: string) => {
  await run(
    env.DB.prepare(
      `UPDATE whatsapp_handoffs
       SET status = 'closed', assigned_to = COALESCE(assigned_to, ?), closed_at = ?, updated_at = ?
       WHERE id = ?`,
    ).bind(actor, nowIso(), nowIso(), handoffId),
  );
};

export const insertAuditLog = async (
  env: Env,
  params: {
    conversationId?: string | null;
    customerProfileId?: string | null;
    eventType: string;
    level?: 'info' | 'warning' | 'error';
    actor?: string;
    details?: Record<string, unknown>;
  },
) => {
  await run(
    env.DB.prepare(
      `INSERT INTO whatsapp_audit_logs (id, conversation_id, customer_profile_id, event_type, level, actor, details_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      generateId('waaudit'),
      params.conversationId ?? null,
      params.customerProfileId ?? null,
      params.eventType,
      params.level ?? 'info',
      params.actor ?? 'system',
      asJson(params.details ?? {}),
      nowIso(),
    ),
  );
};

export const createOutboundCommand = async (
  env: Env,
  params: {
    conversationId: string;
    customerProfileId: string;
    phoneE164: string;
    textBody: string;
    source: OutboundCommandSource;
    status?: 'pending' | 'processing';
    intent?: string | null;
    templateKey?: string | null;
    ruleName?: string | null;
    aiModel?: string | null;
    payload?: Record<string, unknown>;
  },
) => {
  const id = generateId('wacmd');
  const timestamp = nowIso();

  await run(
    env.DB.prepare(
      `INSERT INTO whatsapp_outbound_commands (
        id, conversation_id, customer_profile_id, phone_e164, provider, source, status,
        text_body, intent, template_key, rule_name, ai_model, payload_json, locked_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'baileys', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      params.conversationId,
      params.customerProfileId,
      params.phoneE164,
      params.source,
      params.status ?? 'pending',
      params.textBody,
      params.intent ?? null,
      params.templateKey ?? null,
      params.ruleName ?? null,
      params.aiModel ?? null,
      asJson(params.payload ?? {}),
      params.status === 'processing' ? timestamp : null,
      timestamp,
      timestamp,
    ),
  );

  return (await first<OutboundCommandRecord>(env.DB.prepare('SELECT * FROM whatsapp_outbound_commands WHERE id = ?').bind(id)))!;
};

export const claimPendingOutboundCommands = async (
  env: Env,
  limit = 10,
  options?: {
    allowedSources?: OutboundCommandSource[];
    assistantPhoneAllowlist?: string[];
  },
) => {
  const reclaimBefore = new Date(Date.now() - OUTBOUND_COMMAND_LOCK_TIMEOUT_MS).toISOString();
  const allowedSources = options?.allowedSources?.length ? options.allowedSources : null;
  const assistantPhoneAllowlist = options?.assistantPhoneAllowlist;
  const sourcePlaceholders = allowedSources ? allowedSources.map(() => '?').join(', ') : '';
  const assistantPhonePlaceholders = assistantPhoneAllowlist?.length ? assistantPhoneAllowlist.map(() => '?').join(', ') : '';
  const rows = await all<OutboundCommandRecord>(
    env.DB.prepare(
      `SELECT *
       FROM whatsapp_outbound_commands
       WHERE (
          status = 'pending'
          OR (status = 'processing' AND locked_at IS NOT NULL AND locked_at < ?)
        )
        ${allowedSources ? `AND source IN (${sourcePlaceholders})` : ''}
        ${
          assistantPhoneAllowlist
            ? assistantPhoneAllowlist.length
              ? `AND (source <> 'assistant' OR phone_e164 IN (${assistantPhonePlaceholders}))`
              : `AND source <> 'assistant'`
            : ''
        }
        ORDER BY created_at ASC
        LIMIT ?`,
    ).bind(reclaimBefore, ...(allowedSources ?? []), ...(assistantPhoneAllowlist?.length ? assistantPhoneAllowlist : []), limit),
  );

  const claimed: OutboundCommandRecord[] = [];
  for (const row of rows) {
    const updatedAt = nowIso();
    const result = await run(
      env.DB.prepare(
        `UPDATE whatsapp_outbound_commands
         SET status = 'processing', locked_at = ?, updated_at = ?
         WHERE id = ?
           AND (
             status = 'pending'
             OR (status = 'processing' AND locked_at = ?)
           )`,
      ).bind(updatedAt, updatedAt, row.id, row.locked_at),
    );

    if ((result.meta?.changes ?? 0) > 0) {
      claimed.push({
        ...row,
        status: 'processing',
        locked_at: updatedAt,
        updated_at: updatedAt,
      });
    }
  }

  return claimed.map(mapOutboundCommand);
};

export const cancelPendingOutboundCommands = async (
  env: Env,
  params: {
    reason: string;
    sources?: OutboundCommandSource[];
    excludedPhoneE164?: string | null;
  },
) => {
  const clauses = [
    `(status = 'pending' OR status = 'processing')`,
  ];
  const bindings: Array<string | number | null> = [];

  if (params.sources?.length) {
    clauses.push(`source IN (${params.sources.map(() => '?').join(', ')})`);
    bindings.push(...params.sources);
  }

  if (params.excludedPhoneE164) {
    clauses.push('phone_e164 <> ?');
    bindings.push(params.excludedPhoneE164);
  }

  const updatedAt = nowIso();
  const result = await run(
    env.DB.prepare(
      `UPDATE whatsapp_outbound_commands
       SET status = 'cancelled',
           error_message = ?,
           locked_at = NULL,
           updated_at = ?
       WHERE ${clauses.join(' AND ')}`,
    ).bind(params.reason, updatedAt, ...bindings),
  );

  return result.meta?.changes ?? 0;
};

export const acknowledgeOutboundCommand = async (
  env: Env,
  params: {
    commandId: string;
    providerMessageId: string | null;
    payload?: Record<string, unknown>;
  },
) => {
  const updatedAt = nowIso();
  await run(
    env.DB.prepare(
      `UPDATE whatsapp_outbound_commands
       SET status = 'sent',
           provider_message_id = ?,
           payload_json = COALESCE(?, payload_json),
           error_message = NULL,
           locked_at = NULL,
           sent_at = ?,
           updated_at = ?
       WHERE id = ?`,
    ).bind(params.providerMessageId, params.payload ? asJson(params.payload) : null, updatedAt, updatedAt, params.commandId),
  );

  return first<OutboundCommandRecord>(env.DB.prepare('SELECT * FROM whatsapp_outbound_commands WHERE id = ?').bind(params.commandId));
};

export const failOutboundCommand = async (
  env: Env,
  params: {
    commandId: string;
    errorMessage: string;
    payload?: Record<string, unknown>;
  },
) => {
  const updatedAt = nowIso();
  await run(
    env.DB.prepare(
      `UPDATE whatsapp_outbound_commands
       SET status = 'failed',
           error_message = ?,
           payload_json = COALESCE(?, payload_json),
           locked_at = NULL,
           updated_at = ?
       WHERE id = ?`,
    ).bind(params.errorMessage, params.payload ? asJson(params.payload) : null, updatedAt, params.commandId),
  );

  return first<OutboundCommandRecord>(env.DB.prepare('SELECT * FROM whatsapp_outbound_commands WHERE id = ?').bind(params.commandId));
};

export const getOutboundCommand = (env: Env, commandId: string) =>
  first<OutboundCommandRecord>(env.DB.prepare('SELECT * FROM whatsapp_outbound_commands WHERE id = ?').bind(commandId));

export const listConversationRows = async (env: Env, filters: { status?: string | null; query?: string | null }) => {
  const clauses: string[] = [];
  const bindings: Array<string | number> = [];

  if (filters.status) {
    clauses.push('c.status = ?');
    bindings.push(filters.status);
  }

  if (filters.query) {
    const query = `%${filters.query.trim().toLowerCase()}%`;
    clauses.push('(LOWER(c.phone_e164) LIKE ? OR LOWER(COALESCE(p.display_name, "")) LIKE ? OR LOWER(COALESCE(c.summary_text, "")) LIKE ?)');
    bindings.push(query, query, query);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return all<{
    conversation_id: string;
    phone_e164: string;
    status: string;
    stage: string;
    current_intent: string;
    handoff_requested: number;
    last_message_at: string | null;
    last_inbound_at: string | null;
    last_outbound_at: string | null;
    summary_text: string | null;
    tags_json: string;
    customer_profile_id: string;
    display_name: string | null;
    crm_contact_id: string | null;
    metadata_json: string;
    outbound_count: number;
    inbound_count: number;
  }>(
    env.DB.prepare(
      `SELECT
         c.id AS conversation_id,
         c.phone_e164,
         c.status,
         c.stage,
         c.current_intent,
         c.handoff_requested,
         c.last_message_at,
         c.last_inbound_at,
         c.last_outbound_at,
         c.summary_text,
         c.tags_json,
         p.id AS customer_profile_id,
         p.display_name,
         p.crm_contact_id,
         p.metadata_json,
         COALESCE(msg.outbound_count, 0) AS outbound_count,
         COALESCE(msg.inbound_count, 0) AS inbound_count
       FROM whatsapp_conversations c
       JOIN customer_profiles p ON p.id = c.customer_profile_id
       LEFT JOIN (
         SELECT
           conversation_id,
           SUM(CASE WHEN direction = 'outbound' THEN 1 ELSE 0 END) AS outbound_count,
           SUM(CASE WHEN direction = 'inbound' THEN 1 ELSE 0 END) AS inbound_count
         FROM whatsapp_messages
         GROUP BY conversation_id
       ) msg ON msg.conversation_id = c.id
       ${whereClause}
       ORDER BY COALESCE(c.last_message_at, c.updated_at) DESC
       LIMIT 150`,
    ).bind(...bindings),
  );
};

export const getConversationDetail = async (env: Env, conversationId: string): Promise<ConversationDetail | null> => {
  const joined = await first<
    ConversationRecord & {
      profile_id: string;
      profile_display_name: string | null;
      profile_first_name: string | null;
      profile_last_name: string | null;
      profile_email: string | null;
      profile_phone_e164: string | null;
      profile_whatsapp_wa_id: string | null;
      profile_preferred_channel: string;
      profile_crm_contact_id: string | null;
      profile_source: string;
      profile_tags_json: string;
      profile_summary_text: string | null;
      profile_metadata_json: string;
      profile_last_interaction_at: string | null;
      profile_created_at: string;
      profile_updated_at: string;
    }
  >(
    env.DB.prepare(
      `SELECT
         c.*,
         p.id AS profile_id,
         p.display_name AS profile_display_name,
         p.first_name AS profile_first_name,
         p.last_name AS profile_last_name,
         p.email AS profile_email,
         p.phone_e164 AS profile_phone_e164,
         p.whatsapp_wa_id AS profile_whatsapp_wa_id,
         p.preferred_channel AS profile_preferred_channel,
         p.crm_contact_id AS profile_crm_contact_id,
         p.source AS profile_source,
         p.tags_json AS profile_tags_json,
         p.summary_text AS profile_summary_text,
         p.metadata_json AS profile_metadata_json,
         p.last_interaction_at AS profile_last_interaction_at,
         p.created_at AS profile_created_at,
         p.updated_at AS profile_updated_at
       FROM whatsapp_conversations c
       JOIN customer_profiles p ON p.id = c.customer_profile_id
       WHERE c.id = ?`,
    ).bind(conversationId),
  );

  if (!joined) {
    return null;
  }

  const messages = (await all<MessageRecord>(
    env.DB.prepare('SELECT * FROM whatsapp_messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 80').bind(conversationId),
  )).map(mapMessage);

  const handoffs = (await all<HandoffRecord>(
    env.DB.prepare('SELECT * FROM whatsapp_handoffs WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 20').bind(conversationId),
  )).map(mapHandoff);

  const reservationFlow = await first<ReservationFlowRecord>(
    env.DB.prepare('SELECT * FROM whatsapp_reservation_flows WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1').bind(conversationId),
  );

  return {
    conversation: mapConversation(joined),
    profile: mapProfile({
      id: joined.profile_id,
      display_name: joined.profile_display_name,
      first_name: joined.profile_first_name,
      last_name: joined.profile_last_name,
      email: joined.profile_email,
      phone_e164: joined.profile_phone_e164,
      whatsapp_wa_id: joined.profile_whatsapp_wa_id,
      preferred_channel: joined.profile_preferred_channel,
      crm_contact_id: joined.profile_crm_contact_id,
      source: joined.profile_source,
      tags_json: joined.profile_tags_json,
      summary_text: joined.profile_summary_text,
      metadata_json: joined.profile_metadata_json,
      last_interaction_at: joined.profile_last_interaction_at,
      created_at: joined.profile_created_at,
      updated_at: joined.profile_updated_at,
    }),
    messages,
    handoffs,
    reservationFlow: reservationFlow ? mapReservationFlow(reservationFlow) : null,
  };
};

export const getRecentTranscript = async (env: Env, conversationId: string, limit = 12) => {
  const rows = await all<Pick<MessageRecord, 'direction' | 'message_text' | 'created_at'>>(
    env.DB.prepare(
      `SELECT direction, message_text, created_at
       FROM whatsapp_messages
       WHERE conversation_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
    ).bind(conversationId, limit),
  );

  return rows
    .reverse()
    .map((row) => `${row.direction === 'inbound' ? 'Cliente' : 'Atendimento'}: ${sanitizeMessageText(row.message_text, 500)}`)
    .join('\n');
};

export const attachCrmContactLink = async (env: Env, profileId: string, crmContactId: string | null) => {
  if (!crmContactId) {
    return;
  }
  await run(env.DB.prepare('UPDATE customer_profiles SET crm_contact_id = ?, updated_at = ? WHERE id = ?').bind(crmContactId, nowIso(), profileId));
};
