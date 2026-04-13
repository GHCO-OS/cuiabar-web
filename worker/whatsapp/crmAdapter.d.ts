import type { Env } from '../types';
import type { CrmSyncPayload, CrmSyncResult } from './types';
export interface CrmAdapter {
    syncConversation(payload: CrmSyncPayload): Promise<CrmSyncResult>;
}
export declare const createCrmAdapter: (env: Env) => CrmAdapter;
export declare const syncConversationToLocalCrm: (env: Env, payload: CrmSyncPayload) => Promise<CrmSyncResult>;
