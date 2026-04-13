export type ReservationForType = 'self' | 'other';
export type GuestCountMode = 'exact' | 'approximate';
export type DietaryRestrictionType = 'none' | 'lactose' | 'vegan' | 'celiac' | 'other';
export type SeatingPreference = 'entry' | 'middle' | 'kids_space' | 'stage' | 'no_preference';
export type DiscoverySource = 'google' | 'social' | 'referral' | 'already_customer';
export type ReservationTime = '11:00' | '12:00' | '13:00' | '18:00' | '19:00' | '20:00';
export type MealPeriod = 'lunch' | 'dinner';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'completed';
export type ReservationLogStatus = 'success' | 'failure';
export interface ReservationAttributionData {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
    utm_id?: string;
    gclid?: string;
    fbclid?: string;
    wbraid?: string;
    gbraid?: string;
    fbp?: string;
    fbc?: string;
    page_path?: string;
    page_location?: string;
    referrer?: string;
}
export interface ReservationRequestPayload {
    customerFullName?: unknown;
    reservationForType?: unknown;
    reservedPersonName?: unknown;
    guestCount?: unknown;
    guestCountMode?: unknown;
    hasChildren?: unknown;
    dietaryRestrictionType?: unknown;
    dietaryRestrictionNotes?: unknown;
    seatingPreference?: unknown;
    whatsappNumber?: unknown;
    email?: unknown;
    reservationTime?: unknown;
    reservationDate?: unknown;
    isExistingCustomer?: unknown;
    discoverySource?: unknown;
    notes?: unknown;
    attribution?: unknown;
}
export interface NormalizedReservationInput {
    customerFullName: string;
    reservationForType: ReservationForType;
    reservedPersonName: string | null;
    guestCount: number;
    guestCountMode: GuestCountMode;
    hasChildren: boolean;
    dietaryRestrictionType: DietaryRestrictionType;
    dietaryRestrictionNotes: string | null;
    seatingPreference: SeatingPreference;
    whatsappNumber: string;
    email: string | null;
    reservationTime: ReservationTime;
    reservationDate: string;
    mealPeriod: MealPeriod;
    isExistingCustomer: boolean;
    discoverySource: DiscoverySource | null;
    notes: string | null;
    tolerancePolicyText: string;
}
export interface ReservationRecord extends NormalizedReservationInput {
    id: string;
    reservationCode: string;
    googleCalendarEventId: string | null;
    status: ReservationStatus;
    createdAt: string;
    updatedAt: string;
}
export interface ReservationPublicSummary {
    reservationCode: string;
    reservationDate: string;
    reservationDateLabel: string;
    reservationTime: ReservationTime;
    mealPeriod: MealPeriod;
    guestCount: number;
    guestCountMode: GuestCountMode;
    customerFullName: string;
    reservedPersonName: string | null;
    hasChildren: boolean;
    dietaryRestrictionType: DietaryRestrictionType;
    dietaryRestrictionNotes: string | null;
    seatingPreference: SeatingPreference;
    whatsappNumber: string;
    email: string | null;
    isExistingCustomer: boolean;
    discoverySource: DiscoverySource | null;
    notes: string | null;
    tolerancePolicyText: string;
}
export interface ReservationListFilters {
    reservationDate?: string | null;
    status?: ReservationStatus | null;
    query?: string | null;
}
export interface ReservationListItem {
    id: string;
    reservation_code: string;
    reservation_date: string;
    reservation_time: ReservationTime;
    meal_period: MealPeriod;
    customer_full_name: string;
    reservation_for_type: ReservationForType;
    reserved_person_name: string | null;
    guest_count: number;
    guest_count_mode: GuestCountMode;
    has_children: number;
    dietary_restriction_type: DietaryRestrictionType;
    dietary_restriction_notes: string | null;
    seating_preference: SeatingPreference;
    whatsapp_number: string;
    email: string | null;
    is_existing_customer: number;
    discovery_source: DiscoverySource | null;
    notes: string | null;
    tolerance_policy_text: string;
    google_calendar_event_id: string | null;
    status: ReservationStatus;
    created_at: string;
    updated_at: string;
}
