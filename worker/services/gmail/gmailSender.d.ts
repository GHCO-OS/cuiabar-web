import type { Env } from '../../types';
import { type MimePayload } from './mimeBuilder';
export interface GmailSendResult {
    id: string;
    threadId?: string;
}
export declare const sendViaGmail: (env: Env, payload: MimePayload) => Promise<GmailSendResult>;
