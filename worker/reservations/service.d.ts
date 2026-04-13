import type { Env } from '../types';
import type { ReservationListFilters, ReservationPublicSummary, ReservationRecord, ReservationRequestPayload, ReservationStatus } from './types';
export declare const createReservation: (env: Env, request: Request, payload: ReservationRequestPayload) => Promise<ReservationPublicSummary>;
export declare const listReservations: (env: Env, filters: ReservationListFilters) => Promise<ReservationRecord[]>;
export declare const changeReservationStatus: (env: Env, reservationId: string, status: ReservationStatus, actorEmail: string) => Promise<void>;
