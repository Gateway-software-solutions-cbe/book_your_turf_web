// src/types/user/turf.ts
import type { ApiResponse } from '../../types/user/userAuth';

// ─── Shared sub-shapes ────────────────────────────────────────────────────

export interface TurfDimensionData {
  unit?: string;
  height?: number | string;
  length?: number | string;
  breadth?: number | string;
  turf_shape?: string;
  court_type?: string;
}

export interface TurfFacilities {
  CCTV: boolean;
  wifi: boolean;
  parking: boolean;
  'Rest room': boolean;
  'Sports kits': boolean;
  'Dressing room': boolean;
  'Music systems': boolean;
  'Drinking water': boolean;
}

export interface TurfImage {
  id: number;
  url: string;
}

// ─── Shared base (all fields except images) ───────────────────────────────

export interface TurfBase {
  id: number;
  name: string;
  game_type: string;
  address: string;
  description: string;
  achievements: string;
  dimension_data: TurfDimensionData;
  advance_type: 'percentage' | 'fixed';
  advance_value: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: string;
  min_slots: number;
  max_persons: number | null;
  courts: number | null;
  open_time: string | null;
  close_time: string | null;
  facilities: TurfFacilities;
  latitude: string | null;
  longitude: string | null;
  state: string;
  district: string;
  pincode: string;
  turf_code: string;
  type: 'real' | 'mock';
  is_bookable: boolean;
  phone_number: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Mock';
  best_discount_label: string | null;
  distance_km: number | null;
  is_favorited: boolean;
}

// ─── Turfs endpoints ──────────────────────────────────────────────────────
// GET /api/user/turfs/         → images: string[]
// GET /api/user/turfs/{id}/    → images: string[]

export interface Turf extends TurfBase {
  images: string[];
}

export interface PaginatedTurfsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Turf[];
}

// ─── Favourites endpoint ──────────────────────────────────────────────────
// GET /api/user/favorites/     → images: TurfImage[]

export interface FavoriteTurf extends TurfBase {
  images: TurfImage[];
}

export type FavoritesListResponse = FavoriteTurf[];

// ─── Request/Response types ───────────────────────────────────────────────

export interface ListTurfsParams {
  page?: number;
  page_size?: number;
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export type TurfListResponse = ApiResponse<PaginatedTurfsResponse>;
export type TurfDetailResponse = ApiResponse<Turf>;
export type FavoriteTurfListResponse = ApiResponse<FavoritesListResponse>;

// ─── Calendar ─────────────────────────────────────────────────────────────

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  price: string;
}

export interface TurfCalendarResponse {
  date: string;
  slots: TimeSlot[];
}

// ─── Discounts (unchanged) ────────────────────────────────────────────────

export interface Discount {
  id: number;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  max_discount_amount: string | null;
  min_amount: string | null;
  min_slots: number | null;
  applicable_time_start: string | null;
  applicable_time_end: string | null;
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  usage_limit: number | null;
  used_count: number;
  applicable_payment_type: 'full' | 'advance' | 'both';
  source: 'admin' | 'partner';
  partner: string | null;
  created_by_admin: string | null;
  applicable_turfs: number[];
  applicable_turf_ids: number[];
  applicable_state: string | null;
  applicable_district: string | null;
  turf: string | null;
  created_at: string;
  updated_at: string;
  requirements: { days?: string };
  calculated_discount: string | null;
}

export interface ApplicableDiscountsData {
  admin_discounts: Discount[];
  partner_discounts: Discount[];
}

export type ApplicableDiscountsResponse = ApiResponse<ApplicableDiscountsData>;

// ─── Helpers ──────────────────────────────────────────────────────────────

export interface TurfFilter {
  sport?: string;
  search?: string;
  distance?: number;
}

export const TURF_STATUS = {
  APPROVED: 'Approved',
  PENDING: 'Pending',
  REJECTED: 'Rejected',
  MOCK: 'Mock',
} as const;

export const TURF_TYPE = {
  REAL: 'real',
  MOCK: 'mock',
} as const;

export type TurfStatus = typeof TURF_STATUS[keyof typeof TURF_STATUS];
export type TurfType = typeof TURF_TYPE[keyof typeof TURF_TYPE];