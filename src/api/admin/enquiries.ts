// src/api/enquiries.ts
import apiClient from './client';
import type {
  Enquiry,
  EnquiryDetailResponse,
  EnquiriesListResponse,
  EnquiryUpdateResponse,
  ListEnquiriesParams,
  PaginatedEnquiries,
  UpdateEnquiryRequest,
} from '../../types/admin/enquiry';

// ─── Unwrap helper ─────────────────────────────────────────────────────────────

const unwrapEnquiries = (body: unknown): PaginatedEnquiries => {
  const b = body as EnquiriesListResponse;
  if (b?.data && b.data.results !== undefined) {
    return b.data;
  }
  return body as unknown as PaginatedEnquiries;
};

// ─── List Enquiries ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/enquiries/
 * Returns paginated enquiries with filters.
 */
export const listEnquiries = async (
  params?: ListEnquiriesParams,
): Promise<PaginatedEnquiries> => {
  const response = await apiClient.get<EnquiriesListResponse>('/api/admin/enquiries/', { params });
  return unwrapEnquiries(response.data);
};

// ─── Get Enquiry Details ──────────────────────────────────────────────────────

/**
 * GET /api/admin/enquiries/{id}/
 * Returns full enquiry details.
 */
export const getEnquiry = async (id: number): Promise<Enquiry> => {
  const response = await apiClient.get<EnquiryDetailResponse>(`/api/admin/enquiries/${id}/`);
  const data = response.data;
  if (data && typeof data === 'object' && 'data' in data && data.data) {
    return data.data as Enquiry;
  }
  return data as unknown as Enquiry;
};

// ─── Update Enquiry ───────────────────────────────────────────────────────────

/**
 * PATCH /api/admin/enquiries/{id}/
 * Updates enquiry status or other fields.
 */
export const updateEnquiry = async (
  id: number,
  data: UpdateEnquiryRequest,
): Promise<Enquiry> => {
  const response = await apiClient.patch<EnquiryUpdateResponse>(`/api/admin/enquiries/${id}/`, data);
  const responseData = response.data;
  if (responseData && typeof responseData === 'object' && 'data' in responseData && responseData.data) {
    return responseData.data as Enquiry;
  }
  return responseData as unknown as Enquiry;
};

// ─── Export Constants ─────────────────────────────────────────────────────────

export const ENQUIRY_STATUSES = [
  'pending',
  'contacted',
  'enquired',
  'account_created',
] as const;

export const ENQUIRY_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  contacted: 'Contacted',
  enquired: 'Enquired',
  account_created: 'Account Created',
};

export const ENQUIRY_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning text-dark',
  contacted: 'bg-info text-white',
  enquired: 'bg-primary text-white',
  account_created: 'bg-success text-white',
};