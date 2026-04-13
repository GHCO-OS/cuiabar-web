import { HttpError } from '../lib/http';
import type { Env } from '../types';
import { createReservation } from '../reservations/service';
import { findReservationByCode } from '../reservations/repository';
import { formatReservationDateLabel } from '../reservations/validation';
import { LARGE_PARTY_GUEST_THRESHOLD } from './constants';
import {
  handoffTemplate,
  reservationAskGuestCountTemplate,
  reservationAskNameTemplate,
  reservationAskNotesTemplate,
  reservationAskTimeTemplate,
  reservationConfirmTemplate,
  reservationStartTemplate,
  reservationSuccessTemplate,
} from './templates';
import type { BusinessContext, ReservationFlowRecord, RuleResult } from './types';
import { isFullName, sanitizeMessageText } from './utils';

const RESERVATION_TIMEZONE = 'America/Sao_Paulo';
const CANCEL_WORDS = ['cancelar', 'desistir', 'parar'];
const CONFIRM_WORDS = ['confirmar', 'confirmo', 'sim', 'ok', 'certo'];

const getSaoPauloToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: RESERVATION_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${read('year')}-${read('month')}-${read('day')}`;
};

const addDays = (dateIso: string, days: number) => {
  const [year, month, day] = dateIso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const parseDateInput = (value: string) => {
  const normalized = sanitizeMessageText(value).toLowerCase();
  const today = getSaoPauloToday();

  if (normalized.includes('amanh')) {
    return addDays(today, 1);
  }

  if (normalized.includes('hoje')) {
    return today;
  }

  const isoMatch = normalized.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    return isoMatch[1];
  }

  const brMatch = normalized.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}))?\b/);
  if (!brMatch) {
    return null;
  }

  const year = brMatch[3] ? Number(brMatch[3]) : Number(today.slice(0, 4));
  const month = Number(brMatch[2]);
  const day = Number(brMatch[1]);

  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (iso < today && !brMatch[3]) {
    return `${year + 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return iso;
};

const parseTimeInput = (value: string, allowed: string[]) => {
  const normalized = sanitizeMessageText(value).toLowerCase();
  const match = normalized.match(/\b(\d{1,2})(?::?(\d{2}))?\b/);
  if (!match) {
    return null;
  }

  const hours = String(Number(match[1])).padStart(2, '0');
  const minutes = match[2] ? String(Number(match[2])).padStart(2, '0') : '00';
  const formatted = `${hours}:${minutes}`;
  return allowed.includes(formatted) ? formatted : null;
};

const parseGuestCount = (value: string) => {
  const match = sanitizeMessageText(value).match(/\b(\d{1,2})\b/);
  if (!match) {
    return null;
  }
  const guestCount = Number(match[1]);
  return Number.isInteger(guestCount) && guestCount > 0 ? guestCount : null;
};

const buildReservationSummary = (params: { customerName: string; reservationDate: string; reservationTime: string; guestCount: number; notes: string | null }) =>
  [
    `Nome: ${params.customerName}`,
    `Data: ${formatReservationDateLabel(params.reservationDate)}`,
    `Horario: ${params.reservationTime}`,
    `Pessoas: ${params.guestCount}`,
    `Observacoes: ${params.notes ?? 'Sem observacoes'}`,
  ].join('\n');

const buildReservationPayload = (params: {
  customerName: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  notes: string | null;
  phoneE164: string;
  email?: string | null;
}) => ({
  customerFullName: params.customerName,
  reservationForType: 'self',
  guestCount: params.guestCount,
  guestCountMode: 'exact',
  hasChildren: false,
  dietaryRestrictionType: 'none',
  seatingPreference: 'no_preference',
  whatsappNumber: params.phoneE164,
  email: params.email ?? null,
  reservationTime: params.reservationTime,
  reservationDate: params.reservationDate,
  isExistingCustomer: true,
  notes: params.notes ? `Via WhatsApp AI: ${params.notes}` : 'Via WhatsApp AI.',
});

