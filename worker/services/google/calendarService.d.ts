import type { Env } from '../../types';
export interface GoogleCalendarReservationPayload {
    reservationDate: string;
    reservationTime: string;
    summary: string;
    description: string;
    attendeeEmail?: string | null;
}
export declare const createGoogleCalendarEvent: (env: Env, payload: GoogleCalendarReservationPayload) => Promise<{
    id?: string;
    htmlLink?: string;
}>;
