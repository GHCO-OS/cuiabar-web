import type { Env } from '../types';
import { generateGroundedReplyWithAi, getAiModelName } from './aiService';
import { CHANNEL_INVITE_COOLDOWN_MS, HUMAN_HANDOFF_FALLBACK_THRESHOLD } from './constants';
import { advanceReservationFlow } from './reservationFlow';
import {
  burgerTemplate,
  complaintTemplate,
  deliveryTemplate,
  eventTemplate,
  handoffTemplate,
  hoursTemplate,
  locationTemplate,
  marmitaTemplate,
  menuTemplate,
  unknownTemplate,
  unsupportedMessageTemplate,
} from './templates';
import type { BusinessContext, IntentResult, ReservationFlowRecord, RuleResult, SessionState } from './types';

const shouldInviteChannel = (session: SessionState) => {
  if (!session.lastInviteAt) {
    return true;
  }
  return Date.now() - new Date(session.lastInviteAt).getTime() >= CHANNEL_INVITE_COOLDOWN_MS;
};

export const evaluateRules = async (
  env: Env,
  context: BusinessContext,
  params: {
    intent: IntentResult;
    session: SessionState;
    messageText: string;
    messageType: string;
    currentFlow: ReservationFlowRecord | null;
    fallbackCustomerName: string | null;
    phoneE164: string;
    profileEmail?: string | null;
  },
): Promise<RuleResult> => {
  if (params.messageType === 'unsupported') {
    return {
      intent: params.intent,
      tags: ['unsupported_message'],
      reply: {
        text: unsupportedMessageTemplate(),
        templateKey: 'unsupported_message',
        ruleName: 'unsupported_message',
        intent: params.intent.intent,
      },
    };
  }

  if (params.currentFlow || params.intent.intent === 'reserva') {
    return advanceReservationFlow(env, context, {
      currentFlow: params.currentFlow,
      messageText: params.messageText,
      phoneE164: params.phoneE164,
      fallbackCustomerName: params.fallbackCustomerName,
      profileEmail: params.profileEmail,
    });
  }

  if (params.intent.intent === 'humano') {
    return {
      intent: params.intent,
      tags: ['handoff_open'],
      reply: {
        text: handoffTemplate(),
        templateKey: 'handoff',
        ruleName: 'human_handoff_requested',
        intent: 'humano',
      },
      openHandoff: {
        reason: 'Cliente pediu atendimento humano.',
        priority: 'normal',
      },
      summaryHint: 'Cliente pediu atendimento humano.',
    };
  }

  if (params.intent.intent === 'reclamacao') {
    return {
      intent: params.intent,
      tags: ['complaint', 'handoff_open'],
      reply: {
        text: complaintTemplate(),
        templateKey: 'complaint',
        ruleName: 'complaint_handoff',
        intent: 'reclamacao',
      },
      openHandoff: {
        reason: 'Reclamacao recebida pelo WhatsApp.',
        priority: 'urgent',
      },
      summaryHint: 'Reclamacao registrada e encaminhada para humano.',
    };
  }

  if (params.intent.intent === 'evento') {
    return {
      intent: params.intent,
      tags: ['event_lead', 'handoff_open'],
      reply: {
        text: eventTemplate(),
        templateKey: 'event_handoff',
        ruleName: 'event_handoff',
        intent: 'evento',
      },
      openHandoff: {
        reason: 'Lead de evento/comemoracao.',
        priority: 'high',
      },
      summaryHint: 'Lead de evento encaminhado para atendimento humano.',
    };
  }

  if (params.intent.intent === 'menu') {
    return {
      intent: params.intent,
      tags: ['menu_interest'],
      reply: {
        text: menuTemplate(context, shouldInviteChannel(params.session)),
        templateKey: 'menu',
        ruleName: 'menu_link',
        intent: 'menu',
      },
    };
  }

  if (params.intent.intent === 'delivery') {
    return {
      intent: params.intent,
      tags: ['delivery_interest'],
      reply: {
        text: deliveryTemplate(context, shouldInviteChannel(params.session)),
        templateKey: 'delivery',
        ruleName: 'delivery_link',
        intent: 'delivery',
      },
    };
  }

  if (params.intent.intent === 'hamburguer') {
    return {
      intent: params.intent,
      tags: ['burger_interest'],
      reply: {
        text: burgerTemplate(context, shouldInviteChannel(params.session)),
        templateKey: 'burger',
        ruleName: 'burger_link',
        intent: 'hamburguer',
      },
    };
  }

  if (params.intent.intent === 'marmita') {
    return {
      intent: params.intent,
      tags: ['marmita_interest'],
      reply: {
        text: marmitaTemplate(context, shouldInviteChannel(params.session)),
        templateKey: 'marmita',
        ruleName: 'marmita_link',
        intent: 'marmita',
      },
    };
  }

  if (params.intent.intent === 'localizacao') {
    return {
      intent: params.intent,
      tags: ['location_interest'],
      reply: {
        text: locationTemplate(context),
        templateKey: 'location',
        ruleName: 'location_info',
        intent: 'localizacao',
      },
    };
  }

  if (params.intent.intent === 'horarios') {
    return {
      intent: params.intent,
      tags: ['hours_interest'],
      reply: {
        text: hoursTemplate(context),
        templateKey: 'hours',
        ruleName: 'hours_info',
        intent: 'horarios',
      },
    };
  }

  const groundedReply = await generateGroundedReplyWithAi(env, context, params.messageText);
  if (groundedReply) {
    return {
      intent: params.intent,
      tags: ['ai_grounded_reply'],
      reply: {
        text: groundedReply,
        templateKey: 'ai_grounded_reply',
        ruleName: 'ai_grounded_reply',
        intent: params.intent.intent,
        aiModel: getAiModelName(env),
      },
      summaryHint: `Resposta assistida por IA para intent ${params.intent.intent}.`,
    };
  }

  const nextFallbackCount = params.session.fallbackCount + 1;
  if (nextFallbackCount >= HUMAN_HANDOFF_FALLBACK_THRESHOLD) {
    return {
      intent: params.intent,
      tags: ['unknown_intent', 'handoff_open'],
      reply: {
        text: `${unknownTemplate()} ${handoffTemplate()}`,
        templateKey: 'unknown_handoff',
        ruleName: 'unknown_handoff',
        intent: 'unknown',
      },
      openHandoff: {
        reason: 'Baixa confianca apos repetidas tentativas.',
        priority: 'normal',
      },
      summaryHint: 'Baixa confianca; conversa encaminhada para humano.',
    };
  }

  return {
    intent: params.intent,
    tags: ['unknown_intent'],
    reply: {
      text: unknownTemplate(),
      templateKey: 'unknown',
      ruleName: 'unknown_reply',
      intent: 'unknown',
    },
  };
};
