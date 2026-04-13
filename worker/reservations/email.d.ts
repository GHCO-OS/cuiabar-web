import type { Env } from '../types';
import type { ReservationRecord } from './types';
export declare const sendRestaurantReservationNotification: (env: Env, reservation: ReservationRecord) => Promise<import("../services/gmail/gmailSender").GmailSendResult>;
export declare const sendCustomerReservationCopy: (env: Env, reservation: ReservationRecord) => Promise<import("../services/gmail/gmailSender").GmailSendResult | null>;
