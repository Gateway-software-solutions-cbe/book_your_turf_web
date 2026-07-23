// ─── Booking Types ─────────────────────────────────────────────────────────────
// GET /api/admin/bookings/ and GET /api/admin/bookings/{id}/

export type BookingType    = 'Online' | 'Offline';
export type PaymentStatus  = 'Pending' | 'Advance Paid' | 'Fully Paid';
export type PaymentMethod  = 'Razorpay' | 'Wallet' | 'Cash' | string;

export interface BookingCustomer {
  name:   string;
  email:  string;
  number: string;
  type:   'online' | 'offline' | string;
}

export interface BookingSlot {
  date:        string;   // "2026-07-10"
  start_time:  string;   // "06:00 AM"
  end_time:    string;   // "07:00 AM"
  price:       string;   // "500.00"
  is_next_day: boolean;
}

export interface BookingPayment {
  type:      string;          // "online" | "wallet" | "cash"
  amount:    string;          // "250.00"
  method:    PaymentMethod;
  date:      string;          // ISO 8601
  reference: string;
}

export interface Booking {
  id:               number;
  booking_code:     string;
  booking_type:     BookingType;
  court_number:     number;
  customer:         BookingCustomer;
  partner_name:     string;
  partner_email:    string;
  partner_number:   string;
  partner_business: string;
  turf_name:        string;
  turf_code:        string;
  slots:            BookingSlot[];
  total_amount:     string;
  paid_amount:      string;
  pending_amount:   string;
  payment_status:   PaymentStatus;
  is_cancelled:     boolean;
  booked_date:      string;   // "2026-07-09"
  created_at:       string;   // ISO 8601
  payments:         BookingPayment[];
}

// ─── API params ────────────────────────────────────────────────────────────────

export interface ListBookingsParams {
  search?:         string;
  slot_date?:      string;
  date_from?:      string;
  date_to?:        string;
  booking_type?:   BookingType;
  payment_status?: PaymentStatus;
  is_cancelled?:   boolean;
  partner_id?:     number;
  turf_id?:        number;
  page?:           number;
  page_size?:      number;
}

export interface BookingsPaginatedResponse {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  Booking[];
}