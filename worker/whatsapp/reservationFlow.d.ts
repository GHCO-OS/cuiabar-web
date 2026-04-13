import type { Env } from '../types';
import type { BusinessContext, ReservationFlowRecord, RuleResult } from './types';
export declare const advanceReservationFlow: (env: Env, context: BusinessContext, params: {
    currentFlow: ReservationFlowRecord | null;
    messageText: string;
    phoneE164: string;
    fallbackCustomerName: string | null;
    profileEmail?: string | null;
}) => Promise<RuleResult>;
