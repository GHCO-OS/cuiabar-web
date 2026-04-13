import type { Env } from '../types';
import type { BusinessContext, IntentResult, ReservationFlowRecord, RuleResult, SessionState } from './types';
export declare const evaluateRules: (env: Env, context: BusinessContext, params: {
    intent: IntentResult;
    session: SessionState;
    messageText: string;
    messageType: string;
    currentFlow: ReservationFlowRecord | null;
    fallbackCustomerName: string | null;
    phoneE164: string;
    profileEmail?: string | null;
}) => Promise<RuleResult>;
