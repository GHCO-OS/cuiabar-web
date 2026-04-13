-- WhatsApp CRM Module
-- Central de Mensagens, IA de Respostas, Setorização e Base de Clientes

-- Contatos WhatsApp (perfil 360°)
CREATE TABLE IF NOT EXISTS wa_contacts (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  sector TEXT DEFAULT 'geral',
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'bloqueado', 'arquivado')),
  source TEXT DEFAULT 'manual',
  tags_json TEXT DEFAULT '[]',
  custom_fields_json TEXT DEFAULT '{}',
  notes TEXT,
  birthday TEXT,
  address TEXT,
  opted_in INTEGER DEFAULT 0,
  opted_in_at TEXT,
  opted_out_at TEXT,
  last_seen_at TEXT,
  total_messages_received INTEGER DEFAULT 0,
  total_messages_sent INTEGER DEFAULT 0,
  ai_profile_json TEXT DEFAULT '{}',
  loyalty_points INTEGER DEFAULT 0,
  lifetime_value REAL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wa_contacts_phone ON wa_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_sector ON wa_contacts(sector);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_status ON wa_contacts(status);

-- Conversas
CREATE TABLE IF NOT EXISTS wa_conversations (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES wa_contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'pendente', 'bot', 'aguardando')),
  assigned_to_user_id TEXT,
  channel TEXT DEFAULT 'whatsapp',
  last_message_at TEXT,
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  sentiment TEXT CHECK (sentiment IN ('positivo', 'neutro', 'negativo', NULL)),
  tags_json TEXT DEFAULT '[]',
  pipeline_stage TEXT DEFAULT 'novo',
  internal_notes TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wa_conversations_contact ON wa_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_wa_conversations_status ON wa_conversations(status);
CREATE INDEX IF NOT EXISTS idx_wa_conversations_last ON wa_conversations(last_message_at DESC);

-- Mensagens
CREATE TABLE IF NOT EXISTS wa_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES wa_conversations(id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES wa_contacts(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('entrada', 'saida')),
  type TEXT DEFAULT 'texto' CHECK (type IN ('texto', 'imagem', 'audio', 'video', 'documento', 'template', 'nota_interna', 'sistema')),
  content TEXT,
  media_url TEXT,
  media_mime TEXT,
  status TEXT DEFAULT 'enviado' CHECK (status IN ('enviado', 'entregue', 'lido', 'falhou', 'pendente')),
  ai_suggested INTEGER DEFAULT 0,
  ai_confidence REAL,
  template_id TEXT,
  is_internal_note INTEGER DEFAULT 0,
  created_by_user_id TEXT,
  whatsapp_message_id TEXT,
  error_message TEXT,
  metadata_json TEXT DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_conversation ON wa_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wa_messages_contact ON wa_messages(contact_id);

-- Templates de Resposta Rápida
CREATE TABLE IF NOT EXISTS wa_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'geral',
  content TEXT NOT NULL,
  variables_json TEXT DEFAULT '[]',
  tags_json TEXT DEFAULT '[]',
  language TEXT DEFAULT 'pt_BR',
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente')),
  usage_count INTEGER DEFAULT 0,
  created_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Treinamento de IA
CREATE TABLE IF NOT EXISTS wa_ai_training (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'geral',
  tags_json TEXT DEFAULT '[]',
  sector TEXT DEFAULT 'geral',
  active INTEGER DEFAULT 1,
  confidence_score REAL DEFAULT 1.0,
  usage_count INTEGER DEFAULT 0,
  feedback_positive INTEGER DEFAULT 0,
  feedback_negative INTEGER DEFAULT 0,
  source TEXT DEFAULT 'manual',
  created_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wa_ai_training_category ON wa_ai_training(category);
CREATE INDEX IF NOT EXISTS idx_wa_ai_training_active ON wa_ai_training(active);

-- Segmentos de Clientes WhatsApp
CREATE TABLE IF NOT EXISTS wa_segments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rules_json TEXT NOT NULL DEFAULT '{}',
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'users',
  auto_tag INTEGER DEFAULT 0,
  created_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Setores
CREATE TABLE IF NOT EXISTS wa_sectors (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  auto_assign_rules_json TEXT DEFAULT '{}',
  notification_users_json TEXT DEFAULT '[]',
  active INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Inscrições / Base de Clientes
CREATE TABLE IF NOT EXISTS wa_subscriptions (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  sector TEXT DEFAULT 'geral',
  source TEXT DEFAULT 'formulario',
  tags_json TEXT DEFAULT '[]',
  custom_data_json TEXT DEFAULT '{}',
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'cancelado', 'pendente')),
  opted_in_at TEXT NOT NULL,
  cancelled_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wa_subscriptions_phone ON wa_subscriptions(phone);
CREATE INDEX IF NOT EXISTS idx_wa_subscriptions_sector ON wa_subscriptions(sector);

-- Broadcasts (envios em massa)
CREATE TABLE IF NOT EXISTS wa_broadcasts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  template_id TEXT REFERENCES wa_templates(id),
  segment_id TEXT,
  custom_message TEXT,
  sector_filter TEXT,
  tags_filter_json TEXT DEFAULT '[]',
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'agendado', 'enviando', 'concluido', 'cancelado')),
  scheduled_at TEXT,
  started_at TEXT,
  finished_at TEXT,
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  created_by_user_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Configurações do módulo WhatsApp
INSERT OR IGNORE INTO app_settings (key, value_json, updated_at)
VALUES
  ('wa_bot_enabled', 'false', datetime('now')),
  ('wa_bot_greeting', '"Olá! Sou o assistente virtual do Cuiabar. Como posso te ajudar?"', datetime('now')),
  ('wa_bot_fallback', '"Vou transferir você para um de nossos atendentes. Aguarde um momento."', datetime('now')),
  ('wa_default_sector', '"geral"', datetime('now')),
  ('wa_auto_assign', 'false', datetime('now'));
