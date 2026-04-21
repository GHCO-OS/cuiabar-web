import type { CustomerContext, LlamaAction } from './types';

type SaveConversationInput = {
  phone: string;
  messageId: string;
  messageIn: string;
  messageOut: string;
  actions: LlamaAction[];
  modelRaw: string | null;
};

const getChanges = (result: D1Result<unknown> | null | undefined) => Number(result?.meta?.changes ?? 0);

export const claimInboundEvent = async (
  db: D1Database,
  externalMessageId: string,
  phone: string,
  sourceTimestamp: string | null,
) => {
  const insertResult = await db
    .prepare(
      `INSERT OR IGNORE INTO wa_inbound_events (
        id,
        external_message_id,
        phone,
        source_timestamp,
        processing_status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 'processing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    )
    .bind(crypto.randomUUID(), externalMessageId, phone, sourceTimestamp)
    .run();

  if (getChanges(insertResult) > 0) {
    return true;
  }

  const existing = await db
    .prepare(
      `SELECT
        external_message_id,
        processing_status
       FROM wa_inbound_events
       WHERE external_message_id = ?`,
    )
    .bind(externalMessageId)
    .first<{
      external_message_id: string;
      processing_status: string | null;
    }>();

  if (existing?.processing_status === 'failed') {
    const retryResult = await db
      .prepare(
        `UPDATE wa_inbound_events
         SET phone = ?,
             source_timestamp = ?,
             processing_status = 'processing',
             error_message = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE external_message_id = ? AND processing_status = 'failed'`,
      )
      .bind(phone, sourceTimestamp, externalMessageId)
      .run();

    if (getChanges(retryResult) > 0) {
      return true;
    }
  }

  return false;
};

export const markInboundEventFailed = async (db: D1Database, externalMessageId: string, errorMessage: string) => {
  await db
    .prepare(
      `UPDATE wa_inbound_events
       SET processing_status = 'failed',
           error_message = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE external_message_id = ?`,
    )
    .bind(errorMessage, externalMessageId)
    .run();
};

export const markInboundEventDelivered = async (
  db: D1Database,
  externalMessageId: string,
  errorMessage: string | null = null,
) => {
  await db
    .prepare(
      `UPDATE wa_inbound_events
       SET processing_status = 'delivered',
           error_message = ?,
           delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE external_message_id = ?`,
    )
    .bind(errorMessage, externalMessageId)
    .run();
};

export const markInboundEventCompleted = async (db: D1Database, externalMessageId: string) => {
  await db
    .prepare(
      `UPDATE wa_inbound_events
       SET processing_status = 'completed',
           error_message = NULL,
           delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE external_message_id = ?`,
    )
    .bind(externalMessageId)
    .run();
};

export const ensureInboundEvent = async (
  db: D1Database,
  externalMessageId: string,
  phone: string,
  sourceTimestamp: string | null,
) => {
  const claimed = await claimInboundEvent(db, externalMessageId, phone, sourceTimestamp);
  if (claimed) {
    return true;
  }

  return false;
};

export const saveConversation = async (db: D1Database, input: SaveConversationInput) => {
  await db
    .prepare(
      `INSERT INTO wa_conversations (
        id,
        phone,
        external_message_id,
        message_in,
        message_out,
        llama_actions,
        llama_raw_response,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(
      crypto.randomUUID(),
      input.phone,
      input.messageId,
      input.messageIn,
      input.messageOut,
      JSON.stringify(input.actions),
      input.modelRaw,
    )
    .run();
};

export async function getCustomerContext(db: D1Database, phone: string, pushName?: string): Promise<CustomerContext> {
  const found = await db
    .prepare(
      `SELECT
        phone,
        name,
        email,
        loyalty_points,
        preferences,
        last_visit,
        tags
       FROM customers WHERE phone = ?`,
    )
    .bind(phone)
    .first<{
      phone: string;
      name: string | null;
      email: string | null;
      loyalty_points: number | null;
      preferences: string | null;
      last_visit: string | null;
      tags: string | null;
    }>();

  if (found) {
    return {
      phone: found.phone,
      name: found.name,
      email: found.email,
      loyaltyPoints: Number(found.loyalty_points || 0),
      preferences: found.preferences,
      lastVisit: found.last_visit,
      tags: found.tags,
    };
  }

  const fallbackName = (pushName || '').trim() || 'Cliente';

  await db
    .prepare(
      `INSERT INTO customers (
        phone,
        name,
        loyalty_points,
        preferences,
        tags,
        created_at,
        updated_at
      ) VALUES (?, ?, 0, '{}', '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    )
    .bind(phone, fallbackName)
    .run();

  return {
    phone,
    name: fallbackName,
    email: null,
    loyaltyPoints: 0,
    preferences: '{}',
    lastVisit: null,
    tags: '[]',
  };
}
