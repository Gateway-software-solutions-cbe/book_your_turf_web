// ─── Enums ─────────────────────────────────────────────────
export type SlotStatus = "Available" | "Booked" | "Unavailable";
export type SlotMode = "book" | "block" | "unblock";
export type PaymentStatus = "Pending" | "Advance Paid" | "Fully Paid";
export type BookingType = "Offline" | "Online";
export type PaymentMethod = "Cash" | "Card" | "UPI" | "Bank Transfer";

// ─── Calendar ──────────────────────────────────────────────
export interface CalendarSlot {
  game_type: string;
  date: string;           // YYYY-MM-DD
  start_time: string;     // HH:MM
  end_time: string;       // HH:MM
  start_time_12h: string; // "11:30 PM"
  end_time_12h: string;   // "12:30 AM"
  price: string;
  status: SlotStatus;
  is_next_day: boolean;
  block_ids?: number[];      // present when status === "Unavailable"
}

export interface CalendarQuery {
  turf_id: number;
  court_number: number;
  date: string;           // YYYY-MM-DD
}

// ─── Blocked Slots ─────────────────────────────────────────
export interface BlockedSlot {
  id: number;
  turf: number;
  turf_name: string;
  court_number: number;
  date: string;
  start_date: string;
  end_date: string;
  start_time: string;     // HH:MM:SS
  end_time: string;
  is_next_day: boolean;
  reason: string;
  created_at: string;
}

export interface BlockedSlotsQuery {
  turf_id?: number;
  court_number?: number;
  date?: string;
  start_date?: string;
  end_date?: string;
}

// ─── Block Slots (create) ──────────────────────────────────
export interface BlockSlotPayload {
  turf_id: number;
  court_number: number;
  start_date: string;   // YYYY-MM-DD
  end_date: string;
  start_time: string;   // HH:MM
  end_time: string;     // HH:MM
  reason?: string;
}

export interface BlockSlotResponse {
  block_ids: number[];
}

export interface UnblockPayload {
  block_id: number;
}

// ─── Own (Walk-in) Booking ─────────────────────────────────
export interface OwnBookingSlot {
  date: string;         // YYYY-MM-DD
  start_time: string;   // HH:MM
  end_time: string;     // HH:MM
  price: string;
  is_next_day: boolean;
}

export interface OwnBookingPayload {
  turf_id: number;
  court_number: number;
  date: string;         // YYYY-MM-DD
  slots: OwnBookingSlot[];
  walk_in_name: string;
  walk_in_mobile: string;
  total_amount: string;
  paid_amount: string;
}

export interface OwnBookingResponse {
  booking_id: string;   // "BYT_P_..."
  id: number;
}

// ─── Payments ──────────────────────────────────────────────
export interface AddPaymentPayload {
  booking_id: number;
  amount: string;
  payment_method: PaymentMethod;
}

export interface PaymentRecord {
  id: number;
  amount: string;
  method: string;
  received_by: string;
  created_at: string;
}

// ─── Cancel Booking ────────────────────────────────────────
export interface CancelBookingPayload {
  booking_id: number;
}

// ─── Bookings List ─────────────────────────────────────────
export interface BookingCustomer {
  name: string;
  mobile: string;
}

export interface BookingSlotDetail {
  date: string;
  start_time: string;
  end_time: string;
  price: string;
  is_next_day: boolean;
}

export interface PartnerBooking {
  id: number;
  booking_type: BookingType;
  booking_id: string;
  turf_id: number;
  court_number: number;
  turf_name: string;
  game_type: string;
  total_amount: string;
  paid_amount: string;
  pending_amount: string;
  payment_status: PaymentStatus;
  customer: BookingCustomer;
  slots: BookingSlotDetail[];
  booked_by: string;
  payments: PaymentRecord[];
  created_at: string;
  transactions: any[];
  is_cancelled: boolean;
  booked_date: string;
  admin_discount_amount: string;
  partner_discount_amount: string;
  total_discount_amount: string;
  discounted_total_amount: string;
}

export interface BookingsSummary {
  upcoming_total: number;
  upcoming_online: number;
  upcoming_offline: number;
  past_incomplete_count: number;
  total_pending_amount: string;
}

export interface BookingsPagination {
  count: number;
  next: string | null;
  previous: string | null;
  results: PartnerBooking[];
}

export interface BookingsListData {
  summary: BookingsSummary;
  bookings: BookingsPagination;
}

export interface BookingsQuery {
  turf_id?: number;
  court_number?: number;
  booking_type?: BookingType;
  payment_status?: PaymentStatus;
  date?: string;         // Single day
  start_date?: string;   // Range start
  end_date?: string;     // Range end
  page?: number;
  page_size?: number;
}