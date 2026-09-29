import apiClient from './client';
import type {
  Booking, BookingsPaginatedResponse, ListBookingsParams,
} from '../../types/admin/booking';

// ─── Unwrap helper (same pattern as users) ─────────────────────────────────────
const unwrap = (body: unknown): BookingsPaginatedResponse => {
  const b = body as Record<string, unknown>;
  if (b?.data && (b.data as Record<string, unknown>)?.results !== undefined) {
    return b.data as BookingsPaginatedResponse;
  }
  return b as unknown as BookingsPaginatedResponse;
};

/**
 * GET /api/admin/bookings/
 * Paginated, with advanced filters.
 * Response: { result, message, data: { count, next, previous, results } }
 */
export const listBookings = async (
  params?: ListBookingsParams,
): Promise<BookingsPaginatedResponse> => {
  const res = await apiClient.get('/api/admin/bookings/', { params });
  return unwrap(res.data);
};

/**
 * GET /api/admin/bookings/{id}/
 * Returns single booking inside { result, message, data: {...} }
 */
export const getBooking = async (id: number): Promise<Booking> => {
  const res = await apiClient.get(`/api/admin/bookings/${id}/`);
  const b = res.data as Record<string, unknown>;
  return (b?.data ?? b) as Booking;
};

/**
 * PATCH /api/admin/bookings/{id}/
 * Cancel a booking
 * @param id - Booking ID
 * @param isCancelled - Set to true to cancel the booking
 * @param refundToWallet - Optional: true to refund the actual amount paid to wallet
 */
export const cancelBooking = async (
  id: number,
  isCancelled: boolean = true,
  refundToWallet: boolean = false
): Promise<Booking> => {
  const res = await apiClient.patch(`/api/admin/bookings/${id}/`, {
    is_cancelled: isCancelled,
    refund_to_wallet: refundToWallet,
  });
  const b = res.data as Record<string, unknown>;
  return (b?.data ?? b) as Booking;
};