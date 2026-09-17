// src/api/user/bookings.ts
import apiClient from '../admin/client';
import type { ApiResponse } from '../../types/user/userAuth';
import type {
  WalletBookingRequest,
  WalletBookingResponse,
  InitiateBookingRequest,
  InitiateBookingResponse,
  ConfirmBookingRequest,
  ConfirmBookingResponse,
  PaginatedBookingsResponse,
  ListBookingsParams,
  PayBalanceRequest,
  PayBalanceResponse,
  PayBalanceWalletResponse,
  ConfirmBalanceRequest,
  ConfirmBalanceResponse,
  CancelBookingRequest,
  CancelBookingResponse,
} from '../../types/user/booking';

// ─── Create Booking APIs ─────────────────────────────────────────────────

/**
 * POST /api/user/bookings/wallet-book/
 * Book using wallet (full or partial advance)
 */
export const walletBook = async (
  payload: WalletBookingRequest
): Promise<ApiResponse<WalletBookingResponse>> => {
  const response = await apiClient.post<ApiResponse<WalletBookingResponse>>(
    '/api/user/bookings/wallet-book/',
    payload
  );
  return response.data;
};

/**
 * POST /api/user/bookings/initiate/
 * Initiate online booking (creates Razorpay order)
 */
export const initiateBooking = async (
  payload: InitiateBookingRequest
): Promise<ApiResponse<InitiateBookingResponse>> => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📤 POST /api/user/bookings/initiate/');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const response = await apiClient.post<ApiResponse<InitiateBookingResponse>>(
    '/api/user/bookings/initiate/',
    payload
  );
  return response.data;
};

/**
 * POST /api/user/bookings/confirm/
 * Confirm booking after Razorpay payment
 * Backend accepts JSON (slots as array of objects)
 */
export const confirmBooking = async (
  payload: ConfirmBookingRequest
): Promise<ApiResponse<ConfirmBookingResponse>> => {
  const response = await apiClient.post<ApiResponse<ConfirmBookingResponse>>(
    '/api/user/bookings/confirm/',
    {
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_order_id: payload.razorpay_order_id,
      turf_id: payload.turf_id,
      court_number: payload.court_number ?? 1,
      date: payload.date,
      slots: payload.slots,
      total_amount: payload.total_amount,
      ...(payload.advance_amount !== undefined && {
        advance_amount: payload.advance_amount,
      }),
    }
  );
  return response.data;
};

// ─── Booking History API ─────────────────────────────────────────────────

/**
 * GET /api/user/bookings/
 * Get user booking history (paginated + filterable)
 */
export const listBookings = async (
  params?: ListBookingsParams
): Promise<ApiResponse<PaginatedBookingsResponse>> => {
  const response = await apiClient.get<ApiResponse<PaginatedBookingsResponse>>(
    '/api/user/bookings/',
    {
      params: {
        page: params?.page || 1,
        page_size: params?.page_size || 20,
        ...(params?.date && { date: params.date }),
        ...(params?.start_date && { start_date: params.start_date }),
        ...(params?.end_date && { end_date: params.end_date }),
        ...(params?.payment_status && { payment_status: params.payment_status }),
      },
    }
  );
  return response.data;
};

// ─── Pay Balance APIs ────────────────────────────────────────────────────

/**
 * POST /api/user/bookings/pay-balance/
 * Initiate Razorpay order for balance payment
 * Backend expects multipart/form-data
 */
export const payBalance = async (
  payload: PayBalanceRequest
): Promise<ApiResponse<PayBalanceResponse>> => {
  const formData = new FormData();
  formData.append('booking_id', String(payload.booking_id));
  formData.append('amount', payload.amount);

  const response = await apiClient.post<ApiResponse<PayBalanceResponse>>(
    '/api/user/bookings/pay-balance/',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

/**
 * POST /api/user/bookings/pay-balance-wallet/
 * Pay remaining balance using wallet
 * Backend expects multipart/form-data
 */
export const payBalanceWallet = async (
  payload: PayBalanceRequest
): Promise<ApiResponse<PayBalanceWalletResponse>> => {
  const formData = new FormData();
  formData.append('booking_id', String(payload.booking_id));
  formData.append('amount', payload.amount);

  const response = await apiClient.post<ApiResponse<PayBalanceWalletResponse>>(
    '/api/user/bookings/pay-balance-wallet/',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

/**
 * POST /api/user/bookings/confirm-balance/
 * Confirm balance payment after Razorpay
 * Backend expects multipart/form-data
 */
export const confirmBalance = async (
  payload: ConfirmBalanceRequest
): Promise<ApiResponse<ConfirmBalanceResponse>> => {
  const formData = new FormData();
  formData.append('razorpay_payment_id', payload.razorpay_payment_id);
  formData.append('razorpay_order_id', payload.razorpay_order_id);
  formData.append('booking_id', String(payload.booking_id));

  const response = await apiClient.post<ApiResponse<ConfirmBalanceResponse>>(
    '/api/user/bookings/confirm-balance/',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

// ─── Cancel Booking API ──────────────────────────────────────────────────

/**
 * POST /api/user/bookings/cancel/
 * Cancel a booking (refund to wallet)
 * Backend expects multipart/form-data
 */
export const cancelBooking = async (
  payload: CancelBookingRequest
): Promise<ApiResponse<CancelBookingResponse>> => {
  const formData = new FormData();
  formData.append('booking_id', String(payload.booking_id));

  const response = await apiClient.post<ApiResponse<CancelBookingResponse>>(
    '/api/user/bookings/cancel/',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};