const wantsCancel = (text: string) => CANCEL_WORDS.some((word) => sanitizeMessageText(text).toLowerCase().includes(word));
const wantsConfirm = (text: string) => CONFIRM_WORDS.includes(sanitizeMessageText(text).toLowerCase());

export const advanceReservationFlow = async (
  env: Env,
  context: BusinessContext,
  params: {
    currentFlow: ReservationFlowRecord | null;
    messageText: string;
    phoneE164: string;
    fallbackCustomerName: string | null;
    profileEmail?: string | null;
  },
): Promise<RuleResult> => {
  const text = sanitizeMessageText(params.messageText);
  if (params.currentFlow && wantsCancel(text)) {
    return {
      intent: { intent: 'reserva', confidence: 1, matchedKeywords: ['cancelar'], source: 'rule' },
      tags: ['reservation_cancelled'],
      reply: {
        text: 'Tudo certo. Cancelei este fluxo de reserva por aqui. Se quiser reabrir, e so me dizer a nova data desejada.',
        templateKey: 'reservation.cancelled',
        ruleName: 'reservation_cancelled',
        intent: 'reserva',
      },
      reservationFlowUpdate: {
        status: 'cancelled',
        completedAt: new Date().toISOString(),
      },
      summaryHint: 'Fluxo de reserva cancelado pelo cliente.',
    };
  }

  if (!params.currentFlow) {
    return {
      intent: { intent: 'reserva', confidence: 0.99, matchedKeywords: ['reserva'], source: 'rule' },
      tags: ['reservation_started'],
      reply: {
        text: reservationStartTemplate(context),
        templateKey: 'reservation.start',
        ruleName: 'reservation_start',
        intent: 'reserva',
      },
      reservationFlowUpdate: {
        status: 'collecting',
        currentStep: 'date',
      },
      summaryHint: 'Fluxo de reserva iniciado.',
    };
  }

  if (params.currentFlow.current_step === 'date') {
    const reservationDate = parseDateInput(text);
    if (!reservationDate) {
      return {
        intent: { intent: 'reserva', confidence: 0.98, matchedKeywords: ['data'], source: 'rule' },
        tags: ['reservation_collecting'],
        reply: {
          text: 'Nao consegui entender a data. Me envie no formato dia/mes ou ano-mes-dia, por exemplo 18/04 ou 2026-04-18.',
          templateKey: 'reservation.ask_date',
          ruleName: 'reservation_date_retry',
          intent: 'reserva',
        },
        reservationFlowUpdate: {
          status: 'collecting',
          currentStep: 'date',
        },
      };
    }

    return {
      intent: { intent: 'reserva', confidence: 0.99, matchedKeywords: ['data'], source: 'rule' },
      tags: ['reservation_collecting'],
      reply: {
        text: reservationAskTimeTemplate(context, formatReservationDateLabel(reservationDate)),
        templateKey: 'reservation.ask_time',
        ruleName: 'reservation_date_captured',
        intent: 'reserva',
      },
      reservationFlowUpdate: {
        status: 'collecting',
        currentStep: 'time',
        reservationDate,
      },
    };
  }

  if (params.currentFlow.current_step === 'time') {
    const reservationTime = parseTimeInput(text, context.reservationTimeOptions);
    if (!reservationTime) {
      return {
        intent: { intent: 'reserva', confidence: 0.98, matchedKeywords: ['horario'], source: 'rule' },
        tags: ['reservation_collecting'],
        reply: {
          text: `Nao reconheci o horario. Os horarios disponiveis sao ${context.reservationTimeOptions.join(', ')}.`,
          templateKey: 'reservation.ask_time_retry',
          ruleName: 'reservation_time_retry',
          intent: 'reserva',
        },
        reservationFlowUpdate: {
          status: 'collecting',
          currentStep: 'time',
        },
      };
    }

    return {
      intent: { intent: 'reserva', confidence: 0.99, matchedKeywords: ['horario'], source: 'rule' },
      tags: ['reservation_collecting'],
      reply: {
        text: reservationAskGuestCountTemplate(),
        templateKey: 'reservation.ask_guest_count',
        ruleName: 'reservation_time_captured',
        intent: 'reserva',
      },
      reservationFlowUpdate: {
        status: 'collecting',
        currentStep: 'guest_count',
        reservationTime,
      },
    };
  }

  if (params.currentFlow.current_step === 'guest_count') {
    const guestCount = parseGuestCount(text);
    if (!guestCount) {
      return {
        intent: { intent: 'reserva', confidence: 0.98, matchedKeywords: ['pessoas'], source: 'rule' },
        tags: ['reservation_collecting'],
        reply: {
          text: 'Me passe a quantidade de pessoas em numero, por exemplo 4.',
          templateKey: 'reservation.ask_guest_count_retry',
          ruleName: 'reservation_guest_count_retry',
          intent: 'reserva',
        },
        reservationFlowUpdate: {
          status: 'collecting',
          currentStep: 'guest_count',
        },
      };
    }

    if (guestCount > LARGE_PARTY_GUEST_THRESHOLD) {
      return {
        intent: { intent: 'reserva', confidence: 1, matchedKeywords: ['grupo'], source: 'rule' },
        tags: ['reservation_large_party', 'handoff_open'],
        reply: {
          text: handoffTemplate(),
          templateKey: 'reservation.large_party_handoff',
          ruleName: 'reservation_large_party',
          intent: 'reserva',
        },
        openHandoff: {
          reason: `Reserva para grupo com ${guestCount} pessoas.`,
          priority: 'high',
          notes: 'Fluxo de reserva transferido para humano por grupo grande.',
        },
        reservationFlowUpdate: {
          status: 'handoff',
          guestCount,
          completedAt: new Date().toISOString(),
        },
        summaryHint: `Reserva para grupo grande (${guestCount} pessoas) encaminhada para humano.`,
      };
    }

    return {
      intent: { intent: 'reserva', confidence: 0.99, matchedKeywords: ['pessoas'], source: 'rule' },
      tags: ['reservation_collecting'],
      reply: {
        text: reservationAskNotesTemplate(),
        templateKey: 'reservation.ask_notes',
        ruleName: 'reservation_guest_count_captured',
        intent: 'reserva',
      },
      reservationFlowUpdate: {
        status: 'collecting',
        currentStep: 'notes',
        guestCount,
      },
    };
  }

  if (params.currentFlow.current_step === 'notes') {
    const notes = /sem observ/i.test(text) ? null : sanitizeMessageText(text, 400);
    const candidateName = params.currentFlow.customer_name ?? params.fallbackCustomerName;

    if (!isFullName(candidateName)) {
      return {
        intent: { intent: 'reserva', confidence: 0.99, matchedKeywords: ['nome'], source: 'rule' },
        tags: ['reservation_collecting'],
        reply: {
          text: reservationAskNameTemplate(),
          templateKey: 'reservation.ask_name',
          ruleName: 'reservation_notes_captured_missing_name',
          intent: 'reserva',
        },
        reservationFlowUpdate: {
          status: 'collecting',
          currentStep: 'name',
          notes,
        },
      };
    }

    const summary = buildReservationSummary({
      customerName: candidateName!,
      reservationDate: params.currentFlow.reservation_date!,
      reservationTime: params.currentFlow.reservation_time!,
      guestCount: params.currentFlow.guest_count!,
      notes,
    });

    return {
      intent: { intent: 'reserva', confidence: 1, matchedKeywords: ['confirmacao'], source: 'rule' },
      tags: ['reservation_ready'],
      reply: {
        text: reservationConfirmTemplate(summary),
        templateKey: 'reservation.confirm',
        ruleName: 'reservation_notes_captured',
        intent: 'reserva',
      },
      reservationFlowUpdate: {
        status: 'ready',
        currentStep: 'confirm',
        notes,
        customerName: candidateName,
      },
      summaryHint: 'Reserva pronta para confirmacao.',
    };
  }

  if (params.currentFlow.current_step === 'name') {
    if (!isFullName(text)) {
      return {
        intent: { intent: 'reserva', confidence: 0.99, matchedKeywords: ['nome'], source: 'rule' },
        tags: ['reservation_collecting'],
        reply: {
          text: 'Preciso de nome e sobrenome para confirmar a reserva.',
          templateKey: 'reservation.ask_name_retry',
          ruleName: 'reservation_name_retry',
          intent: 'reserva',
        },
        reservationFlowUpdate: {
          status: 'collecting',
          currentStep: 'name',
        },
      };
    }

    const summary = buildReservationSummary({
      customerName: text,
      reservationDate: params.currentFlow.reservation_date!,
      reservationTime: params.currentFlow.reservation_time!,
      guestCount: params.currentFlow.guest_count!,
      notes: params.currentFlow.notes,
    });

    return {
      intent: { intent: 'reserva', confidence: 1, matchedKeywords: ['nome'], source: 'rule' },
      tags: ['reservation_ready'],
      reply: {
        text: reservationConfirmTemplate(summary),
        templateKey: 'reservation.confirm',
        ruleName: 'reservation_name_captured',
        intent: 'reserva',
      },
      reservationFlowUpdate: {
        status: 'ready',
        currentStep: 'confirm',
        customerName: text,
      },
      summaryHint: 'Reserva pronta para confirmacao.',
    };
  }

  if (!wantsConfirm(text)) {
    return {
      intent: { intent: 'reserva', confidence: 0.92, matchedKeywords: ['ajuste'], source: 'rule' },
      tags: ['reservation_ready'],
      reply: {
        text: 'Se quiser ajustar, me diga qual campo precisa mudar: data, horario, pessoas ou observacoes.',
        templateKey: 'reservation.confirm_retry',
        ruleName: 'reservation_confirm_retry',
        intent: 'reserva',
      },
      reservationFlowUpdate: {
        status: 'ready',
        currentStep: 'confirm',
      },
    };
  }

  if (
    !params.currentFlow.customer_name ||
    !params.currentFlow.reservation_date ||
    !params.currentFlow.reservation_time ||
    !params.currentFlow.guest_count
  ) {
    throw new HttpError(500, 'Fluxo de reserva incompleto para confirmacao.');
  }

  const created = await createReservation(
    env,
    new Request('https://crm.cuiabar.com/api/internal/whatsapp/reservation', {
      headers: {
        'user-agent': 'whatsapp-ai-worker',
      },
    }),
    buildReservationPayload({
      customerName: params.currentFlow.customer_name,
      reservationDate: params.currentFlow.reservation_date,
      reservationTime: params.currentFlow.reservation_time,
      guestCount: params.currentFlow.guest_count,
      notes: params.currentFlow.notes,
      phoneE164: params.phoneE164,
      email: params.profileEmail ?? null,
    }),
  );

  const createdRecord = await findReservationByCode(env, created.reservationCode);

  return {
    intent: { intent: 'reserva', confidence: 1, matchedKeywords: ['confirmar'], source: 'rule' },
    tags: ['reservation_submitted'],
    reply: {
      text: reservationSuccessTemplate(created.reservationCode, created.reservationDateLabel, created.reservationTime, created.guestCount),
      templateKey: 'reservation.success',
      ruleName: 'reservation_confirmed',
      intent: 'reserva',
    },
    reservationFlowUpdate: {
      status: 'submitted',
      currentStep: 'confirm',
      reservationId: createdRecord?.id ?? null,
      reservationCode: created.reservationCode,
      completedAt: new Date().toISOString(),
    },
    summaryHint: `Reserva enviada com sucesso. Codigo ${created.reservationCode}.`,
  };
};
