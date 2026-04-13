import type { NormalizedReservationInput, ReservationRequestPayload, ReservationTime } from './types';
export declare const getMealPeriodFromTime: (reservationTime: ReservationTime) => import("./types").MealPeriod;
export declare const formatReservationDateLabel: (value: string) => string;
export declare const validateReservationPayload: (payload: ReservationRequestPayload) => NormalizedReservationInput;
