// src/types/enquiry.ts
// ─── Enquiry Types ──────────────────────────────────────────────────────────────
// Based on GET /api/admin/enquiries/ response

export type EnquiryStatus = 'pending' | 'contacted' | 'enquired' | 'account_created';

export interface Enquiry {
  id: number;
  name: string | null;
  number: string;
  location: string | null;
  is_verified: boolean;
  status: EnquiryStatus;
  partner: number | null;
  partner_name: string | null;
  partner_email: string | null;
  created_at: string;
  updated_at: string;
}

// ─── List Parameters ──────────────────────────────────────────────────────────

export interface ListEnquiriesParams {
  page?: number;
  page_size?: number;
  status?: EnquiryStatus | 'all';
  search?: string;
}

// ─── Paginated Response ──────────────────────────────────────────────────────

export interface PaginatedEnquiries {
  count: number;
  next: string | null;
  previous: string | null;
  results: Enquiry[];
}

export interface EnquiriesListResponse {
  result: 'success' | 'error';
  message: string;
  data: PaginatedEnquiries;
}

export interface EnquiryDetailResponse {
  result: 'success' | 'error';
  message: string;
  data: Enquiry;
}

export interface EnquiryUpdateResponse {
  result: 'success' | 'error';
  message: string;
  data: Enquiry;
}

// ─── Update Request ──────────────────────────────────────────────────────────

export interface UpdateEnquiryRequest {
  name?: string;
  number?: string;
  location?: string;
  is_verified?: boolean;
  status?: EnquiryStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const ENQUIRY_STATUSES: EnquiryStatus[] = [
  'pending',
  'contacted',
  'enquired',
  'account_created',
];

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  pending: 'Pending',
  contacted: 'Contacted',
  enquired: 'Enquired',
  account_created: 'Account Created',
};

export const ENQUIRY_STATUS_COLORS: Record<EnquiryStatus, string> = {
  pending: 'bg-warning text-dark',
  contacted: 'bg-info text-white',
  enquired: 'bg-primary text-white',
  account_created: 'bg-success text-white',
};