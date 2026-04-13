import type { Env } from '../types';
import type { BusinessContext, IntentResult, SessionState } from './types';
export declare const classifyIntentWithAi: (env: Env, text: string, context: BusinessContext, session: SessionState) => Promise<IntentResult | null>;
export declare const summarizeConversationWithAi: (env: Env, context: BusinessContext, transcript: string) => Promise<string | null>;
export declare const generateGroundedReplyWithAi: (env: Env, context: BusinessContext, text: string) => Promise<string | null>;
export declare const getAiModelName: (env: Env) => string;
