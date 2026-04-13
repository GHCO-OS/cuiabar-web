import { ALLOWED_INTENTS, COMPLAINT_KEYWORDS, HUMAN_HANDOFF_KEYWORDS, INTENT_KEYWORDS } from './constants';
import { classifyIntentWithAi } from './aiService';
import { normalizeFreeText } from './utils';
const scoreIntent = (normalizedText, intent) => {
    if (intent === 'unknown') {
        return 0;
    }
    let score = 0;
    for (const keyword of INTENT_KEYWORDS[intent]) {
        if (normalizedText.includes(normalizeFreeText(keyword))) {
            score += keyword.includes(' ') ? 2 : 1;
        }
    }
    return score;
};
const ruleBasedIntent = (normalizedText) => {
    if (!normalizedText) {
        return null;
    }
    if ([...COMPLAINT_KEYWORDS].some((keyword) => normalizedText.includes(normalizeFreeText(keyword)))) {
        return {
            intent: 'reclamacao',
            confidence: 0.94,
            matchedKeywords: [...COMPLAINT_KEYWORDS].filter((keyword) => normalizedText.includes(normalizeFreeText(keyword))),
            source: 'rule',
        };
    }
    if ([...HUMAN_HANDOFF_KEYWORDS].some((keyword) => normalizedText.includes(normalizeFreeText(keyword)))) {
        return {
            intent: 'humano',
            confidence: 0.96,
            matchedKeywords: [...HUMAN_HANDOFF_KEYWORDS].filter((keyword) => normalizedText.includes(normalizeFreeText(keyword))),
            source: 'rule',
        };
    }
    let bestIntent = 'unknown';
    let bestScore = 0;
    let bestKeywords = [];
    for (const intent of ALLOWED_INTENTS) {
        if (intent === 'unknown' || intent === 'reclamacao' || intent === 'humano') {
            continue;
        }
        const matchedKeywords = INTENT_KEYWORDS[intent].filter((keyword) => normalizedText.includes(normalizeFreeText(keyword)));
        const score = scoreIntent(normalizedText, intent);
        if (score > bestScore) {
            bestIntent = intent;
            bestScore = score;
            bestKeywords = matchedKeywords;
        }
    }
    if (!bestScore) {
        return null;
    }
    return {
        intent: bestIntent,
        confidence: Math.min(0.9, 0.55 + bestScore * 0.12),
        matchedKeywords: bestKeywords,
        source: 'rule',
    };
};
export const detectIntent = async (env, context, session, text) => {
    const normalizedText = normalizeFreeText(text);
    const ruled = ruleBasedIntent(normalizedText);
    if (ruled && ruled.confidence >= 0.75) {
        return ruled;
    }
    const aiResult = await classifyIntentWithAi(env, normalizedText, context, session);
    if (aiResult && aiResult.confidence >= 0.55) {
        return aiResult;
    }
    if (ruled) {
        return ruled;
    }
    return {
        intent: 'unknown',
        confidence: 0.2,
        matchedKeywords: [],
        source: 'fallback',
    };
};
