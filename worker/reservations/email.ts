import { sendViaGmail } from '../services/gmail/gmailSender';
import type { Env } from '../types';
import {
  DIETARY_RESTRICTION_LABELS,
  DISCOVERY_SOURCE_LABELS,
  MEAL_PERIOD_LABELS,
  SEATING_PREFERENCE_LABELS,
} from './constants';
import type { ReservationRecord } from './types';
import { formatReservationDateLabel } from './validation';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const describeGuestCount = (reservation: ReservationRecord) =>
  reservation.guestCountMode === 'approximate' ? `Aproximadamente ${reservation.guestCount} pessoas` : `${reservation.guestCount} pessoas`;

const describeDietaryRestriction = (reservation: ReservationRecord) =>
  reservation.dietaryRestrictionType === 'other' && reservation.dietaryRestrictionNotes
    ? `Outras (${reservation.dietaryRestrictionNotes})`
    : DIETARY_RESTRICTION_LABELS[reservation.dietaryRestrictionType];

const buildDetailRows = (reservation: ReservationRecord) => [
  ['Codigo da reserva', reservation.reservationCode],
  ['Nome do cliente', reservation.customerFullName],
  ['Reserva para', reservation.reservationForType === 'self' ? 'Ele mesmo' : 'Outra pessoa'],
  ['Nome principal da reserva', reservation.reservedPersonName ?? 'Nao informado'],
  ['Data', formatReservationDateLabel(reservation.reservationDate)],
  ['Horario', reservation.reservationTime.replace(':00', 'h')],
  ['Periodo', MEAL_PERIOD_LABELS[reservation.mealPeriod]],
  ['Quantidade de pessoas', describeGuestCount(reservation)],
  ['Criancas', reservation.hasChildren ? 'Sim' : 'Nao'],
  ['Restricao alimentar', describeDietaryRestriction(reservation)],
  ['Preferencia de lugar', SEATING_PREFERENCE_LABELS[reservation.seatingPreference]],
  ['WhatsApp', reservation.whatsappNumber],
  ['E-mail', reservation.email ?? 'Nao informado'],
  ['Ja e cliente', reservation.isExistingCustomer ? 'Sim' : 'Nao'],
  ['Como conheceu', reservation.discoverySource ? DISCOVERY_SOURCE_LABELS[reservation.discoverySource] : 'Nao informado'],
  ['Observacoes', reservation.notes ?? 'Sem observacoes adicionais'],
  ['Politica de tolerancia', reservation.tolerancePolicyText],
];

const buildHtmlBody = (reservation: ReservationRecord, intro: string) => {
  const detailRows = buildDetailRows(reservation)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(51,35,19,0.08);font-weight:600;color:#332313;vertical-align:top">${escapeHtml(label)}</td><td style="padding:10px 0;border-bottom:1px solid rgba(51,35,19,0.08);color:#5f6269">${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  return `<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px;background:#f8f2e8;font-family:Georgia,serif;color:#332313"><main style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:28px;padding:32px;border:1px solid rgba(51,35,19,0.08)"><p style="margin:0 0 8px;color:#ac5427;font-size:12px;letter-spacing:.24em;text-transform:uppercase">Cuiabar Reservas</p><h1 style="margin:0 0 16px;font-size:32px;line-height:1.05">Reserva registrada</h1><p style="margin:0 0 24px;color:#5f6269;line-height:1.7">${escapeHtml(intro)}</p><table style="width:100%;border-collapse:collapse">${detailRows}</table></main></body></html>`;
};

const buildTextBody = (reservation: ReservationRecord, intro: string) =>
  ['Cuiabar Reservas', '', intro, '', ...buildDetailRows(reservation).map(([label, value]) => `${label}: ${value}`)].join('\n');

const getSenderEmail = (env: Env) => env.GMAIL_SENDER_EMAIL || env.DEFAULT_FROM_EMAIL;
const getSenderName = (env: Env) => env.GMAIL_SENDER_NAME || env.DEFAULT_FROM_NAME || 'Cuiabar';
const getReservationBaseUrl = (env: Env) => env.RESERVATION_APP_BASE_URL || env.APP_BASE_URL || 'https://reservas.cuiabar.com';

export const sendRestaurantReservationNotification = async (env: Env, reservation: ReservationRecord) => {
  const notificationEmail = env.RESERVATION_NOTIFICATION_EMAIL || 'cuiabar@cuiabar.net';
  const subject = `[Nova Reserva] ${reservation.customerFullName} - ${reservation.reservationDate} - ${reservation.reservationTime.replace(':00', 'h')}`;
  return sendViaGmail(env, {
    fromName: getSenderName(env),
    fromEmail: getSenderEmail(env),
    to: notificationEmail,
    subject,
    replyTo: reservation.email ?? env.DEFAULT_REPLY_TO ?? getSenderEmail(env),
    html: buildHtmlBody(reservation, 'Uma nova reserva foi registrada no portal oficial do Cuiabar.'),
    text: buildTextBody(reservation, 'Uma nova reserva foi registrada no portal oficial do Cuiabar.'),
    listUnsubscribeUrl: getReservationBaseUrl(env),
    headers: {
      'X-Reservation-Code': reservation.reservationCode,
    },
  });
};

export const sendCustomerReservationCopy = async (env: Env, reservation: ReservationRecord) => {
  if (!reservation.email) {
    return null;
  }

  return sendViaGmail(env, {
    fromName: getSenderName(env),
    fromEmail: getSenderEmail(env),
    to: reservation.email,
    subject: 'Sua reserva no Cuiabar foi registrada',
    replyTo: env.DEFAULT_REPLY_TO ?? getSenderEmail(env),
    html: buildHtmlBody(
      reservation,
      'Sua reserva foi registrada com sucesso. Nossa equipe ja recebeu os detalhes e o codigo abaixo pode ser usado em qualquer contato de acompanhamento.',
    ),
    text: buildTextBody(
      reservation,
      'Sua reserva foi registrada com sucesso. Nossa equipe ja recebeu os detalhes e o codigo abaixo pode ser usado em qualquer contato de acompanhamento.',
    ),
    listUnsubscribeUrl: getReservationBaseUrl(env),
    headers: {
      'X-Reservation-Code': reservation.reservationCode,
    },
  });
};

export const sendReservationCancellationEmail = async (env: Env, reservation: ReservationRecord) => {
  if (!reservation.email) {
    return null;
  }

  return sendViaGmail(env, {
    fromName: getSenderName(env),
    fromEmail: getSenderEmail(env),
    to: reservation.email,
    subject: 'Sua reserva no Cuiabar foi cancelada',
    replyTo: env.DEFAULT_REPLY_TO ?? getSenderEmail(env),
    html: buildHtmlBody(
      reservation,
      'Sua reserva foi cancelada conforme atualizacao da nossa equipe. Estaremos esperando voce em uma proxima oportunidade no Cuiabar.',
    ),
    text: buildTextBody(
      reservation,
      'Sua reserva foi cancelada conforme atualizacao da nossa equipe. Estaremos esperando voce em uma proxima oportunidade no Cuiabar.',
    ),
    listUnsubscribeUrl: getReservationBaseUrl(env),
    headers: {
      'X-Reservation-Code': reservation.reservationCode,
      'X-Reservation-Status': 'cancelled',
    },
  });
};
