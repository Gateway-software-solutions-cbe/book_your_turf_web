// src/types/user/turf.ts
import type { ApiResponse } from '../../types/user/userAuth';

// ─── Turf Types ──────────────────────────────────────────────────────────

export interface TurfDimensionData {
  unit?: string;
  height?: number;
  length?: number;
  breadth?: number;
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

export interface Turf {
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
  images: string[];
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

export interface PaginatedTurfsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Turf[];
}

// ─── Request/Response Types ────────────────────────────────────────────

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

// ─── Calendar Types ────────────────────────────────────────────────────

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

// ─── Discount Types ────────────────────────────────────────────────────

export interface ApplicableDiscount {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  description: string;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
}

export type ApplicableDiscountsResponse = ApiResponse<ApplicableDiscount[]>;

// ─── Helper Types ──────────────────────────────────────────────────────

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