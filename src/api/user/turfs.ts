// src/api/user/turfs.ts
import apiClient from '../../api/admin/client';
import type {
  Turf,
  TurfListResponse,
  TurfDetailResponse,
  TurfCalendarResponse,
  ApplicableDiscountsResponse,
  ListTurfsParams,
} from '../../types/user/turf';

// ─── Calendar Types ──────────────────────────────────────────────────────

export interface CalendarSlot {
  game_type: string;
  date: string;
  start_time: string;
  end_time: string;
  price: string;
  status: 'Available' | 'Booked' | 'Reserved' | 'Blocked' | 'Unavailable';
  is_next_day: boolean;
  required_advance: string;
  advance_type: 'percentage' | 'fixed';
  advance_value: string;
}

export interface CalendarResponse {
  result: 'success' | 'error';
  message: string;
  data: CalendarSlot[];
}

/**
 * GET /api/user/turfs/
 * List approved turfs with pagination, search, and distance support
 */
export const listTurfs = async (params?: ListTurfsParams): Promise<TurfListResponse> => {
  const response = await apiClient.get<TurfListResponse>('/api/user/turfs/', {
    params: {
      page: params?.page || 1,
      page_size: params?.page_size || 20,
      ...(params?.search && { search: params.search }),
      ...(params?.lat && { lat: params.lat }),
      ...(params?.lng && { lng: params.lng }),
      ...(params?.radius && { radius: params.radius }),
    },
  });
  return response.data;
};

/**
 * GET /api/user/turfs/{id}/
 * Get turf details by ID
 */
export const getTurf = async (id: number): Promise<TurfDetailResponse> => {
  const response = await apiClient.get<TurfDetailResponse>(`/api/user/turfs/${id}/`);
  return response.data;
};

/**
 * GET /api/user/{id}/calendar/
 * Get available slots for a turf
 */
export const getTurfCalendar = async (
  turfId: number,
  date: string,
  court: number = 1
): Promise<CalendarResponse> => {
  const response = await apiClient.get<CalendarResponse>(
    `/api/user/${turfId}/calendar/`,
    {
      params: {
        court,
        date,
      },
    }
  );
  return response.data;
};

/**
 * GET /api/user/applicable-discounts/
 * Get applicable discounts for a turf
 */
export const getApplicableDiscounts = async (
  turfId: number
): Promise<ApplicableDiscountsResponse> => {
  const response = await apiClient.get<ApplicableDiscountsResponse>(
    `/api/user/applicable-discounts/?turf_id=${turfId}`
  );
  return response.data;
};