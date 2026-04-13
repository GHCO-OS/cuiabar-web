import { getGoogleAccessToken } from '../gmail/gmailAuth';
import { RESERVATION_DURATION_HOURS, RESERVATION_TIMEZONE } from '../../reservations/constants';
const buildDateTime = (reservationDate, reservationTime, durationHours = 0) => {
    const [hourText, minuteText] = reservationTime.split(':');
    const hour = Number(hourText) + durationHours;
    const normalizedHour = String(hour).padStart(2, '0');
    return `${reservationDate}T${durationHours === 0 ? hourText : normalizedHour}:${minuteText}:00-03:00`;
};
export const createGoogleCalendarEvent = async (env, payload) => {
    if (!env.GOOGLE_CALENDAR_ID) {
        throw new Error('GOOGLE_CALENDAR_ID nao configurado.');
    }
    const accessToken = await getGoogleAccessToken(env);
    const sendUpdates = payload.attendeeEmail ? 'all' : 'none';
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.GOOGLE_CALENDAR_ID)}/events?sendUpdates=${sendUpdates}`, {
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
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Falha ao criar evento no Google Calendar: ${response.status} ${text.slice(0, 500)}`);
    }
    const result = (await response.json());
    if (!result.id) {
        throw new Error('Google Calendar nao retornou o identificador do evento.');
    }
    return result;
};
