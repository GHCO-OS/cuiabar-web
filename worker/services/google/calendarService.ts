import type { Env } from '../../types';
import { getGoogleAccessToken } from '../gmail/gmailAuth';
import { RESERVATION_DURATION_HOURS, RESERVATION_TIMEZONE, VILLA_CUIABAR_ADDRESS } from '../../reservations/constants';

export interface GoogleCalendarReservationPayload {
  reservationDate: string;
  reservationTime: string;
  summary: string;
  description: string;
  attendeeEmail?: string | null;
  location?: string | null;
}

export interface GoogleCalendarEventPatchPayload {
  summary?: string;
  description?: string;
  status?: 'confirmed' | 'cancelled';
  attendeeEmail?: string | null;
  location?: string | null;
}

const LEGACY_GOOGLE_CALENDAR_IDS = ['c_75606ed21bff8557257bd2e65fb18b8d9a7f10a22c0bcac9646719227e271fa3@group.calendar.google.com'];

const buildCalendarApiUrl = (calendarId: string, path: string, params?: URLSearchParams) => {
  const serializedParams = params?.toString() ?? '';
  const query = serializedParams ? `?${serializedParams}` : '';
  return `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/${path}${query}`;
};

const readGoogleErrorCode = async (response: Response) => {
  const text = await response.text();
  return {
    text,
    isNotFound: response.status === 404 && /"reason":\s*"notFound"|Not Found/i.test(text),
  };
};

const listAccessibleCalendarIds = async (accessToken: string) => {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const { text } = await readGoogleErrorCode(response);
    if (response.status === 403 && /ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficientPermissions/i.test(text)) {
      return [];
    }

    throw new Error(`Falha ao listar calendarios do Google: ${response.status} ${text.slice(0, 500)}`);
  }

  const payload = (await response.json()) as { items?: Array<{ id?: string }> };
  return (payload.items ?? []).map((item) => item.id).filter((value): value is string => Boolean(value));
};

const patchEventOnCalendar = async (
  accessToken: string,
  calendarId: string,
  eventId: string,
  payload: GoogleCalendarEventPatchPayload,
) => {
  const sendUpdates = payload.attendeeEmail ? 'all' : 'none';
  const response = await fetch(
    buildCalendarApiUrl(calendarId, `events/${encodeURIComponent(eventId)}`, new URLSearchParams({ sendUpdates })),
    {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        ...(payload.summary ? { summary: payload.summary } : {}),
        ...(payload.description ? { description: payload.description } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.location !== undefined ? { location: payload.location } : {}),
      }),
    },
  );

  if (!response.ok) {
    const errorDetails = await readGoogleErrorCode(response);
    return {
      ok: false as const,
      calendarId,
      response,
      ...errorDetails,
    };
  }

  return {
    ok: true as const,
    calendarId,
    payload: (await response.json()) as { id?: string; status?: string; htmlLink?: string },
  };
};

const buildDateTime = (reservationDate: string, reservationTime: string, durationHours = 0) => {
  const [hourText, minuteText] = reservationTime.split(':');
  const hour = Number(hourText) + durationHours;
  const normalizedHour = String(hour).padStart(2, '0');
  return `${reservationDate}T${durationHours === 0 ? hourText : normalizedHour}:${minuteText}:00-03:00`;
};

export const createGoogleCalendarEvent = async (env: Env, payload: GoogleCalendarReservationPayload) => {
  if (!env.GOOGLE_CALENDAR_ID) {
    throw new Error('GOOGLE_CALENDAR_ID nao configurado.');
  }

  const accessToken = await getGoogleAccessToken(env);
  const sendUpdates = payload.attendeeEmail ? 'all' : 'none';
  const response = await fetch(
    buildCalendarApiUrl(env.GOOGLE_CALENDAR_ID, 'events', new URLSearchParams({ sendUpdates })),
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        summary: payload.summary,
        description: payload.description,
        start: {
          dateTime: buildDateTime(payload.reservationDate, payload.reservationTime),
          timeZone: RESERVATION_TIMEZONE,
        },
        end: {
          dateTime: buildDateTime(payload.reservationDate, payload.reservationTime, RESERVATION_DURATION_HOURS),
          timeZone: RESERVATION_TIMEZONE,
        },
        location: payload.location ?? VILLA_CUIABAR_ADDRESS,
        attendees: payload.attendeeEmail ? [{ email: payload.attendeeEmail }] : [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 720 },
            { method: 'email', minutes: 300 },
            { method: 'popup', minutes: 60 },
          ],
        },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao criar evento no Google Calendar: ${response.status} ${text.slice(0, 500)}`);
  }

  const result = (await response.json()) as { id?: string; htmlLink?: string };
  if (!result.id) {
    throw new Error('Google Calendar nao retornou o identificador do evento.');
  }

  return result;
};

export const updateGoogleCalendarEvent = async (
  env: Env,
  eventId: string,
  payload: GoogleCalendarEventPatchPayload,
) => {
  if (!env.GOOGLE_CALENDAR_ID) {
    throw new Error('GOOGLE_CALENDAR_ID nao configurado.');
  }

  const accessToken = await getGoogleAccessToken(env);
  const normalizedPayload: GoogleCalendarEventPatchPayload = {
    ...payload,
    location: payload.location ?? VILLA_CUIABAR_ADDRESS,
  };

  const firstAttempt = await patchEventOnCalendar(accessToken, env.GOOGLE_CALENDAR_ID, eventId, normalizedPayload);

  if (firstAttempt.ok) {
    return firstAttempt.payload;
  }

  if (!firstAttempt.isNotFound) {
    throw new Error(`Falha ao atualizar evento no Google Calendar: ${firstAttempt.response.status} ${firstAttempt.text.slice(0, 500)}`);
  }

  const fallbackCalendarIds = [
    ...LEGACY_GOOGLE_CALENDAR_IDS,
    ...(await listAccessibleCalendarIds(accessToken)),
  ].filter((calendarId, index, list) => calendarId !== env.GOOGLE_CALENDAR_ID && list.indexOf(calendarId) === index);

  for (const calendarId of fallbackCalendarIds) {
    const attempt = await patchEventOnCalendar(accessToken, calendarId, eventId, normalizedPayload);
    if (attempt.ok) {
      return attempt.payload;
    }

    if (!attempt.isNotFound) {
      throw new Error(`Falha ao atualizar evento no Google Calendar: ${attempt.response.status} ${attempt.text.slice(0, 500)}`);
    }
  }

  throw new Error(`Falha ao atualizar evento no Google Calendar: 404 Evento ${eventId} nao encontrado nos calendarios acessiveis.`);
};
