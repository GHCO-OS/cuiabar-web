import type { Env } from '../types';
import type { ConversationDetail, ConversationRecord, ConversationStage, ConversationStatus, CustomerProfileRecord, HandoffPriority, HandoffRecord, MessageDirection, MessageRecord, OutboundCommandRecord, OutboundCommandSource, ReservationFlowRecord, ReservationFlowStatus, ReservationFlowStep, WhatsAppIntent } from './types';
export declare const insertWebhookEvent: (env: Env, eventType: string, payload: unknown, signature: string | null, providerEventId: string | null) => Promise<string>;
export declare const updateWebhookEventStatus: (env: Env, webhookEventId: string, status: "processed" | "ignored" | "failed", errorMessage?: string | null) => Promise<void>;
export declare const findMessageByProviderId: (env: Env, providerMessageId: string) => Promise<MessageRecord | null>;
export declare const upsertCustomerProfile: (env: Env, params: {
    phoneE164: string;
    whatsappWaId: string | null;
    displayName: string | null;
    source?: string;
}) => Promise<CustomerProfileRecord>;
export declare const updateCustomerProfileSummary: (env: Env, profileId: string, summary: string, tags: string[]) => Promise<void>;
export declare const getOrCreateConversation: (env: Env, params: {
    customerProfileId: string;
    phoneE164: string;
    whatsappWaId: string | null;
    whatsappProfileName: string | null;
}) => Promise<ConversationRecord>;
export declare const updateConversation: (env: Env, conversationId: string, changes: {
    status?: ConversationStatus;
    stage?: ConversationStage;
    currentIntent?: WhatsAppIntent;
    currentFlow?: string | null;
    handoffRequested?: boolean;
    tags?: string[];
    summary?: string | null;
    lastInboundAt?: string | null;
    lastOutboundAt?: string | null;
}) => Promise<void>;
export declare const insertConversationMessage: (env: Env, params: {
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
}) => Promise<string>;
export declare const updateMessageStatus: (env: Env, providerMessageId: string, status: string, payload: unknown) => Promise<void>;
export declare const markMessageProcessed: (env: Env, providerMessageId: string, params: {
    intent?: string | null;
    intentConfidence?: number | null;
    ruleName?: string | null;
    templateKey?: string | null;
    aiModel?: string | null;
}) => Promise<void>;
export declare const getOpenReservationFlow: (env: Env, conversationId: string) => Promise<ReservationFlowRecord | null>;
export declare const upsertReservationFlow: (env: Env, params: {
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
}) => Promise<ReservationFlowRecord>;
export declare const openHandoff: (env: Env, params: {
    conversationId: string;
    customerProfileId: string;
    reason: string;
    priority: HandoffPriority;
    requestedBy?: string;
    notes?: string | null;
    metadata?: Record<string, unknown>;
}) => Promise<HandoffRecord>;
export declare const closeHandoff: (env: Env, handoffId: string, actor: string) => Promise<void>;
export declare const insertAuditLog: (env: Env, params: {
    conversationId?: string | null;
    customerProfileId?: string | null;
    eventType: string;
    level?: "info" | "warning" | "error";
    actor?: string;
    details?: Record<string, unknown>;
}) => Promise<void>;
export declare const createOutboundCommand: (env: Env, params: {
    conversationId: string;
    customerProfileId: string;
    phoneE164: string;
    textBody: string;
    source: OutboundCommandSource;
    status?: "pending" | "processing";
    intent?: string | null;
    templateKey?: string | null;
    ruleName?: string | null;
    aiModel?: string | null;
    payload?: Record<string, unknown>;
}) => Promise<OutboundCommandRecord>;
export declare const claimPendingOutboundCommands: (env: Env, limit?: number, options?: {
    allowedSources?: OutboundCommandSource[];
    assistantPhoneAllowlist?: string[];
}) => Promise<OutboundCommandRecord[]>;
export declare const cancelPendingOutboundCommands: (env: Env, params: {
    reason: string;
    sources?: OutboundCommandSource[];
    excludedPhoneE164?: string | null;
}) => Promise<number>;
export declare const acknowledgeOutboundCommand: (env: Env, params: {
    commandId: string;
    providerMessageId: string | null;
    payload?: Record<string, unknown>;
}) => Promise<OutboundCommandRecord | null>;
export declare const failOutboundCommand: (env: Env, params: {
    commandId: string;
    errorMessage: string;
    payload?: Record<string, unknown>;
}) => Promise<OutboundCommandRecord | null>;
export declare const getOutboundCommand: (env: Env, commandId: string) => Promise<OutboundCommandRecord | null>;
export declare const listConversationRows: (env: Env, filters: {
    status?: string | null;
    query?: string | null;
}) => Promise<{
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
}[]>;
export declare const getConversationDetail: (env: Env, conversationId: string) => Promise<ConversationDetail | null>;
export declare const getRecentTranscript: (env: Env, conversationId: string, limit?: number) => Promise<string>;
export declare const attachCrmContactLink: (env: Env, profileId: string, crmContactId: string | null) => Promise<void>;
