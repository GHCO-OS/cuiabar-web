export type WhatsAppIntent =
  | 'menu'
  | 'delivery'
  | 'hamburguer'
  | 'marmita'
  | 'reserva'
  | 'evento'
  | 'localizacao'
  | 'horarios'
  | 'reclamacao'
  | 'humano'
  | 'unknown';

export type ConversationStatus = 'active' | 'human_handoff' | 'resolved' | 'archived';
export type ConversationStage = 'assistant' | 'reservation' | 'human_handoff' | 'resolved';
export type ReservationFlowStatus = 'collecting' | 'ready' | 'submitted' | 'confirmed' | 'handoff' | 'cancelled';
export type ReservationFlowStep = 'date' | 'time' | 'guest_count' | 'notes' | 'name' | 'confirm';
export type HandoffPriority = 'normal' | 'high' | 'urgent';
export type HandoffStatus = 'open' | 'claimed' | 'closed';
export type MessageDirection = 'inbound' | 'outbound' | 'system';
export type MessageKind = 'text' | 'button' | 'interactive' | 'unsupported' | 'status';
export type AiMode = 'binding' | 'rest' | 'off';
export type OutboundCommandSource = 'assistant' | 'admin' | 'system';
export type OutboundCommandStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface BusinessContext {
  restaurantName: string;
  restaurantShortName: string;
  tone: string;
  menuUrl: string;
  burgerUrl: string;
  deliveryUrl: string;
  expressoUrl: string;
  whatsappChannelUrl: string;
  address: string;
  hoursSummary: string;
  phoneDisplay: string;
  reservationTimeOptions: string[];
}

export interface CustomerProfileRecord {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_e164: string | null;
  whatsapp_wa_id: string | null;
  preferred_channel: string;
  crm_contact_id: string | null;
  source: string;
  tags_json: string;
  summary_text: string | null;
  metadata_json: string;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationRecord {
  id: string;
  customer_profile_id: string;
  phone_e164: string;
  whatsapp_wa_id: string | null;
  whatsapp_profile_name: string | null;
  status: ConversationStatus;
  stage: ConversationStage;
  current_intent: WhatsAppIntent;
  current_flow: string | null;
  handoff_requested: number;
  last_message_at: string | null;
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  tags_json: string;
  summary_text: string | null;
  metadata_json: string;
  created_at: string;
  updated_at: string;
}

export interface ReservationFlowRecord {
  id: string;
  conversation_id: string;
  customer_profile_id: string;
  status: ReservationFlowStatus;
  current_step: ReservationFlowStep;
  customer_name: string | null;
  reservation_date: string | null;
  reservation_time: string | null;
  guest_count: number | null;
  notes: string | null;
  reservation_id: string | null;
  reservation_code: string | null;
  metadata_json: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HandoffRecord {
  id: string;
  conversation_id: string;
  customer_profile_id: string;
  reason: string;
  priority: HandoffPriority;
  status: HandoffStatus;
  requested_by: string;
  assigned_to: string | null;
  notes: string | null;
  metadata_json: string;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  provider_message_id: string | null;
  provider_status: string | null;
  message_type: string;
  message_text: string | null;
  normalized_text: string | null;
  intent: string | null;
  intent_confidence: number | null;
  rule_name: string | null;
  template_key: string | null;
  ai_model: string | null;
  payload_json: string;
  processed_at: string | null;
  created_at: string;
}

export interface ParsedInboundMessage {
  providerMessageId: string;
  timestamp: string;
  fromPhone: string;
  whatsappWaId: string;
  contactName: string | null;
  messageType: MessageKind;
  text: string;
  rawPayload: Record<string, unknown>;
}

export interface ParsedStatusUpdate {
  providerMessageId: string;
  status: string;
  rawPayload: Record<string, unknown>;
  timestamp: string;
}

export interface InboundBridgePayload {
  message: ParsedInboundMessage;
}

export interface OutboundCommandRecord {
  id: string;
  conversation_id: string;
  customer_profile_id: string;
  phone_e164: string;
  provider: 'baileys';
  source: OutboundCommandSource;
  status: OutboundCommandStatus;
  text_body: string;
  intent: string | null;
  template_key: string | null;
  rule_name: string | null;
  ai_model: string | null;
  provider_message_id: string | null;
  payload_json: string;
  error_message: string | null;
  locked_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookEnvelope {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Record<string, unknown>[];
        statuses?: Record<string, unknown>[];
      };
    }>;
  }>;
}

export interface IntentResult {
  intent: WhatsAppIntent;
  confidence: number;
  source: 'rule' | 'ai' | 'fallback';
  matchedKeywords: string[];
}

export interface SessionState {
  conversationId?: string;
  customerProfileId?: string;
  fallbackCount: number;
  lastIntent?: WhatsAppIntent;
  lastInviteAt?: string;
  activeReservationFlowId?: string;
  handoffOpen?: boolean;
  summary?: string;
}

export interface OutboundMessagePlan {
  text: string;
  templateKey: string;
  ruleName: string;
  intent: WhatsAppIntent;
  aiModel?: string | null;
}

export interface RuleResult {
  intent: IntentResult;
  tags: string[];
  reply: OutboundMessagePlan | null;
  openHandoff?: {
    reason: string;
    priority: HandoffPriority;
    notes?: string | null;
  };
  reservationFlowUpdate?: {
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
  };
  summaryHint?: string;
}

export interface ConversationDetail {
  profile: CustomerProfileRecord;
  conversation: ConversationRecord;
  messages: MessageRecord[];
  handoffs: HandoffRecord[];
  reservationFlow: ReservationFlowRecord | null;
}

export interface QueueInboundJob {
  kind: 'inbound_message';
  webhookEventId: string;
  message: ParsedInboundMessage;
}

export interface QueueStatusJob {
  kind: 'message_status';
  webhookEventId: string;
  status: ParsedStatusUpdate;
}

export type WhatsAppQueueJob = QueueInboundJob | QueueStatusJob;

export interface CrmSyncPayload {
  customerProfileId: string;
  conversationId: string;
  phoneE164: string;
  displayName: string | null;
  summary: string;
  tags: string[];
  latestIntent: WhatsAppIntent;
  interactionType: string;
  messageText: string | null;
  metadata?: Record<string, unknown>;
}

export interface CrmSyncResult {
  customerProfileId: string;
  crmContactId: string | null;
}

export interface InboundProcessResult {
  conversationId: string;
  customerProfileId: string;
  summary: string;
  outboundCommand: {
    id: string;
    toPhone: string;
    text: string;
  } | null;
}
