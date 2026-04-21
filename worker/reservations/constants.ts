import type { DietaryRestrictionType, DiscoverySource, GuestCountMode, MealPeriod, ReservationStatus, ReservationTime, SeatingPreference } from './types';

export const RESERVATION_TIMEZONE = 'America/Sao_Paulo';
export const RESERVATION_DURATION_HOURS = 2;
export const VILLA_CUIABAR_ADDRESS = 'Villa Cuiabar - Av. Brigadeiro Rafael Tobias de Aguiar, 1121 - Jardim Aurelia - Campinas/SP';

export const RESERVATION_TIME_OPTIONS: Array<{ value: ReservationTime; label: string; mealPeriod: MealPeriod }> = [
  { value: '11:00', label: '11h', mealPeriod: 'lunch' },
  { value: '12:00', label: '12h', mealPeriod: 'lunch' },
  { value: '13:00', label: '13h', mealPeriod: 'lunch' },
  { value: '18:00', label: '18h', mealPeriod: 'dinner' },
  { value: '19:00', label: '19h', mealPeriod: 'dinner' },
  { value: '20:00', label: '20h', mealPeriod: 'dinner' },
];

export const RESERVATION_STATUSES: ReservationStatus[] = ['pending', 'confirmed', 'cancelled', 'expired', 'completed'];

export const GUEST_COUNT_MODES: GuestCountMode[] = ['exact', 'approximate'];
export const RESERVATION_FOR_TYPES = ['self', 'other'] as const;
export const DIETARY_RESTRICTION_TYPES: DietaryRestrictionType[] = ['none', 'lactose', 'vegan', 'celiac', 'other'];
export const SEATING_PREFERENCES: SeatingPreference[] = ['entry', 'middle', 'kids_space', 'stage', 'no_preference'];
export const DISCOVERY_SOURCES: DiscoverySource[] = ['google', 'social', 'referral', 'already_customer'];

export const DIETARY_RESTRICTION_LABELS: Record<DietaryRestrictionType, string> = {
  none: 'Nenhuma',
  lactose: 'Lactose',
  vegan: 'Vegano',
  celiac: 'Celiaco',
  other: 'Outras',
};

export const SEATING_PREFERENCE_LABELS: Record<SeatingPreference, string> = {
  entry: 'Entrada',
  middle: 'Meio',
  kids_space: 'Perto do espaco kids',
  stage: 'Perto do palco',
  no_preference: 'Sem preferencia',
};

export const DISCOVERY_SOURCE_LABELS: Record<DiscoverySource, string> = {
  google: 'Google',
  social: 'Facebook/Instagram',
  referral: 'Indicacao',
  already_customer: 'Ja era cliente',
};

export const MEAL_PERIOD_LABELS: Record<MealPeriod, string> = {
  lunch: 'Almoco',
  dinner: 'Jantar',
};

export const STANDARD_TOLERANCE_POLICY =
  'Reservas possuem tolerancia de 10 minutos. Apos o horario combinado, a mesa podera ser desmontada e liberada por ordem de chegada.';

export const LARGE_PARTY_TOLERANCE_POLICY =
  'Para grupos acima de 10 pessoas nao ha tolerancia. Apos o horario combinado, a mesa podera ser desmontada e liberada por ordem de chegada.';

export const FULL_TOLERANCE_POLICY =
  'Reservas possuem tolerancia de 10 minutos. Para grupos acima de 10 pessoas, nao ha tolerancia. Apos o horario combinado, a mesa podera ser desmontada e liberada por ordem de chegada.';
