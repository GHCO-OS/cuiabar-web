import { HttpError } from '../lib/http';
import { DIETARY_RESTRICTION_TYPES, DISCOVERY_SOURCES, FULL_TOLERANCE_POLICY, GUEST_COUNT_MODES, LARGE_PARTY_TOLERANCE_POLICY, RESERVATION_FOR_TYPES, RESERVATION_TIME_OPTIONS, RESERVATION_TIMEZONE, SEATING_PREFERENCES, STANDARD_TOLERANCE_POLICY, } from './constants';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sanitizeSingleLine = (value, maxLength = 160) => value
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
const sanitizeMultiline = (value, maxLength = 600) => value
    .replace(/\r/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
const assertString = (value, message) => {
    if (typeof value !== 'string') {
        throw new HttpError(400, message);
    }
    return value;
};
const assertBoolean = (value, message) => {
    if (typeof value !== 'boolean') {
        throw new HttpError(400, message);
    }
    return value;
};
const getCurrentDateParts = () => {
    const dateParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: RESERVATION_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const timeParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: RESERVATION_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(new Date());
    const read = (parts, type) => parts.find((entry) => entry.type === type)?.value ?? '';
    return {
        date: `${read(dateParts, 'year')}-${read(dateParts, 'month')}-${read(dateParts, 'day')}`,
        time: `${read(timeParts, 'hour')}:${read(timeParts, 'minute')}`,
    };
};
const normalizeWhatsappNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) {
        return `+55${digits}`;
    }
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
        return `+${digits}`;
    }
    throw new HttpError(400, 'Informe um WhatsApp valido com DDD.');
};
const normalizeEmail = (value) => {
    if (!value) {
        return null;
    }
    const email = value.trim().toLowerCase();
    if (!email) {
        return null;
    }
    if (!EMAIL_REGEX.test(email)) {
        throw new HttpError(400, 'Informe um e-mail valido.');
    }
    return email;
};
const isFullName = (value) => value.split(' ').filter(Boolean).length >= 2;
const assertEnum = (value, allowedValues, message) => {
    if (!allowedValues.includes(value)) {
        throw new HttpError(400, message);
    }
    return value;
};
const buildTolerancePolicy = (guestCount) => (guestCount > 10 ? LARGE_PARTY_TOLERANCE_POLICY : STANDARD_TOLERANCE_POLICY);
export const getMealPeriodFromTime = (reservationTime) => {
    const option = RESERVATION_TIME_OPTIONS.find((entry) => entry.value === reservationTime);
    if (!option) {
        throw new HttpError(400, 'Horario fora da lista permitida.');
    }
    return option.mealPeriod;
};
export const formatReservationDateLabel = (value) => new Intl.DateTimeFormat('pt-BR', {
    timeZone: RESERVATION_TIMEZONE,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
}).format(new Date(`${value}T12:00:00-03:00`));
export const validateReservationPayload = (payload) => {
    const customerFullName = sanitizeSingleLine(assertString(payload.customerFullName, 'Informe nome e sobrenome.'));
    if (!customerFullName || !isFullName(customerFullName)) {
        throw new HttpError(400, 'Informe nome e sobrenome.');
    }
    const reservationForType = assertEnum(assertString(payload.reservationForType, 'Informe para quem e a reserva.'), RESERVATION_FOR_TYPES, 'Informe para quem e a reserva.');
    const guestCount = Number(payload.guestCount);
    if (!Number.isInteger(guestCount) || guestCount <= 0) {
        throw new HttpError(400, 'Informe uma quantidade de pessoas valida.');
    }
    const guestCountMode = assertEnum(assertString(payload.guestCountMode, 'Informe se a quantidade e exata ou aproximada.'), GUEST_COUNT_MODES, 'Informe se a quantidade e exata ou aproximada.');
    const reservationDate = assertString(payload.reservationDate, 'Informe a data da reserva.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(reservationDate)) {
        throw new HttpError(400, 'Informe uma data valida.');
    }
    const reservationTime = assertEnum(assertString(payload.reservationTime, 'Informe o horario da reserva.'), RESERVATION_TIME_OPTIONS.map((entry) => entry.value), 'Horario fora da lista permitida.');
    const current = getCurrentDateParts();
    if (reservationDate < current.date) {
        throw new HttpError(400, 'A data da reserva precisa ser hoje ou uma data futura.');
    }
    if (reservationDate === current.date && reservationTime < current.time) {
        throw new HttpError(400, 'Esse horario ja passou. Escolha outro horario.');
    }
    const mealPeriod = getMealPeriodFromTime(reservationTime);
    const reservedPersonName = reservationForType === 'other' ? sanitizeSingleLine(assertString(payload.reservedPersonName, 'Informe o nome principal da reserva.')) : null;
    if (reservationForType === 'other' && (!reservedPersonName || reservedPersonName.length < 3)) {
        throw new HttpError(400, 'Informe o nome principal da reserva.');
    }
    const hasChildren = assertBoolean(payload.hasChildren, 'Informe se ha criancas na reserva.');
    const dietaryRestrictionType = assertEnum(assertString(payload.dietaryRestrictionType, 'Informe a restricao alimentar.'), DIETARY_RESTRICTION_TYPES, 'Restricao alimentar invalida.');
    const dietaryRestrictionNotes = dietaryRestrictionType === 'other' ? sanitizeSingleLine(assertString(payload.dietaryRestrictionNotes, 'Descreva a restricao alimentar.'), 180) : null;
    if (dietaryRestrictionType === 'other' && (!dietaryRestrictionNotes || dietaryRestrictionNotes.length < 3)) {
        throw new HttpError(400, 'Descreva a restricao alimentar.');
    }
    const seatingPreference = assertEnum(assertString(payload.seatingPreference, 'Informe a preferencia de lugar.'), SEATING_PREFERENCES, 'Preferencia de lugar invalida.');
    const whatsappNumber = normalizeWhatsappNumber(assertString(payload.whatsappNumber, 'Informe um WhatsApp valido com DDD.'));
    const email = payload.email == null ? null : normalizeEmail(assertString(payload.email, 'Informe um e-mail valido.'));
    const isExistingCustomer = assertBoolean(payload.isExistingCustomer, 'Informe se ja e cliente.');
    const discoverySource = !isExistingCustomer
        ? assertEnum(assertString(payload.discoverySource, 'Conte para a gente como conheceu o restaurante.'), DISCOVERY_SOURCES, 'Origem do cliente invalida.')
        : null;
    const notes = payload.notes == null ? null : sanitizeMultiline(assertString(payload.notes, 'Observacoes invalidas.'));
    return {
        customerFullName,
        reservationForType,
        reservedPersonName,
        guestCount,
        guestCountMode,
        hasChildren,
        dietaryRestrictionType,
        dietaryRestrictionNotes,
        seatingPreference,
        whatsappNumber,
        email,
        reservationTime,
        reservationDate,
        mealPeriod,
        isExistingCustomer,
        discoverySource: discoverySource,
        notes: notes || null,
        tolerancePolicyText: buildTolerancePolicy(guestCount) || FULL_TOLERANCE_POLICY,
    };
};
