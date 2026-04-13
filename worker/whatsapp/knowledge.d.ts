import type { Env } from '../types';
import type { BusinessContext, WhatsAppIntent } from './types';
export declare const buildBusinessContext: (env: Env) => BusinessContext;
export declare const buildKnowledgeBullets: (context: BusinessContext) => string[];
export declare const KNOWLEDGE_BY_INTENT: Record<Exclude<WhatsAppIntent, 'unknown'>, (context: BusinessContext) => string[]>;
