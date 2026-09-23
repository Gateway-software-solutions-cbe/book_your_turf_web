// src/types/user/booking.ts

// ─── Slots & Requests ────────────────────────────────────────────────────

export interface BookingSlot {
  start_time: string;
  end_time: string;
  price: string;
}

export interface WalletBookingRequest {
  turf_id: number;
  court_number: number;
  date: string;
  slots: BookingSlot[];
  total_amount: string;
  amount_to_pay?: string;
  admin_discount_id?: number;
  partner_discount_id?: number;
}

export interface WalletBookingResponse {
  booking_id: string;
  id: number;
}

export interface InitiateBookingRequest {
  turf_id: number;
  court_number: number;
  date: string;
  slots: BookingSlot[];
  total_amount: string;
  advance_amount: string;
  admin_discount_id?: number;
  partner_discount_id?: number;
}

export interface InitiateBookingResponse {
  razorpay_order_id: string;
  amount: number | string;
  currency: string;
  key: string;
  booking_id?: string;
  admin_discount_amount?: string;
  partner_discount_amount?: string;
  discounted_total?: string;
  original_total?: string;
  total_discount?: string;
  partner_discount_applied?: boolean;
  admin_discount_applied?: boolean;
  slots?: any[];
  turf_id?: number;
  court_number?: number;
  date?: string;
}

export interface ConfirmBookingRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  turf_id: number;
  court_number: number;
  date: string;
  slots: BookingSlot[];
  total_amount: string;
  advance_amount: string;
}

export interface ConfirmBookingResponse {
  booking_id?: string;
  id?: number;
}

// ─── Booking History Types ───────────────────────────────────────────────

export interface BookingSlotDetail {
  date: string;
  start_time: string;
  end_time: string;
  price: string;
  is_next_day: boolean;
}

export interface BookingPayment {
  type: 'online' | 'wallet';
  amount: string;
  method: string;      // "Razorpay" | "Wallet"
  date: string;        // ISO timestamp
  reference: string;   // Razorpay payment_id
}

export interface Booking {
  id: number;
  booking_id: string;
  turf_id: number;
  turf_name: string;
  game_type: string;
  court_number: number;
  booking_type: string;               // "Online" | "Wallet"
  total_amount: string;
  paid_amount: string;
  pending_amount: string;
  payment_status: 'Pending' | 'Advance Paid' | 'Fully Paid';
  slots: BookingSlotDetail[];
  payments: BookingPayment[];
  is_cancelled: boolean;
  created_at: string;
  booked_date: string;
  admin_discount_id?: number;
  admin_discount_amount: string;
  partner_discount_amount: string;
  total_discount_amount: string;
  discounted_total_amount: string;
}

export interface PaginatedBookingsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Booking[];
}

export interface ListBookingsParams {
  page?: number;
  page_size?: number;
  date?: string;              // YYYY-MM-DD
  start_date?: string;
  end_date?: string;
  payment_status?: 'Pending' | 'Advance Paid' | 'Fully Paid';
}

// ─── Pay Balance Types ───────────────────────────────────────────────────

export interface PayBalanceRequest {
  booking_id: number;
  amount: string;   // decimal as string
}

export interface PayBalanceResponse {
  razorpay_order_id: string;
  amount: string;
  currency: string;
  booking_id: number;
}

export interface PayBalanceWalletResponse {
  booking_id: string;
  wallet_balance: string;
}

export interface ConfirmBalanceRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  booking_id: number;
}

export interface ConfirmBalanceResponse {
  // backend returns empty data on success, message says "success"
  [key: string]: any;
}

// ─── Cancel Booking Types ────────────────────────────────────────────────

export interface CancelBookingRequest {
  booking_id: number;
}

export interface CancelBookingResponse {
  // backend returns empty data on success, message says "cancelled and refunded"
  [key: string]: any;
}