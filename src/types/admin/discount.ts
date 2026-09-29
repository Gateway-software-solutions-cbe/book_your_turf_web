// src/types/discount.ts
// ─── Discount Types ──────────────────────────────────────────────────────────────

export type DiscountSource = 'admin' | 'partner';
export type DiscountType = 'percentage' | 'fixed';
export type ApplicablePaymentType = 'advance' | 'full' | 'both';

export interface Discount {
  id: number;
  name: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: string;           // "10.00"
  max_discount_amount: string | null;
  min_amount: string | null;
  min_slots: number | null;
  applicable_payment_type: ApplicablePaymentType;  // "advance", "full", "both"
  applicable_time_start: string | null;  // "10:00"
  applicable_time_end: string | null;    // "18:00"
  
  // Days of week
  mon: boolean;
  tue: boolean;
  wed: boolean;
  thu: boolean;
  fri: boolean;
  sat: boolean;
  sun: boolean;
  
  is_active: boolean;
  start_date: string | null;        // "2026-07-15" or null
  end_date: string | null;          // "2026-08-15" or null
  usage_limit: number | null;
  used_count: number;
  
  // Source
  source: DiscountSource;
  partner: number | null;
  partner_name: string | null;
  created_by_admin: number;
  created_by_admin_name: string;
  
  // Applicable turfs (admin discounts)
  applicable_turfs: number[];
  applicable_turf_ids: number[];
  applicable_state: string | null;
  applicable_district: string | null;
  
  // Specific turf (partner discounts)
  turf: number | null;
  turf_name: string | null;
  
  created_at: string;
  updated_at: string;
}

// ─── Request Types ─────────────────────────────────────────────────────────────

// Admin Discount (Platform Funded)
export interface CreateAdminDiscountRequest {
  name: string;
  description?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_amount?: number | null;
  min_amount?: number | null;
  min_slots?: number | null;
  applicable_payment_type?: ApplicablePaymentType;
  applicable_time_start?: string | null;
  applicable_time_end?: string | null;
  mon?: boolean;
  tue?: boolean;
  wed?: boolean;
  thu?: boolean;
  fri?: boolean;
  sat?: boolean;
  sun?: boolean;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  usage_limit?: number | null;
  applicable_turfs?: number[];
  applicable_state?: string | null;
  applicable_district?: string | null;
}

// Partner Discount (Partner Funded)
export interface CreatePartnerDiscountRequest {
  name: string;
  description?: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount_amount?: number | null;
  min_amount?: number | null;
  min_slots?: number | null;
  applicable_payment_type?: ApplicablePaymentType;
  applicable_time_start?: string | null;
  applicable_time_end?: string | null;
  mon?: boolean;
  tue?: boolean;
  wed?: boolean;
  thu?: boolean;
  fri?: boolean;
  sat?: boolean;
  sun?: boolean;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  usage_limit?: number | null;
  turf: number;
}

export interface UpdateDiscountRequest {
  name?: string;
  description?: string | null;
  discount_type?: DiscountType;
  discount_value?: number;
  max_discount_amount?: number | null;
  min_amount?: number | null;
  min_slots?: number | null;
  applicable_payment_type?: ApplicablePaymentType;
  applicable_time_start?: string | null;
  applicable_time_end?: string | null;
  mon?: boolean;
  tue?: boolean;
  wed?: boolean;
  thu?: boolean;
  fri?: boolean;
  sat?: boolean;
  sun?: boolean;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  usage_limit?: number | null;
  applicable_turfs?: number[];
  applicable_state?: string | null;
  applicable_district?: string | null;
  turf?: number;
}

// ─── List Parameters ──────────────────────────────────────────────────────────

export interface ListDiscountsParams {
  page?: number;
  page_size?: number;
  source?: DiscountSource | 'all';
  is_active?: boolean;
  discount_type?: DiscountType | 'all';
  search?: string;
  mon?: boolean;
  tue?: boolean;
  wed?: boolean;
  thu?: boolean;
  fri?: boolean;
  sat?: boolean;
  sun?: boolean;
}

// ─── Paginated Response ──────────────────────────────────────────────────────

export interface PaginatedDiscounts {
  count: number;
  next: string | null;
  previous: string | null;
  results: Discount[];
}

export interface DiscountsListResponse {
  result: 'success' | 'error';
  message: string;
  data: PaginatedDiscounts;
}

export interface DiscountDetailResponse {
  result: 'success' | 'error';
  message: string;
  data: Discount;
}

export interface DiscountDeleteResponse {
  result: 'success' | 'error';
  message: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DISCOUNT_SOURCES: DiscountSource[] = ['admin', 'partner'];
export const DISCOUNT_TYPES: DiscountType[] = ['percentage', 'fixed'];
export const APPLICABLE_PAYMENT_TYPES: ApplicablePaymentType[] = ['advance', 'full', 'both'];

export const DISCOUNT_SOURCE_LABELS: Record<DiscountSource, string> = {
  admin: 'Platform Funded (Admin)',
  partner: 'Partner Funded',
};

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'Percentage (%)',
  fixed: 'Fixed Amount (₹)',
};

export const APPLICABLE_PAYMENT_TYPE_LABELS: Record<ApplicablePaymentType, string> = {
  advance: 'Advance Payment Only',
  full: 'Full Payment Only',
  both: 'Both Advance & Full',
};

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};