import type { Env } from '../types';
export type CustomerCategory = 'house' | 'new';
export type BridgeControlAction = 'reset_session';
export type BridgeControlRequestStatus = 'pending' | 'completed' | 'failed' | 'ignored';
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
export interface BridgeRuntimeStatus {
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
export interface BridgeStatusHeartbeatPayload {
    machineName?: string | null;
    connection: string;
    qrAvailable: boolean;
    qrDataUrl?: string | null;
    qrFilePath?: string | null;
    pairingCode?: string | null;
    pairingMode?: 'qr' | 'code' | null;
    pairingTarget?: string | null;
    browserLabel?: string | null;
    waVersion?: string | null;
    waVersionSource?: string | null;
    meId?: string | null;
    lastError?: string | null;
    lastInboundAt?: string | null;
    lastOutboundAt?: string | null;
    reconnectAttempts?: number;
}
export interface BridgeControlRequest {
    id: string;
    action: BridgeControlAction;
    status: BridgeControlRequestStatus;
    requestedAt: string;
    updatedAt: string;
    requestedBy: string;
    note: string | null;
    resultMessage: string | null;
    completedAt: string | null;
}
export declare const getWhatsAppAutomationSettings: (env: Env) => Promise<WhatsAppAutomationSettings>;
export declare const setWhatsAppAutomationSettings: (env: Env, params: {
    enabled: boolean;
    updatedBy: string;
    note?: string | null;
}) => Promise<WhatsAppAutomationSettings>;
export declare const getWhatsAppTestModeSettings: (env: Env) => Promise<WhatsAppTestModeSettings>;
export declare const setWhatsAppTestModeSettings: (env: Env, params: {
    enabled: boolean;
    allowedPhoneE164?: string | null;
    updatedBy: string;
}) => Promise<WhatsAppTestModeSettings>;
export declare const getBridgeRuntimeStatus: (env: Env) => Promise<BridgeRuntimeStatus>;
export declare const updateBridgeRuntimeStatus: (env: Env, heartbeat: BridgeStatusHeartbeatPayload) => Promise<BridgeRuntimeStatus>;
export declare const getBridgeControlRequest: (env: Env) => Promise<BridgeControlRequest | null>;
export declare const getPendingBridgeControlRequest: (env: Env) => Promise<BridgeControlRequest | null>;
export declare const requestBridgeControl: (env: Env, params: {
    action: BridgeControlAction;
    requestedBy: string;
    note?: string | null;
}) => Promise<BridgeControlRequest>;
export declare const resolveBridgeControlRequest: (env: Env, params: {
    id: string;
    status: Exclude<BridgeControlRequestStatus, "pending">;
    resultMessage?: string | null;
}) => Promise<BridgeControlRequest | null>;
export declare const resolveCustomerCategory: (metadataJson: string | null | undefined, crmContactId: string | null | undefined) => CustomerCategory;
export declare const updateCustomerCategory: (env: Env, params: {
    profileId: string;
    category: CustomerCategory;
}) => Promise<CustomerCategory | null>;
