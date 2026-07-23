import apiClient from './client';
import type {
  Booking, BookingsPaginatedResponse, ListBookingsParams,
} from '../types/booking';

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