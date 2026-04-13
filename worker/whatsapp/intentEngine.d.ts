import type { Env } from '../types';
import type { BusinessContext, IntentResult, SessionState } from './types';
export declare const detectIntent: (env: Env, context: BusinessContext, session: SessionState, text: string) => Promise<IntentResult>;
