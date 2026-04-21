export type RoleName = 'gerente' | 'operador_marketing';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  status: string;
  roles: RoleName[];
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  googleAccessScope?: string | null;
}

export interface SessionPayload {
  ok: boolean;
  authenticated: boolean;
  user: SessionUser | null;
  csrfToken: string | null;
}

export interface BootstrapStatus {
  ok: boolean;
  requiresBootstrap: boolean;
  tokenConfigured: boolean;
}

export interface DashboardMetrics {
  campaignsSent: number;
  activeContacts: number;
  totalClicks: number;
  ctr: number;
  failures: number;
  unsubscribes: number;
  sentByPeriod: Array<{ day: string; total: number }>;
}

export interface Contact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  source: string;
  tags: string[];
  status: string;
  optInStatus: string;
  unsubscribedAt: string | null;
  lastSentAt: string | null;
  lastClickedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactList {
  id: string;
  name: string;
  description: string | null;
  kind: string;
  created_at: string;
  updated_at: string;
  contact_count: number;
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  rules: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  html: string;
  text: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  templateId: string;
  segmentId: string | null;
  listId: string | null;
  fromName: string;
  fromEmail: string;
  replyTo: string | null;
  status: string;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  totalRecipients: number;
  totalSent: number;
  totalFailed: number;
  totalClicked: number;
  totalUnsubscribed: number;
  totalClickEvents: number;
  totalUniqueClicks: number;
  sendBatchSize: number;
  sendRatePerMinute: number;
  sendPauseMs: number;
  maxRecipients: number;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  actor: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

// ─── WhatsApp CRM ────────────────────────────────────────────────────────────

export interface WaContact {
  id: string;
  phone: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  sector: string;
  status: 'ativo' | 'bloqueado' | 'arquivado';
  source: string;
  tags: string[];
  customFields: Record<string, string>;
  notes: string;
  birthday: string | null;
  address: string | null;
  optedIn: boolean;
  optedInAt: string | null;
  optedOutAt: string | null;
  lastSeenAt: string | null;
  totalMessagesReceived: number;
  totalMessagesSent: number;
  loyaltyPoints: number;
  lifetimeValue: number;
  aiProfile: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WaConversation {
  id: string;
  contactId: string;
  status: 'aberta' | 'fechada' | 'pendente' | 'bot' | 'aguardando';
  assignedToUserId: string | null;
  channel: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  sentiment: 'positivo' | 'neutro' | 'negativo' | null;
  tags: string[];
  pipelineStage: string;
  internalNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contact: { name: string; phone: string; avatarUrl: string | null };
}

export interface WaMessage {
  id: string;
  conversationId: string;
  contactId: string;
  direction: 'entrada' | 'saida';
  type: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'template' | 'nota_interna' | 'sistema';
  content: string;
  mediaUrl: string | null;
  status: 'enviado' | 'entregue' | 'lido' | 'falhou' | 'pendente';
  aiSuggested: boolean;
  aiConfidence: number | null;
  templateId: string | null;
  isInternalNote: boolean;
  createdByUserId: string | null;
  createdByName: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface WaTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  variables: string[];
  tags: string[];
  language: string;
  status: 'ativo' | 'inativo' | 'pendente';
  usageCount: number;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WaAiTraining {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  sector: string;
  active: boolean;
  confidenceScore: number;
  usageCount: number;
  feedbackPositive: number;
  feedbackNegative: number;
  source: string;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WaSubscription {
  id: string;
  phone: string;
  name: string;
  email: string;
  sector: string;
  source: string;
  tags: string[];
  customData: Record<string, string>;
  status: 'ativo' | 'cancelado' | 'pendente';
  optedInAt: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WaSector {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  contactCount: number;
}

export interface WaDashboardMetrics {
  totalContacts: number;
  openConversations: number;
  todayMessages: number;
  aiUsageTotal: number;
  newSubscriptionsWeek: number;
  trainingPairs: number;
}

// ─── Reservations ────────────────────────────────────────────────────────────

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'completed';
export type ReservationMealPeriod = 'lunch' | 'dinner';
export type ReservationGuestCountMode = 'exact' | 'approximate';
export type ReservationDietaryRestrictionType = 'none' | 'lactose' | 'vegan' | 'celiac' | 'other';
export type ReservationSeatingPreference = 'entry' | 'middle' | 'kids_space' | 'stage' | 'no_preference';

export interface ReservationAdminRecord {
  id: string;
  reservationCode: string;
  reservationDate: string;
  reservationTime: string;
  mealPeriod: ReservationMealPeriod;
  customerFullName: string;
  reservedPersonName: string | null;
  guestCount: number;
  guestCountMode: ReservationGuestCountMode;
  hasChildren: boolean;
  dietaryRestrictionType: ReservationDietaryRestrictionType;
  dietaryRestrictionNotes: string | null;
  seatingPreference: ReservationSeatingPreference;
  whatsappNumber: string;
  email: string | null;
  status: ReservationStatus;
  createdAt: string;
}

export type WhatsAppCustomerCategory = 'house' | 'new';

export interface WhatsAppAutomationSettings {
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
  note: string | null;
}

export interface WhatsAppTestModeSettings {
  enabled: boolean;
  allowedPhoneE164: string | null;
  updatedAt: string | null;
}

export interface WhatsAppBridgeStatus {
  machineName: string | null;
  connection: string;
  qrAvailable: boolean;
  qrDataUrl: string | null;
  qrFilePath: string | null;
  pairingCode: string | null;
  pairingMode: 'qr' | 'code' | null;
  pairingTarget: string | null;
  browserLabel: string | null;
  waVersion: string | null;
  waVersionSource: string | null;
  meId: string | null;
  connectedPhoneE164: string | null;
  lastError: string | null;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  reconnectAttempts: number;
  lastHeartbeatAt: string | null;
  updatedAt: string | null;
}

export interface WhatsAppBridgeControlRequest {
  id: string;
  action: 'reset_session';
  status: 'pending' | 'completed' | 'failed' | 'ignored';
  requestedAt: string;
  updatedAt: string;
  requestedBy: string;
  note: string | null;
  resultMessage: string | null;
  completedAt: string | null;
}

export interface WhatsAppConversationSummary {
  id: string;
  phoneE164: string;
  status: string;
  stage: string;
  currentIntent: string;
  handoffRequested: boolean;
  lastMessageAt: string | null;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  summary: string | null;
  tags: string[];
  customerProfileId: string;
  displayName: string | null;
  crmContactId: string | null;
  category: WhatsAppCustomerCategory;
  inboundCount: number;
  outboundCount: number;
}

export interface WhatsAppControlCenterPayload {
  automation: WhatsAppAutomationSettings;
  bridge: WhatsAppBridgeStatus;
  bridgeControl: WhatsAppBridgeControlRequest | null;
  testMode: WhatsAppTestModeSettings;
  metrics: {
    activeConversations: number;
    openHandoffs: number;
    activeReservationFlows: number;
    pendingOutboundCommands: number;
    respondedNumbers: number;
    houseCustomers: number;
    newCustomers: number;
  };
  respondedNumbers: Array<{
    conversationId: string;
    customerProfileId: string;
    phoneE164: string;
    displayName: string | null;
    category: WhatsAppCustomerCategory;
    outboundCount: number;
    inboundCount: number;
    lastOutboundAt: string | null;
    lastInboundAt: string | null;
    status: string;
  }>;
}
