PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS whatsapp_outbound_commands (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  customer_profile_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'baileys' CHECK (provider IN ('baileys')),
  source TEXT NOT NULL CHECK (source IN ('assistant', 'admin', 'system')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  text_body TEXT NOT NULL,
  intent TEXT,
  template_key TEXT,
  rule_name TEXT,
  ai_model TEXT,
  provider_message_id TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  error_message TEXT,
  locked_at TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_profile_id) REFERENCES customer_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_outbound_commands_status ON whatsapp_outbound_commands(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_outbound_commands_conversation_id ON whatsapp_outbound_commands(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_outbound_commands_created_at ON whatsapp_outbound_commands(created_at);
