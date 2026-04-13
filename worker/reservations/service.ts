import { getRequestIp } from '../lib/http';
import { generateId } from '../lib/security';
import { createGoogleCalendarEvent } from '../services/google/calendarService';
import { sendAdConversion } from '../services/google/adsService';
import type { Env } from '../types';
import { MEAL_PERIOD_LABELS } from './constants';
import { sendCustomerReservationCopy, sendRestaurantReservationNotification } from './email';
import {
  findReservationByCode,
  insertReservation,
  insertReservationLog,
  listReservations as listReservationRecords,
  toPublicSummary,
  updateReservationCalendarEvent,
  updateReservationStatus,
} from './repository';
import type {
  ReservationAttributionData,
  ReservationListFilters,
  ReservationPublicSummary,
  ReservationRecord,
  ReservationRequestPayload,
  ReservationStatus,
} from './types';
import { validateReservationPayload } from './validation';

const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'utm_id',
  'gclid',
  'fbclid',
  'wbraid',
  'gbraid',
  'fbp',
  'fbc',
  'page_path',
  'page_location',
  'referrer',
] as const;

const sanitizeAttribution = (value: unknown): ReservationAttributionData | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const source = value as Record<string, unknown>;
  const attribution: ReservationAttributionData = {};

  for (const key of ATTRIBUTION_KEYS) {
    const rawValue = source[key];

    if (typeof rawValue !== 'string') {
      continue;
    }

    const sanitizedValue = rawValue.trim().slice(0, 500);

    if (sanitizedValue) {
      attribution[key] = sanitizedValue;
    }
  }

  return Object.keys(attribution).length > 0 ? attribution : undefined;
};

const randomCodeChunk = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return [...bytes].map((value) => alphabet[value % alphabet.length]).join('');
};

const generateReservationCode = (reservationDate: string) => {
  const compactDate = reservationDate.replace(/-/g, '').slice(2);
  return `RSV-${compactDate}-${randomCodeChunk()}`;
};

const buildCalendarSummary = (customerFullName: string, guestCount: number) => `Reserva Cuiabar - ${customerFullName} - ${guestCount} pessoas`;

const buildCalendarDescription = (reservation: ReservationRecord) =>
  [
    `Codigo da reserva: ${reservation.reservationCode}`,
    `Cliente: ${reservation.customerFullName}`,
    `Reserva para: ${reservation.reservationForType === 'self' ? 'Ele mesmo' : 'Outra pessoa'}`,
    `Nome principal da reserva: ${reservation.reservedPersonName ?? 'Nao informado'}`,
    `Data: ${reservation.reservationDate}`,
    `Horario: ${reservation.reservationTime}`,
    `Periodo: ${MEAL_PERIOD_LABELS[reservation.mealPeriod]}`,
    `Quantidade de pessoas: ${reservation.guestCountMode === 'approximate' ? `Aproximadamente ${reservation.guestCount}` : reservation.guestCount}`,
    `Criancas: ${reservation.hasChildren ? 'Sim' : 'Nao'}`,
    `Restricao alimentar: ${reservation.dietaryRestrictionType}${reservation.dietaryRestrictionNotes ? ` (${reservation.dietaryRestrictionNotes})` : ''}`,
    `Lugar: ${reservation.seatingPreference}`,
    `WhatsApp: ${reservation.whatsappNumber}`,
    `E-mail: ${reservation.email ?? 'Nao informado'}`,
    `Ja e cliente: ${reservation.isExistingCustomer ? 'Sim' : 'Nao'}`,
    `Origem: ${reservation.discoverySource ?? 'Nao informado'}`,
    `Observacoes: ${reservation.notes ?? 'Sem observacoes adicionais'}`,
    `Politica de tolerancia: ${reservation.tolerancePolicyText}`,
  ].join('\n');

const generateUniqueReservationCode = async (env: Env, reservationDate: string) => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const nextCode = generateReservationCode(reservationDate);
    const existing = await findReservationByCode(env, nextCode);
    if (!existing) {
      return nextCode;
    }
  }

  throw new Error('Nao foi possivel gerar um codigo unico para a reserva.');
};

export const createReservation = async (env: Env, request: Request, payload: ReservationRequestPayload): Promise<ReservationPublicSummary> => {
  const normalized = validateReservationPayload(payload);
  const attribution = sanitizeAttribution(payload.attribution);
  const reservationCode = await generateUniqueReservationCode(env, normalized.reservationDate);
  const reservation = await insertReservation(env, {
    ...normalized,
    id: generateId('rsv'),
    reservationCode,
    requestIp: getRequestIp(request),
    userAgent: request.headers.get('user-agent'),
  });

  await insertReservationLog(env, reservation.id, 'reservation.created', 'success', {
    reservationCode: reservation.reservationCode,
    guestCount: reservation.guestCount,
    reservationDate: reservation.reservationDate,
    reservationTime: reservation.reservationTime,
    attribution: attribution ?? null,
  });

  if (attribution?.gclid) {
    try {
      // Not awaiting this intentionally to avoid blocking the reservation response
      sendAdConversion(env, attribution.gclid, reservation.reservationCode, 1, new Date());
    } catch (error) {
      console.error('Failed to send Google Ads conversion in createReservation:', error);
    }
  }

  try {
    const calendarEvent = await createGoogleCalendarEvent(env, {
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime,
      summary: buildCalendarSummary(reservation.customerFullName, reservation.guestCount),
      description: buildCalendarDescription(reservation),
      attendeeEmail: reservation.email,
    });
    await updateReservationCalendarEvent(env, reservation.id, calendarEvent.id!);
    await insertReservationLog(env, reservation.id, 'google_calendar.create', 'success', {
      eventId: calendarEvent.id,
      htmlLink: calendarEvent.htmlLink ?? null,
    });
  } catch (error) {
    console.error('reservation_google_calendar_error', error);
    await insertReservationLog(env, reservation.id, 'google_calendar.create', 'failure', {
      message: error instanceof Error ? error.message : 'Falha ao criar evento no Google Calendar.',
    });
  }

  try {
    const restaurantNotification = await sendRestaurantReservationNotification(env, reservation);
    await insertReservationLog(env, reservation.id, 'email.restaurant', 'success', {
      messageId: restaurantNotification.id,
    });
  } catch (error) {
    console.error('reservation_restaurant_email_error', error);
    await insertReservationLog(env, reservation.id, 'email.restaurant', 'failure', {
      message: error instanceof Error ? error.message : 'Falha ao enviar o aviso para o restaurante.',
    });
  }

  if (reservation.email) {
    try {
      const customerCopy = await sendCustomerReservationCopy(env, reservation);
      await insertReservationLog(env, reservation.id, 'email.customer', 'success', {
        messageId: customerCopy?.id ?? null,
      });
    } catch (error) {
      console.error('reservation_customer_email_error', error);
      await insertReservationLog(env, reservation.id, 'email.customer', 'failure', {
        message: error instanceof Error ? error.message : 'Falha ao enviar a copia para o cliente.',
      });
    }
  }

  return toPublicSummary(reservation);
};

export const listReservations = (env: Env, filters: ReservationListFilters) => listReservationRecords(env, filters);

export const changeReservationStatus = async (env: Env, reservationId: string, status: ReservationStatus, actorEmail: string) => {
  await updateReservationStatus(env, reservationId, status);
  await insertReservationLog(env, reservationId, 'reservation.status_update', 'success', {
    status,
    actorEmail,
  });
};
