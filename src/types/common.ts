// ─── Common API Types ──────────────────────────────────────────────────────────

/** Standard API error shape returned by Django REST Framework */
export interface ApiError {
  detail?: string;
  message?: string;
  [field: string]: unknown;
}

/**
 * DRF paginated response wrapper.
 * NOTE: The current /api/admin/partners/ endpoint returns a plain array
 * (no pagination). This type is defined for future endpoints that do paginate,
 * and for when the backend team adds pagination to partners.
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Generic success response wrapper used by some admin endpoints */
export interface SuccessResponse<T = unknown> {
  result: 'success' | 'error';
  message: string;
  data: T;
}
