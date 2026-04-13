import type { Hono } from 'hono';
import { HttpError, requireJsonBody } from '../lib/http';
import { all, asJson, first, nowIso, parseJsonText, run } from '../lib/db';
import { generateId } from '../lib/security';
import type { AppVariables, AuthUser, Env } from '../types';
import { getWhatsAppAutomationSettings, getWhatsAppTestModeSettings, setWhatsAppAutomationSettings, setWhatsAppTestModeSettings } from './control';
import { registerWhatsAppOperationalRoutes } from './operationalRoutes';
import { insertAuditLog } from './repository';
import { cancelAutomaticOutboundForSafety } from './service';

type WaApp = Hono<{ Bindings: Env; Variables: AppVariables }>;

const requireAuth = (user: AuthUser | null) => {
  if (!user) throw new HttpError(401, 'Autenticacao necessaria.');
  return user;
};

const requireManager = (user: AuthUser | null) => {
  const authenticatedUser = requireAuth(user);
  if (!authenticatedUser.roles.includes('gerente')) {
    throw new HttpError(403, 'Apenas gerentes podem executar esta acao.');
  }
  return authenticatedUser;
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TIPOS INTERNOS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface WaContactRow {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  sector: string;
  status: string;
  source: string;
  tags_json: string;
  custom_fields_json: string;
  notes: string | null;
  birthday: string | null;
  address: string | null;
  opted_in: number;
  opted_in_at: string | null;
  opted_out_at: string | null;
  last_seen_at: string | null;
  total_messages_received: number;
  total_messages_sent: number;
  loyalty_points: number;
  lifetime_value: number;
  ai_profile_json: string;
  created_at: string;
  updated_at: string;
}

interface WaConversationRow {
  id: string;
  contact_id: string;
  status: string;
  assigned_to_user_id: string | null;
  channel: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  sentiment: string | null;
  tags_json: string;
  pipeline_stage: string;
  internal_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_avatar: string | null;
}

interface WaMessageRow {
  id: string;
  conversation_id: string;
  contact_id: string;
  direction: string;
  type: string;
  content: string | null;
  media_url: string | null;
  status: string;
  ai_suggested: number;
  ai_confidence: number | null;
  template_id: string | null;
  is_internal_note: number;
  created_by_user_id: string | null;
  created_by_name: string | null;
  error_message: string | null;
  metadata_json: string;
  created_at: string;
}

interface WaTemplateRow {
  id: string;
  name: string;
  category: string;
  content: string;
  variables_json: string;
  tags_json: string;
  language: string;
  status: string;
  usage_count: number;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface WaAiTrainingRow {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags_json: string;
  sector: string;
  active: number;
  confidence_score: number;
  usage_count: number;
  feedback_positive: number;
  feedback_negative: number;
  source: string;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface WaSubscriptionRow {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  sector: string;
  source: string;
  tags_json: string;
  custom_data_json: string;
  status: string;
  opted_in_at: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface WaSectorRow {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  active: number;
  created_at: string;
  updated_at: string;
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MAPPERS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const mapContact = (r: WaContactRow) => ({
  id: r.id,
  phone: r.phone,
  name: r.name ?? '',
  email: r.email ?? '',
  avatarUrl: r.avatar_url ?? null,
  sector: r.sector,
  status: r.status,
  source: r.source,
  tags: parseJsonText<string[]>(r.tags_json, []),
  customFields: parseJsonText<Record<string, string>>(r.custom_fields_json, {}),
  notes: r.notes ?? '',
  birthday: r.birthday ?? null,
  address: r.address ?? null,
  optedIn: r.opted_in === 1,
  optedInAt: r.opted_in_at,
  optedOutAt: r.opted_out_at,
  lastSeenAt: r.last_seen_at,
  totalMessagesReceived: r.total_messages_received,
  totalMessagesSent: r.total_messages_sent,
  loyaltyPoints: r.loyalty_points,
  lifetimeValue: r.lifetime_value,
  aiProfile: parseJsonText<Record<string, unknown>>(r.ai_profile_json, {}),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapConversation = (r: WaConversationRow) => ({
  id: r.id,
  contactId: r.contact_id,
  status: r.status,
  assignedToUserId: r.assigned_to_user_id,
  channel: r.channel,
  lastMessageAt: r.last_message_at,
  lastMessagePreview: r.last_message_preview,
  unreadCount: r.unread_count,
  sentiment: r.sentiment,
  tags: parseJsonText<string[]>(r.tags_json, []),
  pipelineStage: r.pipeline_stage,
  internalNotes: r.internal_notes,
  resolvedAt: r.resolved_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  contact: {
    name: r.contact_name ?? '',
    phone: r.contact_phone ?? '',
    avatarUrl: r.contact_avatar ?? null,
  },
});

const mapMessage = (r: WaMessageRow) => ({
  id: r.id,
  conversationId: r.conversation_id,
  contactId: r.contact_id,
  direction: r.direction,
  type: r.type,
  content: r.content ?? '',
  mediaUrl: r.media_url,
  status: r.status,
  aiSuggested: r.ai_suggested === 1,
  aiConfidence: r.ai_confidence,
  templateId: r.template_id,
  isInternalNote: r.is_internal_note === 1,
  createdByUserId: r.created_by_user_id,
  createdByName: r.created_by_name,
  errorMessage: r.error_message,
  metadata: parseJsonText<Record<string, unknown>>(r.metadata_json, {}),
  createdAt: r.created_at,
});

const mapTemplate = (r: WaTemplateRow) => ({
  id: r.id,
  name: r.name,
  category: r.category,
  content: r.content,
  variables: parseJsonText<string[]>(r.variables_json, []),
  tags: parseJsonText<string[]>(r.tags_json, []),
  language: r.language,
  status: r.status,
  usageCount: r.usage_count,
  createdByUserId: r.created_by_user_id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapAiTraining = (r: WaAiTrainingRow) => ({
  id: r.id,
  question: r.question,
  answer: r.answer,
  category: r.category,
  tags: parseJsonText<string[]>(r.tags_json, []),
  sector: r.sector,
  active: r.active === 1,
  confidenceScore: r.confidence_score,
  usageCount: r.usage_count,
  feedbackPositive: r.feedback_positive,
  feedbackNegative: r.feedback_negative,
  source: r.source,
  createdByUserId: r.created_by_user_id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapSubscription = (r: WaSubscriptionRow) => ({
  id: r.id,
  phone: r.phone,
  name: r.name ?? '',
  email: r.email ?? '',
  sector: r.sector,
  source: r.source,
  tags: parseJsonText<string[]>(r.tags_json, []),
  customData: parseJsonText<Record<string, string>>(r.custom_data_json, {}),
  status: r.status,
  optedInAt: r.opted_in_at,
  cancelledAt: r.cancelled_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// AI SUGGESTION ENGINE (regras locais)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const suggestAiResponse = async (db: D1Database, userMessage: string, sector: string): Promise<{ answer: string; confidence: number; trainingId: string } | null> => {
  const rows = await all<WaAiTrainingRow>(
    db.prepare('SELECT * FROM wa_ai_training WHERE active = 1 ORDER BY usage_count DESC LIMIT 200'),
  );

  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const msg = normalize(userMessage);

  let best: { answer: string; confidence: number; trainingId: string } | null = null;

  for (const row of rows) {
    const q = normalize(row.question);
    const words = q.split(/\s+/).filter(w => w.length > 3);
    const matches = words.filter(w => msg.includes(w)).length;
    if (words.length === 0) continue;
    const score = (matches / words.length) * row.confidence_score;
    if (score > 0.4 && (!best || score > best.confidence)) {
      best = { answer: row.answer, confidence: score, trainingId: row.id };
    }
  }

  return best;
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// REGISTRO DE ROTAS
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const registerWhatsAppRoutes = (app: WaApp) => {
  registerWhatsAppOperationalRoutes(app);

  // â”€â”€ DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  app.get('/api/crm/wa/dashboard', async (c) => {
    requireAuth(c.get('user'));
    const db = c.env.DB;

    const [totalContacts, openConversations, todayMessages, aiUsage, newSubscriptions, sectors] = await Promise.all([
      first<{ total: number }>(db.prepare('SELECT COUNT(*) as total FROM wa_contacts WHERE status = ?').bind('ativo')),
      first<{ total: number }>(db.prepare("SELECT COUNT(*) as total FROM wa_conversations WHERE status = 'aberta'")),
      first<{ total: number }>(db.prepare("SELECT COUNT(*) as total FROM wa_messages WHERE created_at >= date('now')")),
      first<{ total: number }>(db.prepare('SELECT COUNT(*) as total FROM wa_messages WHERE ai_suggested = 1')),
      first<{ total: number }>(db.prepare("SELECT COUNT(*) as total FROM wa_subscriptions WHERE created_at >= date('now', '-7 days')")),
      all<{ sector: string; total: number }>(db.prepare("SELECT sector, COUNT(*) as total FROM wa_contacts WHERE status = 'ativo' GROUP BY sector ORDER BY total DESC LIMIT 10")),
    ]);

    const recentConversations = await all<WaConversationRow>(
      db.prepare(`
        SELECT c.*, ct.name as contact_name, ct.phone as contact_phone, ct.avatar_url as contact_avatar
        FROM wa_conversations c
        LEFT JOIN wa_contacts ct ON ct.id = c.contact_id
        WHERE c.status = 'aberta'
        ORDER BY c.last_message_at DESC NULLS LAST
        LIMIT 5
      `),
    );

    const trainingCount = await first<{ total: number }>(db.prepare('SELECT COUNT(*) as total FROM wa_ai_training WHERE active = 1'));

    return c.json({
      ok: true,
      metrics: {
        totalContacts: totalContacts?.total ?? 0,
        openConversations: openConversations?.total ?? 0,
        todayMessages: todayMessages?.total ?? 0,
        aiUsageTotal: aiUsage?.total ?? 0,
        newSubscriptionsWeek: newSubscriptions?.total ?? 0,
        trainingPairs: trainingCount?.total ?? 0,
      },
      sectorDistribution: sectors,
      recentConversations: recentConversations.map(mapConversation),
    });
  });

  // â”€â”€ CONTATOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  app.get('/api/crm/wa/contacts', async (c) => {
    requireAuth(c.get('user'));
    const db = c.env.DB;
    const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
    const limit = 30;
    const offset = (page - 1) * limit;
    const search = c.req.query('search') ?? '';
    const sector = c.req.query('sector') ?? '';
    const status = c.req.query('status') ?? '';
    const tag = c.req.query('tag') ?? '';

    let where = '1=1';
    const binds: string[] = [];

    if (search) { where += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)'; binds.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (sector) { where += ' AND c.sector = ?'; binds.push(sector); }
    if (status) { where += ' AND c.status = ?'; binds.push(status); }
    if (tag) { where += ' AND json_extract(c.tags_json, ?) IS NOT NULL'; binds.push(`$[*]`); }

    const [countRow, rows] = await Promise.all([
      first<{ total: number }>(db.prepare(`SELECT COUNT(*) as total FROM wa_contacts c WHERE ${where}`).bind(...binds)),
      all<WaContactRow>(db.prepare(`SELECT * FROM wa_contacts c WHERE ${where} ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`).bind(...binds, limit, offset)),
    ]);

    return c.json({
      ok: true,
      contacts: rows.map(mapContact),
      total: countRow?.total ?? 0,
      page,
      totalPages: Math.ceil((countRow?.total ?? 0) / limit),
    });
  });

  app.get('/api/crm/wa/contacts/:id', async (c) => {
    requireAuth(c.get('user'));
    const row = await first<WaContactRow>(c.env.DB.prepare('SELECT * FROM wa_contacts WHERE id = ?').bind(c.req.param('id')));
    if (!row) throw new HttpError(404, 'Contato nao encontrado.');

    const conversations = await all<{ id: string; status: string; last_message_at: string | null; last_message_preview: string | null }>(
      c.env.DB.prepare('SELECT id, status, last_message_at, last_message_preview FROM wa_conversations WHERE contact_id = ? ORDER BY created_at DESC LIMIT 10').bind(row.id),
    );

    return c.json({ ok: true, contact: mapContact(row), conversations });
  });

  app.post('/api/crm/wa/contacts', async (c) => {
    const user = requireAuth(c.get('user'));
    const body = await requireJsonBody<{
      phone: string; name?: string; email?: string; sector?: string; source?: string;
      tags?: string[]; notes?: string; optedIn?: boolean; birthday?: string; address?: string;
    }>(c.req.raw);

    if (!body.phone) throw new HttpError(400, 'Telefone obrigatorio.');
    const existing = await first<{ id: string }>(c.env.DB.prepare('SELECT id FROM wa_contacts WHERE phone = ?').bind(body.phone));
    if (existing) throw new HttpError(409, 'Contato com este numero ja existe.');

    const id = generateId('wact');
    const now = nowIso();
    await run(c.env.DB.prepare(`
      INSERT INTO wa_contacts (id, phone, name, email, sector, source, tags_json, notes, birthday, address, opted_in, opted_in_at, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo', ?, ?)
    `).bind(id, body.phone, body.name ?? null, body.email ?? null, body.sector ?? 'geral', body.source ?? 'manual',
      asJson(body.tags ?? []), body.notes ?? null, body.birthday ?? null, body.address ?? null,
      body.optedIn ? 1 : 0, body.optedIn ? now : null, now, now));

    const row = await first<WaContactRow>(c.env.DB.prepare('SELECT * FROM wa_contacts WHERE id = ?').bind(id));
    return c.json({ ok: true, contact: mapContact(row!) }, 201);
  });

  app.put('/api/crm/wa/contacts/:id', async (c) => {
    requireAuth(c.get('user'));
    const body = await requireJsonBody<Partial<{
      name: string; email: string; sector: string; source: string; tags: string[];
      notes: string; status: string; optedIn: boolean; birthday: string; address: string;
      loyaltyPoints: number; lifetimeValue: number;
    }>>(c.req.raw);

    const existing = await first<WaContactRow>(c.env.DB.prepare('SELECT * FROM wa_contacts WHERE id = ?').bind(c.req.param('id')));
    if (!existing) throw new HttpError(404, 'Contato nao encontrado.');

    const now = nowIso();
    await run(c.env.DB.prepare(`
      UPDATE wa_contacts SET
        name = COALESCE(?, name), email = COALESCE(?, email), sector = COALESCE(?, sector),
        source = COALESCE(?, source), tags_json = COALESCE(?, tags_json),
        notes = COALESCE(?, notes), status = COALESCE(?, status),
        opted_in = COALESCE(?, opted_in), birthday = COALESCE(?, birthday),
        address = COALESCE(?, address), loyalty_points = COALESCE(?, loyalty_points),
        lifetime_value = COALESCE(?, lifetime_value), updated_at = ?
      WHERE id = ?
    `).bind(body.name ?? null, body.email ?? null, body.sector ?? null, body.source ?? null,
      body.tags ? asJson(body.tags) : null, body.notes ?? null, body.status ?? null,
      body.optedIn !== undefined ? (body.optedIn ? 1 : 0) : null, body.birthday ?? null,
      body.address ?? null, body.loyaltyPoints ?? null, body.lifetimeValue ?? null, now, c.req.param('id')));

    const updated = await first<WaContactRow>(c.env.DB.prepare('SELECT * FROM wa_contacts WHERE id = ?').bind(c.req.param('id')));
    return c.json({ ok: true, contact: mapContact(updated!) });
  });

  app.delete('/api/crm/wa/contacts/:id', async (c) => {
    requireAuth(c.get('user'));
    await run(c.env.DB.prepare('DELETE FROM wa_contacts WHERE id = ?').bind(c.req.param('id')));
    return c.json({ ok: true });
  });

  // â”€â”€ CONVERSAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  app.get('/api/crm/wa/conversations', async (c) => {
    requireAuth(c.get('user'));
    const status = c.req.query('status') ?? '';
    const search = c.req.query('search') ?? '';
    const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
    const limit = 25;
    const offset = (page - 1) * limit;

    let where = '1=1';
    const binds: string[] = [];

    if (status) { where += ' AND c.status = ?'; binds.push(status); }
    if (search) { where += ' AND (ct.name LIKE ? OR ct.phone LIKE ?)'; binds.push(`%${search}%`, `%${search}%`); }

    const [countRow, rows] = await Promise.all([
      first<{ total: number }>(c.env.DB.prepare(`SELECT COUNT(*) as total FROM wa_conversations c LEFT JOIN wa_contacts ct ON ct.id = c.contact_id WHERE ${where}`).bind(...binds)),
      all<WaConversationRow>(c.env.DB.prepare(`
        SELECT c.*, ct.name as contact_name, ct.phone as contact_phone, ct.avatar_url as contact_avatar
        FROM wa_conversations c
        LEFT JOIN wa_contacts ct ON ct.id = c.contact_id
        WHERE ${where}
        ORDER BY c.last_message_at DESC NULLS LAST
        LIMIT ? OFFSET ?
      `).bind(...binds, limit, offset)),
    ]);

    return c.json({
      ok: true,
      conversations: rows.map(mapConversation),
      total: countRow?.total ?? 0,
      page,
      totalPages: Math.ceil((countRow?.total ?? 0) / limit),
    });
  });

  app.get('/api/crm/wa/conversations/:id', async (c) => {
    requireAuth(c.get('user'));
    const row = await first<WaConversationRow>(c.env.DB.prepare(`
      SELECT c.*, ct.name as contact_name, ct.phone as contact_phone, ct.avatar_url as contact_avatar
      FROM wa_conversations c
      LEFT JOIN wa_contacts ct ON ct.id = c.contact_id
      WHERE c.id = ?
    `).bind(c.req.param('id')));
    if (!row) throw new HttpError(404, 'Conversa nao encontrada.');

    const messages = await all<WaMessageRow>(c.env.DB.prepare(`
      SELECT m.*, u.display_name as created_by_name
      FROM wa_messages m
      LEFT JOIN users u ON u.id = m.created_by_user_id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `).bind(c.req.param('id')));

    // mark as read
    await run(c.env.DB.prepare('UPDATE wa_conversations SET unread_count = 0 WHERE id = ?').bind(c.req.param('id')));

    return c.json({ ok: true, conversation: mapConversation(row), messages: messages.map(mapMessage) });
  });

  app.post('/api/crm/wa/conversations', async (c) => {
    requireAuth(c.get('user'));
    const body = await requireJsonBody<{ contactId: string; initialMessage?: string }>(c.req.raw);
    if (!body.contactId) throw new HttpError(400, 'contactId obrigatorio.');

    const contact = await first<WaContactRow>(c.env.DB.prepare('SELECT * FROM wa_contacts WHERE id = ?').bind(body.contactId));
    if (!contact) throw new HttpError(404, 'Contato nao encontrado.');

    const id = generateId('waconv');
    const now = nowIso();
    await run(c.env.DB.prepare(`
      INSERT INTO wa_conversations (id, contact_id, status, channel, unread_count, pipeline_stage, tags_json, created_at, updated_at)
      VALUES (?, ?, 'aberta', 'whatsapp', 0, 'novo', '[]', ?, ?)
    `).bind(id, body.contactId, now, now));

    const row = await first<WaConversationRow>(c.env.DB.prepare(`
      SELECT c.*, ct.name as contact_name, ct.phone as contact_phone, ct.avatar_url as contact_avatar
      FROM wa_conversations c
      LEFT JOIN wa_contacts ct ON ct.id = c.contact_id
      WHERE c.id = ?
    `).bind(id));

    return c.json({ ok: true, conversation: mapConversation(row!) }, 201);
  });

  app.put('/api/crm/wa/conversations/:id', async (c) => {
    requireAuth(c.get('user'));
    const body = await requireJsonBody<Partial<{ status: string; assignedToUserId: string; sentiment: string; pipelineStage: string; tags: string[]; internalNotes: string }>>(c.req.raw);
    const now = nowIso();
    await run(c.env.DB.prepare(`
      UPDATE wa_conversations SET
        status = COALESCE(?, status),
        assigned_to_user_id = COALESCE(?, assigned_to_user_id),
        sentiment = COALESCE(?, sentiment),
        pipeline_stage = COALESCE(?, pipeline_stage),
        tags_json = COALESCE(?, tags_json),
        internal_notes = COALESCE(?, internal_notes),
        resolved_at = CASE WHEN ? = 'fechada' AND resolved_at IS NULL THEN ? ELSE resolved_at END,
        updated_at = ?
      WHERE id = ?
    `).bind(body.status ?? null, body.assignedToUserId ?? null, body.sentiment ?? null,
      body.pipelineStage ?? null, body.tags ? asJson(body.tags) : null, body.internalNotes ?? null,
      body.status ?? null, now, now, c.req.param('id')));

    return c.json({ ok: true });
  });

  // â”€â”€ MENSAGENS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  app.post('/api/crm/wa/conversations/:id/messages', async (c) => {
    const user = requireAuth(c.get('user'));
    const body = await requireJsonBody<{
      content: string; type?: string; isInternalNote?: boolean; templateId?: string;
      mediaUrl?: string; aiSuggested?: boolean; aiConfidence?: number;
    }>(c.req.raw);

    if (!body.content?.trim() && !body.mediaUrl) throw new HttpError(400, 'Conteudo ou midia obrigatoria.');

    const conv = await first<{ id: string; contact_id: string }>(c.env.DB.prepare('SELECT id, contact_id FROM wa_conversations WHERE id = ?').bind(c.req.param('id')));
    if (!conv) throw new HttpError(404, 'Conversa nao encontrada.');

    const msgId = generateId('wamsg');
    const now = nowIso();
    await run(c.env.DB.prepare(`
      INSERT INTO wa_messages (id, conversation_id, contact_id, direction, type, content, media_url, status, ai_suggested, ai_confidence, template_id, is_internal_note, created_by_user_id, metadata_json, created_at)
      VALUES (?, ?, ?, 'saida', ?, ?, ?, 'enviado', ?, ?, ?, ?, ?, '{}', ?)
    `).bind(msgId, conv.id, conv.contact_id, body.type ?? 'texto', body.content ?? null,
      body.mediaUrl ?? null, body.aiSuggested ? 1 : 0, body.aiConfidence ?? null,
      body.templateId ?? null, body.isInternalNote ? 1 : 0, user.id, now));

    // update conversation last message
    await run(c.env.DB.prepare(`
      UPDATE wa_conversations SET last_message_at = ?, last_message_preview = ?, updated_at = ? WHERE id = ?
    `).bind(now, (body.content ?? '').substring(0, 120), now, conv.id));

    // increment sent count
    await run(c.env.DB.prepare('UPDATE wa_contacts SET total_messages_sent = total_messages_sent + 1, updated_at = ? WHERE id = ?').bind(now, conv.contact_id));

    // if template was used, increment usage
    if (body.templateId) {
      await run(c.env.DB.prepare('UPDATE wa_templates SET usage_count = usage_count + 1 WHERE id = ?').bind(body.templateId));
    }

    const msg = await first<WaMessageRow>(c.env.DB.prepare(`
      SELECT m.*, u.display_name as created_by_name FROM wa_messages m
      LEFT JOIN users u ON u.id = m.created_by_user_id WHERE m.id = ?
    `).bind(msgId));

    return c.json({ ok: true, message: mapMessage(msg!) }, 201);
  });

  // Simular mensagem recebida (para demo / webhook)
  app.post('/api/crm/wa/inbound', async (c) => {
    const user = requireManager(c.get('user'));
    const body = await requireJsonBody<{ phone: string; name?: string; content: string; sector?: string }>(c.req.raw);
    if (!body.phone || !body.content) throw new HttpError(400, 'phone e content obrigatorios.');

    const db = c.env.DB;
    const now = nowIso();

    // â”€â”€ Modo Teste: bloqueia todos os nÃºmeros exceto o nÃºmero de teste â”€â”€
    const [testModeRow, testNumberRow] = await Promise.all([
      first<{ value_json: string }>(db.prepare("SELECT value_json FROM app_settings WHERE key = 'wa_test_mode'")),
      first<{ value_json: string }>(db.prepare("SELECT value_json FROM app_settings WHERE key = 'wa_test_number'")),
    ]);
    const testModeEnabled = testModeRow ? JSON.parse(testModeRow.value_json) === true : false;
    const testNumber = testNumberRow ? JSON.parse(testNumberRow.value_json) as string : '';

    if (testModeEnabled) {
      const normalizePhone = (p: string) => p.replace(/\D/g, '');
      if (!testNumber || normalizePhone(body.phone) !== normalizePhone(testNumber)) {
        await insertAuditLog(c.env, {
          eventType: 'legacy_inbound_blocked_by_test_mode',
          actor: user.email,
          details: {
            phone: body.phone,
            allowedPhone: testNumber || null,
          },
        });
        return c.json({ ok: true, blocked: true, reason: 'test_mode', message: 'Sistema em modo aprendizado. Apenas o numero de teste esta ativo.' });
      }
    }
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // upsert contact
    let contact = await first<WaContactRow>(db.prepare('SELECT * FROM wa_contacts WHERE phone = ?').bind(body.phone));
    if (!contact) {
      const cid = generateId('wact');
      await run(db.prepare(`
        INSERT INTO wa_contacts (id, phone, name, sector, source, tags_json, opted_in, status, total_messages_received, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'whatsapp_inbound', '[]', 1, 'ativo', 1, ?, ?)
      `).bind(cid, body.phone, body.name ?? null, body.sector ?? 'geral', now, now));
      contact = await first<WaContactRow>(db.prepare('SELECT * FROM wa_contacts WHERE id = ?').bind(cid));
    } else {
      await run(db.prepare('UPDATE wa_contacts SET total_messages_received = total_messages_received + 1, last_seen_at = ?, updated_at = ? WHERE id = ?').bind(now, now, contact.id));
    }

    // get or create open conversation
    let conv = await first<{ id: string }>(db.prepare("SELECT id FROM wa_conversations WHERE contact_id = ? AND status = 'aberta' ORDER BY created_at DESC LIMIT 1").bind(contact!.id));
    if (!conv) {
      const convId = generateId('waconv');
      await run(db.prepare(`
        INSERT INTO wa_conversations (id, contact_id, status, channel, unread_count, pipeline_stage, tags_json, created_at, updated_at)
        VALUES (?, ?, 'aberta', 'whatsapp', 1, 'novo', '[]', ?, ?)
      `).bind(convId, contact!.id, now, now));
      conv = { id: convId };
    } else {
      await run(db.prepare('UPDATE wa_conversations SET unread_count = unread_count + 1, last_message_at = ?, last_message_preview = ?, updated_at = ? WHERE id = ?').bind(now, body.content.substring(0, 120), now, conv.id));
    }

    // save message
    const msgId = generateId('wamsg');
    await run(db.prepare(`
      INSERT INTO wa_messages (id, conversation_id, contact_id, direction, type, content, status, metadata_json, created_at)
      VALUES (?, ?, ?, 'entrada', 'texto', ?, 'lido', '{}', ?)
    `).bind(msgId, conv.id, contact!.id, body.content, now));

    // AI suggestion
    const aiSuggestion = await suggestAiResponse(db, body.content, contact!.sector ?? 'geral');

    return c.json({ ok: true, conversationId: conv.id, contactId: contact!.id, aiSuggestion });
  });

  // â”€â”€ IA - SUGESTÃƒO DE RESPOSTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  app.post('/api/crm/wa/ai-suggest', async (c) => {
    requireAuth(c.get('user'));
    const body = await requireJsonBody<{ message: string; sector?: string; conversationId?: string }>(c.req.raw);
    if (!body.message) throw new HttpError(400, 'Mensagem obrigatoria.');

    let sector = body.sector ?? 'geral';
    if (body.conversationId) {
      const conv = await first<{ contact_id: string }>(c.env.DB.prepare('SELECT contact_id FROM wa_conversations WHERE id = ?').bind(body.conversationId));
      if (conv) {
        const contact = await first<{ sector: string }>(c.env.DB.prepare('SELECT sector FROM wa_contacts WHERE id = ?').bind(conv.contact_id));
        if (contact) sector = contact.sector;
      }
    }

    const suggestion = await suggestAiResponse(c.env.DB, body.message, sector);
    return c.json({ ok: true, suggestion });
  });

  // Feedback sobre sugestÃ£o da IA
  app.post('/api/crm/wa/ai-suggest/feedback', async (c) => {
    requireAuth(c.get('user'));
    const body = await requireJsonBody<{ trainingId: string; positive: boolean }>(c.req.raw);
    const field = body.positive ? 'feedback_positive' : 'feedback_negative';
    await run(c.env.DB.prepare(`UPDATE wa_ai_training SET ${field} = ${field} + 1, usage_count = usage_count + 1 WHERE id = ?`).bind(body.trainingId));
    return c.json({ ok: true });
  });

  // â”€â”€ TREINAMENTO IA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  app.get('/api/crm/wa/ai-training', async (c) => {
    requireAuth(c.get('user'));
    const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
    const limit = 30;
    const offset = (page - 1) * limit;
    const category = c.req.query('category') ?? '';
    const sector = c.req.query('sector') ?? '';
    const search = c.req.query('search') ?? '';
    const activeOnly = c.req.query('active') === '1';

    let where = '1=1';
    const binds: (string | number)[] = [];
    if (category) { where += ' AND category = ?'; binds.push(category); }
    if (sector) { where += ' AND sector = ?'; binds.push(sector); }
    if (activeOnly) { where += ' AND active = 1'; }
    if (search) { where += ' AND (question LIKE ? OR answer LIKE ?)'; binds.push(`%${search}%`, `%${search}%`); }

    const [countRow, rows] = await Promise.all([
      first<{ total: number }>(c.env.DB.prepare(`SELECT COUNT(*) as total FROM wa_ai_training WHERE ${where}`).bind(...binds)),
      all<WaAiTrainingRow>(c.env.DB.prepare(`SELECT * FROM wa_ai_training WHERE ${where} ORDER BY usage_count DESC, created_at DESC LIMIT ? OFFSET ?`).bind(...binds, limit, offset)),
    ]);

    const categories = await all<{ category: string; total: number }>(c.env.DB.prepare("SELECT category, COUNT(*) as total FROM wa_ai_training WHERE active = 1 GROUP BY category ORDER BY total DESC"));

    return c.json({
      ok: true,
      items: rows.map(mapAiTraining),
      total: countRow?.total ?? 0,
      page,
      totalPages: Math.ceil((countRow?.total ?? 0) / limit),
      categories,
    });
  });

  app.post('/api/crm/wa/ai-training', async (c) => {
    const user = requireAuth(c.get('user'));
    const body = await requireJsonBody<{
      question: string; answer: string; category?: string; sector?: string; tags?: string[]; confidenceScore?: number;
    }>(c.req.raw);

    if (!body.question?.trim() || !body.answer?.trim()) throw new HttpError(400, 'Pergunta e resposta sao obrigatorias.');

    const id = generateId('watrain');
    const now = nowIso();
    await run(c.env.DB.prepare(`
      INSERT INTO wa_ai_training (id, question, answer, category, sector, tags_json, confidence_score, active, source, created_by_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'manual', ?, ?, ?)
    `).bind(id, body.question.trim(), body.answer.trim(), body.category ?? 'geral',
      body.sector ?? 'geral', asJson(body.tags ?? []), body.confidenceScore ?? 1.0, user.id, now, now));

    const row = await first<WaAiTrainingRow>(c.env.DB.prepare('SELECT * FROM wa_ai_training WHERE id = ?').bind(id));
    return c.json({ ok: true, item: mapAiTraining(row!) }, 201);
  });

  app.put('/api/crm/wa/ai-training/:id', async (c) => {
    requireAuth(c.get('user'));
    const body = await requireJsonBody<Partial<{ question: string; answer: string; category: string; sector: string; tags: string[]; active: boolean; confidenceScore: number }>>(c.req.raw);
    const now = nowIso();
    await run(c.env.DB.prepare(`
      UPDATE wa_ai_training SET
        question = COALESCE(?, question), answer = COALESCE(?, answer),
        category = COALESCE(?, category), sector = COALESCE(?, sector),
        tags_json = COALESCE(?, tags_json),
        active = COALESCE(?, active),
        confidence_score = COALESCE(?, confidence_score),
        updated_at = ?
      WHERE id = ?
    `).bind(body.question ?? null, body.answer ?? null, body.category ?? null, body.sector ?? null,
      body.tags ? asJson(body.tags) : null,
      body.active !== undefined ? (body.active ? 1 : 0) : null,
      body.confidenceScore ?? null, now, c.req.param('id')));

    const row = await first<WaAiTrainingRow>(c.env.DB.prepare('SELECT * FROM wa_ai_training WHERE id = ?').bind(c.req.param('id')));
    return c.json({ ok: true, item: mapAiTraining(row!) });
  });

  app.delete('/api/crm/wa/ai-training/:id', async (c) => {
    requireAuth(c.get('user'));
    await run(c.env.DB.prepare('DELETE FROM wa_ai_training WHERE id = ?').bind(c.req.param('id')));
    return c.json({ ok: true });
  });

  // â”€â”€ TEMPLATES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  app.get('/api/crm/wa/templates', async (c) => {
    requireAuth(c.get('user'));
    const category = c.req.query('category') ?? '';
    const search = c.req.query('search') ?? '';
    let where = '1=1';
    const binds: string[] = [];
    if (category) { where += ' AND category = ?'; binds.push(category); }
    if (search) { where += ' AND (name LIKE ? OR content LIKE ?)'; binds.push(`%${search}%`, `%${search}%`); }
    const rows = await all<WaTemplateRow>(c.env.DB.prepare(`SELECT * FROM wa_templates WHERE ${where} ORDER BY usage_count DESC, name ASC`).bind(...binds));
    return c.json({ ok: true, templates: rows.map(mapTemplate) });
  });

  app.post('/api/crm/wa/templates', async (c) => {
    const user = requireAuth(c.get('user'));
    const body = await requireJsonBody<{ name: string; category?: string; content: string; variables?: string[]; tags?: string[]; language?: string }>(c.req.raw);
    if (!body.name?.trim() || !body.content?.trim()) throw new HttpError(400, 'Nome e conteudo obrigatorios.');

    // extract variables like {{name}}
    const vars = [...(body.content.matchAll(/\{\{(\w+)\}\}/g))].map(m => m[1]);

    const id = generateId('watpl');
    const now = nowIso();
    await run(c.env.DB.prepare(`
      INSERT INTO wa_templates (id, name, category, content, variables_json, tags_json, language, status, usage_count, created_by_user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ativo', 0, ?, ?, ?)
    `).bind(id, body.name.trim(), body.category ?? 'geral', body.content.trim(),
      asJson([...new Set([...vars, ...(body.variables ?? [])])]),
      asJson(body.tags ?? []), body.language ?? 'pt_BR', user.id, now, now));

    const row = await first<WaTemplateRow>(c.env.DB.prepare('SELECT * FROM wa_templates WHERE id = ?').bind(id));
    return c.json({ ok: true, template: mapTemplate(row!) }, 201);
  });

  app.put('/api/crm/wa/templates/:id', async (c) => {
    requireAuth(c.get('user'));
    const body = await requireJsonBody<Partial<{ name: string; category: string; content: string; tags: string[]; status: string }>>(c.req.raw);
    const now = nowIso();
    const vars = body.content ? [...(body.content.matchAll(/\{\{(\w+)\}\}/g))].map(m => m[1]) : null;
    await run(c.env.DB.prepare(`
      UPDATE wa_templates SET
        name = COALESCE(?, name), category = COALESCE(?, category),
        content = COALESCE(?, content),
        variables_json = COALESCE(?, variables_json),
        tags_json = COALESCE(?, tags_json), status = COALESCE(?, status),
        updated_at = ?
      WHERE id = ?
    `).bind(body.name ?? null, body.category ?? null, body.content ?? null,
      vars ? asJson(vars) : null, body.tags ? asJson(body.tags) : null, body.status ?? null, now, c.req.param('id')));

    const row = await first<WaTemplateRow>(c.env.DB.prepare('SELECT * FROM wa_templates WHERE id = ?').bind(c.req.param('id')));
    return c.json({ ok: true, template: mapTemplate(row!) });
  });

  app.delete('/api/crm/wa/templates/:id', async (c) => {
    requireAuth(c.get('user'));
    await run(c.env.DB.prepare('DELETE FROM wa_templates WHERE id = ?').bind(c.req.param('id')));
    return c.json({ ok: true });
  });

  // â”€â”€ SETORES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  app.get('/api/crm/wa/sectors', async (c) => {
    requireAuth(c.get('user'));
    const rows = await all<WaSectorRow>(c.env.DB.prepare("SELECT * FROM wa_sectors WHERE active = 1 ORDER BY name ASC"));
    const counts = await all<{ sector: string; total: number }>(c.env.DB.prepare("SELECT sector, COUNT(*) as total FROM wa_contacts GROUP BY sector"));
    const countMap = Object.fromEntries(counts.map(r => [r.sector, r.total]));
    return c.json({
      ok: true,
      sectors: rows.map(r => ({ id: r.id, name: r.name, description: r.description, color: r.color, icon: r.icon, contactCount: countMap[r.name] ?? 0 })),
    });
  });

  app.post('/api/crm/wa/sectors', async (c) => {
    requireAuth(c.get('user'));
    const body = await requireJsonBody<{ name: string; description?: string; color?: string; icon?: string }>(c.req.raw);
    if (!body.name?.trim()) throw new HttpError(400, 'Nome do setor obrigatorio.');

    const id = generateId('wasec');
    const now = nowIso();
    await run(c.env.DB.prepare(`
      INSERT INTO wa_sectors (id, name, description, color, icon, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(id, body.name.trim(), body.description ?? null, body.color ?? '#6366f1', body.icon ?? 'folder', now, now));

    return c.json({ ok: true, sector: { id, name: body.name.trim(), color: body.color ?? '#6366f1' } }, 201);
  });

  // â”€â”€ INSCRIÃ‡Ã•ES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  app.get('/api/crm/wa/subscriptions', async (c) => {
    requireAuth(c.get('user'));
    const page = Math.max(1, parseInt(c.req.query('page') ?? '1'));
    const limit = 30;
    const offset = (page - 1) * limit;
    const sector = c.req.query('sector') ?? '';
    const status = c.req.query('status') ?? '';
    const search = c.req.query('search') ?? '';

    let where = '1=1';
    const binds: string[] = [];
    if (sector) { where += ' AND sector = ?'; binds.push(sector); }
    if (status) { where += ' AND status = ?'; binds.push(status); }
    if (search) { where += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)'; binds.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const [countRow, rows] = await Promise.all([
      first<{ total: number }>(c.env.DB.prepare(`SELECT COUNT(*) as total FROM wa_subscriptions WHERE ${where}`).bind(...binds)),
      all<WaSubscriptionRow>(c.env.DB.prepare(`SELECT * FROM wa_subscriptions WHERE ${where} ORDER BY opted_in_at DESC LIMIT ? OFFSET ?`).bind(...binds, limit, offset)),
    ]);

    return c.json({
      ok: true,
      subscriptions: rows.map(mapSubscription),
      total: countRow?.total ?? 0,
      page,
      totalPages: Math.ceil((countRow?.total ?? 0) / limit),
    });
  });

  app.post('/api/crm/wa/subscriptions', async (c) => {
    const body = await requireJsonBody<{
      phone: string; name?: string; email?: string; sector?: string;
      source?: string; tags?: string[]; customData?: Record<string, string>;
    }>(c.req.raw);

    if (!body.phone?.trim()) throw new HttpError(400, 'Telefone obrigatorio.');

    const existing = await first<{ id: string; status: string }>(c.env.DB.prepare('SELECT id, status FROM wa_subscriptions WHERE phone = ?').bind(body.phone));
    if (existing && existing.status === 'ativo') {
      return c.json({ ok: true, alreadySubscribed: true, id: existing.id });
    }

    const now = nowIso();
    if (existing) {
      await run(c.env.DB.prepare('UPDATE wa_subscriptions SET status = ?, cancelled_at = NULL, updated_at = ? WHERE id = ?').bind('ativo', now, existing.id));
      return c.json({ ok: true, reactivated: true, id: existing.id });
    }

    const id = generateId('wasub');
    await run(c.env.DB.prepare(`
      INSERT INTO wa_subscriptions (id, phone, name, email, sector, source, tags_json, custom_data_json, status, opted_in_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ativo', ?, ?, ?)
    `).bind(id, body.phone.trim(), body.name ?? null, body.email ?? null, body.sector ?? 'geral',
      body.source ?? 'formulario', asJson(body.tags ?? []), asJson(body.customData ?? {}), now, now, now));

    // also create/update wa_contact
    const existingContact = await first<{ id: string }>(c.env.DB.prepare('SELECT id FROM wa_contacts WHERE phone = ?').bind(body.phone));
    if (!existingContact) {
      const cid = generateId('wact');
      await run(c.env.DB.prepare(`
        INSERT INTO wa_contacts (id, phone, name, email, sector, source, tags_json, opted_in, opted_in_at, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 'ativo', ?, ?)
      `).bind(cid, body.phone.trim(), body.name ?? null, body.email ?? null,
        body.sector ?? 'geral', body.source ?? 'formulario', asJson(body.tags ?? []), now, now, now));
    } else {
      await run(c.env.DB.prepare('UPDATE wa_contacts SET opted_in = 1, opted_in_at = ?, updated_at = ? WHERE id = ?').bind(now, now, existingContact.id));
    }

    return c.json({ ok: true, id }, 201);
  });

  app.delete('/api/crm/wa/subscriptions/:id', async (c) => {
    requireAuth(c.get('user'));
    const now = nowIso();
    await run(c.env.DB.prepare('UPDATE wa_subscriptions SET status = ?, cancelled_at = ?, updated_at = ? WHERE id = ?').bind('cancelado', now, now, c.req.param('id')));
    return c.json({ ok: true });
  });

  // â”€â”€ CONFIGURAÃ‡Ã•ES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  app.get('/api/crm/wa/settings', async (c) => {
    requireAuth(c.get('user'));
    const db = c.env.DB;
    const keys = ['wa_bot_enabled', 'wa_bot_greeting', 'wa_bot_fallback', 'wa_default_sector', 'wa_auto_assign', 'wa_test_mode', 'wa_test_number'];
    const [rows, automationSettings, testModeSettings] = await Promise.all([
      all<{ key: string; value_json: string }>(db.prepare(`SELECT key, value_json FROM app_settings WHERE key IN (${keys.map(() => '?').join(',')})`).bind(...keys)),
      getWhatsAppAutomationSettings(c.env),
      getWhatsAppTestModeSettings(c.env),
    ]);
    const settings: Record<string, unknown> = {};
    for (const r of rows) {
      try { settings[r.key] = JSON.parse(r.value_json); } catch { settings[r.key] = r.value_json; }
    }
    settings.wa_bot_enabled = automationSettings.enabled;
    settings.wa_test_mode = testModeSettings.enabled;
    settings.wa_test_number = testModeSettings.allowedPhoneE164;
    return c.json({ ok: true, settings });
  });

  app.put('/api/crm/wa/settings', async (c) => {
    const user = requireManager(c.get('user'));
    const body = await requireJsonBody<Record<string, unknown>>(c.req.raw);
    const allowedKeys = ['wa_bot_enabled', 'wa_bot_greeting', 'wa_bot_fallback', 'wa_default_sector', 'wa_auto_assign', 'wa_test_mode', 'wa_test_number'];
    const now = nowIso();

    if (Object.prototype.hasOwnProperty.call(body, 'wa_bot_enabled')) {
      if (typeof body.wa_bot_enabled !== 'boolean') {
        throw new HttpError(400, 'wa_bot_enabled deve ser booleano.');
      }

      const automationSettings = await setWhatsAppAutomationSettings(c.env, {
        enabled: body.wa_bot_enabled,
        updatedBy: user.email,
        note: 'Atualizado pelo painel legado do WhatsApp.',
      });

      if (!automationSettings.enabled) {
        await cancelAutomaticOutboundForSafety(c.env, {
          reason: 'Automacao desligada pelo painel legado do WhatsApp.',
        });
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, 'wa_test_mode') || Object.prototype.hasOwnProperty.call(body, 'wa_test_number')) {
      const currentTestMode = await getWhatsAppTestModeSettings(c.env);
      const nextEnabled = Object.prototype.hasOwnProperty.call(body, 'wa_test_mode')
        ? Boolean(body.wa_test_mode)
        : currentTestMode.enabled;
      const nextPhone =
        Object.prototype.hasOwnProperty.call(body, 'wa_test_number')
          ? typeof body.wa_test_number === 'string'
            ? body.wa_test_number
            : body.wa_test_number == null
              ? null
              : String(body.wa_test_number)
          : currentTestMode.allowedPhoneE164;

      if (nextEnabled && !String(nextPhone ?? '').trim()) {
        throw new HttpError(400, 'Informe um numero de teste antes de ativar o modo aprendizado.');
      }

      const testModeSettings = await setWhatsAppTestModeSettings(c.env, {
        enabled: nextEnabled,
        allowedPhoneE164: nextPhone,
        updatedBy: user.email,
      });

      if (testModeSettings.enabled) {
        await cancelAutomaticOutboundForSafety(c.env, {
          reason: testModeSettings.allowedPhoneE164
            ? `Modo teste legado ativo. Somente ${testModeSettings.allowedPhoneE164} pode receber respostas automaticas.`
            : 'Modo teste legado ativo sem numero liberado.',
          excludedPhoneE164: testModeSettings.allowedPhoneE164,
        });
      }
    }

    for (const [key, value] of Object.entries(body)) {
      if (!allowedKeys.includes(key) || key === 'wa_bot_enabled' || key === 'wa_test_mode' || key === 'wa_test_number') continue;
      await run(c.env.DB.prepare(`INSERT INTO app_settings (key, value_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`).bind(key, asJson(value), now));
    }
    return c.json({ ok: true });
  });
};

