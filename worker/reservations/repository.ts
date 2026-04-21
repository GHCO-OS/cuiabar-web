import { all, asJson, first, nowIso, run } from '../lib/db';
import { generateId } from '../lib/security';
import type { Env } from '../types';
import type {
  NormalizedReservationInput,
  ReservationListFilters,
  ReservationListItem,
  ReservationLogStatus,
  ReservationPublicSummary,
  ReservationRecord,
  ReservationStatus,
} from './types';
import { formatReservationDateLabel } from './validation';

type InsertReservationParams = NormalizedReservationInput & {
  id: string;
  reservationCode: string;
  googleCalendarEventId?: string | null;
  status?: ReservationStatus;
  requestIp?: string | null;
  userAgent?: string | null;
};

const mapReservationRecord = (row: ReservationListItem): ReservationRecord => ({
  id: row.id,
  reservationCode: row.reservation_code,
  reservationDate: row.reservation_date,
  reservationTime: row.reservation_time,
  mealPeriod: row.meal_period,
  customerFullName: row.customer_full_name,
  reservationForType: row.reservation_for_type,
  reservedPersonName: row.reserved_person_name,
  guestCount: row.guest_count,
  guestCountMode: row.guest_count_mode,
  hasChildren: row.has_children === 1,
  dietaryRestrictionType: row.dietary_restriction_type,
  dietaryRestrictionNotes: row.dietary_restriction_notes,
  seatingPreference: row.seating_preference,
  whatsappNumber: row.whatsapp_number,
  email: row.email,
  isExistingCustomer: row.is_existing_customer === 1,
  discoverySource: row.discovery_source,
  notes: row.notes,
  tolerancePolicyText: row.tolerance_policy_text,
  googleCalendarEventId: row.google_calendar_event_id,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toPublicSummary = (record: ReservationRecord): ReservationPublicSummary => ({
  reservationCode: record.reservationCode,
  reservationDate: record.reservationDate,
  reservationDateLabel: formatReservationDateLabel(record.reservationDate),
  reservationTime: record.reservationTime,
  mealPeriod: record.mealPeriod,
  guestCount: record.guestCount,
  guestCountMode: record.guestCountMode,
  customerFullName: record.customerFullName,
  reservedPersonName: record.reservedPersonName,
  hasChildren: record.hasChildren,
  dietaryRestrictionType: record.dietaryRestrictionType,
  dietaryRestrictionNotes: record.dietaryRestrictionNotes,
  seatingPreference: record.seatingPreference,
  whatsappNumber: record.whatsappNumber,
  email: record.email,
  isExistingCustomer: record.isExistingCustomer,
  discoverySource: record.discoverySource,
  notes: record.notes,
  tolerancePolicyText: record.tolerancePolicyText,
});

export const findReservationByCode = async (env: Env, reservationCode: string) => {
  const row = await first<ReservationListItem>(env.DB.prepare('SELECT * FROM reservations WHERE reservation_code = ?').bind(reservationCode));
  return row ? mapReservationRecord(row) : null;
};

export const findReservationById = async (env: Env, reservationId: string) => {
  const row = await first<ReservationListItem>(env.DB.prepare('SELECT * FROM reservations WHERE id = ?').bind(reservationId));
  return row ? mapReservationRecord(row) : null;
};

export const insertReservation = async (env: Env, reservation: InsertReservationParams) => {
  const timestamp = nowIso();
  await run(
    env.DB.prepare(
      `INSERT INTO reservations (
        id,
        reservation_code,
        reservation_date,
        reservation_time,
        meal_period,
        customer_full_name,
        reservation_for_type,
        reserved_person_name,
        guest_count,
        guest_count_mode,
        has_children,
        dietary_restriction_type,
        dietary_restriction_notes,
        seating_preference,
        whatsapp_number,
        email,
        is_existing_customer,
        discovery_source,
        notes,
        tolerance_policy_text,
        google_calendar_event_id,
        status,
        request_ip,
        user_agent,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      reservation.id,
      reservation.reservationCode,
      reservation.reservationDate,
      reservation.reservationTime,
      reservation.mealPeriod,
      reservation.customerFullName,
      reservation.reservationForType,
      reservation.reservedPersonName,
      reservation.guestCount,
      reservation.guestCountMode,
      reservation.hasChildren ? 1 : 0,
      reservation.dietaryRestrictionType,
      reservation.dietaryRestrictionNotes,
      reservation.seatingPreference,
      reservation.whatsappNumber,
      reservation.email,
      reservation.isExistingCustomer ? 1 : 0,
      reservation.discoverySource,
      reservation.notes,
      reservation.tolerancePolicyText,
      reservation.googleCalendarEventId ?? null,
      reservation.status ?? 'pending',
      reservation.requestIp ?? null,
      reservation.userAgent ?? null,
      timestamp,
      timestamp,
    ),
  );

  return {
    ...reservation,
    googleCalendarEventId: reservation.googleCalendarEventId ?? null,
    status: reservation.status ?? 'pending',
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies ReservationRecord;
};

export const updateReservationCalendarEvent = async (env: Env, reservationId: string, googleCalendarEventId: string) => {
  await run(env.DB.prepare('UPDATE reservations SET google_calendar_event_id = ?, updated_at = ? WHERE id = ?').bind(googleCalendarEventId, nowIso(), reservationId));
};

export const updateReservationStatus = async (env: Env, reservationId: string, status: ReservationStatus) => {
  await run(env.DB.prepare('UPDATE reservations SET status = ?, updated_at = ? WHERE id = ?').bind(status, nowIso(), reservationId));
};

export const insertReservationLog = async (
  env: Env,
  reservationId: string,
  eventType: string,
  status: ReservationLogStatus,
  details: Record<string, unknown>,
) => {
  await run(
    env.DB.prepare(
      `INSERT INTO reservation_logs (id, reservation_id, event_type, status, details_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(generateId('rlog'), reservationId, eventType, status, asJson(details), nowIso()),
  );
};

export const listReservations = async (env: Env, filters: ReservationListFilters) => {
  const statements: string[] = [];
  const bindings: Array<string | number | null> = [];

  if (filters.reservationDate) {
    statements.push('reservation_date = ?');
    bindings.push(filters.reservationDate);
  }

  if (filters.status) {
    statements.push('status = ?');
    bindings.push(filters.status);
  }

  if (filters.query) {
    const query = `%${filters.query.trim().toLowerCase()}%`;
    statements.push('(LOWER(customer_full_name) LIKE ? OR LOWER(whatsapp_number) LIKE ? OR LOWER(COALESCE(email, "")) LIKE ? OR LOWER(reservation_code) LIKE ?)');
    bindings.push(query, query, query, query);
  }

  const whereClause = statements.length > 0 ? `WHERE ${statements.join(' AND ')}` : '';
  const rows = await all<ReservationListItem>(
    env.DB.prepare(`SELECT * FROM reservations ${whereClause} ORDER BY reservation_date ASC, reservation_time ASC, created_at DESC LIMIT 300`).bind(...bindings),
  );

  return rows.map((row) => mapReservationRecord(row));
};
