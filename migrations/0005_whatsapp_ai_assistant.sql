PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customer_profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE,
  phone_e164 TEXT UNIQUE,
  whatsapp_wa_id TEXT UNIQUE,
  preferred_channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (preferred_channel IN ('whatsapp', 'email', 'phone')),
  crm_contact_id TEXT,
  source TEXT NOT NULL DEFAULT 'whatsapp_assistant',
  tags_json TEXT NOT NULL DEFAULT '[]',
  summary_text TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  last_interaction_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (crm_contact_id) REFERENCES contacts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_phone ON customer_profiles(phone_e164);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_crm_contact_id ON customer_profiles(crm_contact_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_last_interaction ON customer_profiles(last_interaction_at);

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id TEXT PRIMARY KEY,
  customer_profile_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  whatsapp_wa_id TEXT,
  whatsapp_profile_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'human_handoff', 'resolved', 'archived')),
  stage TEXT NOT NULL DEFAULT 'assistant' CHECK (stage IN ('assistant', 'reservation', 'human_handoff', 'resolved')),
  current_intent TEXT NOT NULL DEFAULT 'unknown',
  current_flow TEXT,
  handoff_requested INTEGER NOT NULL DEFAULT 0 CHECK (handoff_requested IN (0, 1)),
  last_message_at TEXT,
  last_inbound_at TEXT,
  last_outbound_at TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  summary_text TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_profile_id) REFERENCES customer_profiles(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_e164);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_customer_profile ON whatsapp_conversations(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status ON whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_stage ON whatsapp_conversations(stage);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_updated_at ON whatsapp_conversations(updated_at);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound', 'system')),
  provider_message_id TEXT UNIQUE,
  provider_status TEXT,
  message_type TEXT NOT NULL,
  message_text TEXT,
  normalized_text TEXT,
  intent TEXT,
  intent_confidence REAL,
  rule_name TEXT,
  template_key TEXT,
  ai_model TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  processed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_intent ON whatsapp_messages(intent);

CREATE TABLE IF NOT EXISTS whatsapp_reservation_flows (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  customer_profile_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'collecting' CHECK (status IN ('collecting', 'ready', 'submitted', 'confirmed', 'handoff', 'cancelled')),
  current_step TEXT NOT NULL DEFAULT 'date' CHECK (current_step IN ('date', 'time', 'guest_count', 'notes', 'name', 'confirm')),
  customer_name TEXT,
  reservation_date TEXT,
  reservation_time TEXT,
  guest_count INTEGER,
  notes TEXT,
  reservation_id TEXT,
  reservation_code TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_profile_id) REFERENCES customer_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_reservation_flows_conversation_id ON whatsapp_reservation_flows(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reservation_flows_customer_profile_id ON whatsapp_reservation_flows(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_reservation_flows_status ON whatsapp_reservation_flows(status);

CREATE TABLE IF NOT EXISTS whatsapp_handoffs (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  customer_profile_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'closed')),
  requested_by TEXT NOT NULL DEFAULT 'assistant',
  assigned_to TEXT,
  notes TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_profile_id) REFERENCES customer_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_handoffs_conversation_id ON whatsapp_handoffs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_handoffs_customer_profile_id ON whatsapp_handoffs(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_handoffs_status ON whatsapp_handoffs(status);

CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
  id TEXT PRIMARY KEY,
  provider_event_id TEXT,
  event_type TEXT NOT NULL,
  signature TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  processing_status TEXT NOT NULL DEFAULT 'queued' CHECK (processing_status IN ('queued', 'processed', 'ignored', 'failed')),
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_events_provider_event_id ON whatsapp_webhook_events(provider_event_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_events_type ON whatsapp_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_events_status ON whatsapp_webhook_events(processing_status);

CREATE TABLE IF NOT EXISTS whatsapp_audit_logs (
  id TEXT PRIMARY KEY,
  conversation_id TEXT,
  customer_profile_id TEXT,
  event_type TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warning', 'error')),
  actor TEXT NOT NULL DEFAULT 'system',
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_profile_id) REFERENCES customer_profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_audit_logs_conversation_id ON whatsapp_audit_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_audit_logs_customer_profile_id ON whatsapp_audit_logs(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_audit_logs_event_type ON whatsapp_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_audit_logs_created_at ON whatsapp_audit_logs(created_at);
