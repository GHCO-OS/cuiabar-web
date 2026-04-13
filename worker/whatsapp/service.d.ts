import type { Env } from '../types';
import type { InboundProcessResult, OutboundCommandRecord, ParsedInboundMessage, ParsedStatusUpdate } from './types';
export declare const processInboundMessage: (env: Env, message: ParsedInboundMessage) => Promise<InboundProcessResult>;
export declare const processStatusUpdate: (env: Env, status: ParsedStatusUpdate) => Promise<void>;
export declare const acknowledgeOutboundDelivery: (env: Env, params: {
    commandId: string;
    providerMessageId: string | null;
    payload?: Record<string, unknown>;
}) => Promise<OutboundCommandRecord>;
export declare const failOutboundDelivery: (env: Env, params: {
    commandId: string;
    errorMessage: string;
    payload?: Record<string, unknown>;
}) => Promise<OutboundCommandRecord>;
export declare const pullPendingOutboundCommands: (env: Env, limit?: number) => Promise<OutboundCommandRecord[]>;
export declare const cancelAutomaticOutboundForSafety: (env: Env, params: {
    reason: string;
    excludedPhoneE164?: string | null;
}) => Promise<number>;
export declare const createManualOutboundCommand: (env: Env, params: {
    conversationId: string;
    customerProfileId: string;
    phoneE164: string;
    text: string;
    actor: string;
}) => Promise<OutboundCommandRecord>;
export declare const getOutboundCommandDetail: (env: Env, commandId: string) => Promise<OutboundCommandRecord | null>;
