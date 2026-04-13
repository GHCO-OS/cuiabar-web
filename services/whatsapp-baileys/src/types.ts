export type MessageKind = 'text' | 'button' | 'interactive' | 'unsupported';

export interface NormalizedInboundMessage {
  providerMessageId: string;
  timestamp: string;
  fromPhone: string;
  whatsappWaId: string;
  contactName: string | null;
  messageType: MessageKind;
  text: string;
  rawPayload: Record<string, unknown>;
}

export interface InboundProcessResponse {
  ok: boolean;
  result: {
    conversationId: string;
    customerProfileId: string;
    summary: string;
    outboundCommand: {
      id: string;
      toPhone: string;
      text: string;
    } | null;
  };
}

export interface PulledOutboundCommand {
  id: string;
  conversationId: string;
  customerProfileId: string;
  phoneE164: string;
  text: string;
  source: 'assistant' | 'admin' | 'system';
  intent: string | null;
  templateKey: string | null;
  ruleName: string | null;
  createdAt: string;
}

export interface PullOutboundResponse {
  ok: boolean;
  commands: PulledOutboundCommand[];
}

export interface BridgeHeartbeatPayload {
  machineName: string | null;
  connection: string;
  qrAvailable: boolean;
  qrDataUrl: string | null;
  qrFilePath: string | null;
  pairingCode: string | null;
  pairingMode: 'qr' | 'code';
  pairingTarget: string | null;
  browserLabel: string;
  waVersion: string | null;
  waVersionSource: string | null;
  meId: string | null;
  lastError: string | null;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  reconnectAttempts: number;
}

export interface BridgeControlRequest {
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

export interface BridgeStatus {
  connection: string;
  qrAvailable: boolean;
  qrDataUrl: string | null;
  qrFilePath: string | null;
  pairingCode: string | null;
  pairingMode: 'qr' | 'code';
  pairingTarget: string | null;
  browserLabel: string;
  waVersion: string | null;
  waVersionSource: string | null;
  meId: string | null;
  lastError: string | null;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  reconnectAttempts: number;
}

export interface BridgeConfig {
  workerBaseUrl: string;
  internalToken: string;
  authDir: string;
  pollIntervalMs: number;
  pullBatchSize: number;
  statusHost: string;
  statusPort: number;
  logLevel: string;
  markIncomingAsRead: boolean;
  reconnectDelayMs: number;
  connectTimeoutMs: number;
  defaultQueryTimeoutMs: number | undefined;
  countryCode: string;
  browserPreset: 'windows_desktop' | 'windows_chrome' | 'mac_desktop' | 'mac_chrome';
  versionSource: 'wa_web' | 'baileys' | 'pinned';
  pinnedVersion: [number, number, number] | null;
  pairingMode: 'qr' | 'code';
  pairingPhone: string | null;
  pairingCodeDelayMs: number;
  testRecipient: string | null;
}
