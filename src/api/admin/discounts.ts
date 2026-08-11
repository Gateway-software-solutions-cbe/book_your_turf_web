// src/api/discounts.ts
import apiClient from './client';
import type {
  Discount,
  DiscountDetailResponse,
  ListDiscountsParams,
  PaginatedDiscounts,
  CreateAdminDiscountRequest,
  CreatePartnerDiscountRequest,
  UpdateDiscountRequest,
} from '../../types/admin/discount';

// ─── Unwrap helper ─────────────────────────────────────────────────────────────

const unwrapDiscounts = (body: unknown): PaginatedDiscounts => {
  const b = body as Record<string, unknown>;
  
  // Check if it's an array (direct list response)
  if (Array.isArray(b)) {
    return {
      count: b.length,
      next: null,
      previous: null,
      results: b as Discount[]
    };
  }
  
  // Check if it's wrapped with { result, message, data }
  if (b?.data && typeof b.data === 'object') {
    const data = b.data as Record<string, unknown>;
    if (Array.isArray(data)) {
      return {
        count: data.length,
        next: null,
        previous: null,
        results: data as Discount[]
      };
    }
    if (data.results !== undefined) {
      return {
        count: typeof data.count === 'number' ? data.count : (data.results as unknown[]).length,
        next: data.next as string || null,
        previous: data.previous as string || null,
        results: data.results as Discount[]
      };
    }
    if (data.id !== undefined) {
      return {
        count: 1,
        next: null,
        previous: null,
        results: [data as unknown as Discount]
      };
    }
  }
  
  // Check if it's directly the paginated response with results
  if (b?.results !== undefined) {
    return {
      count: typeof b.count === 'number' ? b.count : (b.results as unknown[]).length,
      next: b.next as string || null,
      previous: b.previous as string || null,
      results: b.results as Discount[]
    };
  }
  
  // Fallback
  console.warn('Unexpected discount response format:', body);
  return {
    count: 0,
    next: null,
    previous: null,
    results: []
  };
};

// ─── Helper to build discount payload with null values ────────────────────────

const buildDiscountPayload = (data: Record<string, unknown>): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  
  // Required fields
  payload.name = data.name;
  payload.discount_type = data.discount_type;
  payload.discount_value = data.discount_value;
  
  // Description - convert empty string to null
  payload.description = data.description && typeof data.description === 'string' && data.description.trim() !== '' 
    ? data.description 
    : null;
  
  // Optional number fields - convert empty/undefined to null
  payload.max_discount_amount = data.max_discount_amount !== undefined && data.max_discount_amount !== '' && data.max_discount_amount !== null
    ? Number(data.max_discount_amount)
    : null;
  
  payload.min_amount = data.min_amount !== undefined && data.min_amount !== '' && data.min_amount !== null
    ? Number(data.min_amount)
    : null;
  
  payload.min_slots = data.min_slots !== undefined && data.min_slots !== '' && data.min_slots !== null
    ? Number(data.min_slots)
    : null;
  
  payload.applicable_payment_type = data.applicable_payment_type || 'both';
  
  // Time fields - convert empty string to null
  payload.applicable_time_start = data.applicable_time_start && typeof data.applicable_time_start === 'string' && data.applicable_time_start.trim() !== ''
    ? data.applicable_time_start
    : null;
  
  payload.applicable_time_end = data.applicable_time_end && typeof data.applicable_time_end === 'string' && data.applicable_time_end.trim() !== ''
    ? data.applicable_time_end
    : null;
  
  // Days of week
  payload.mon = data.mon ?? false;
  payload.tue = data.tue ?? false;
  payload.wed = data.wed ?? false;
  payload.thu = data.thu ?? false;
  payload.fri = data.fri ?? false;
  payload.sat = data.sat ?? false;
  payload.sun = data.sun ?? false;
  
  payload.is_active = data.is_active ?? true;
  
  // Date fields - convert empty string to null
  payload.start_date = data.start_date && typeof data.start_date === 'string' && data.start_date.trim() !== ''
    ? data.start_date
    : null;
  
  payload.end_date = data.end_date && typeof data.end_date === 'string' && data.end_date.trim() !== ''
    ? data.end_date
    : null;
  
  // Usage limit - convert empty to null
  payload.usage_limit = data.usage_limit !== undefined && data.usage_limit !== '' && data.usage_limit !== null
    ? Number(data.usage_limit)
    : null;
  
  // Admin specific fields
  if (data.applicable_turfs !== undefined) {
    payload.applicable_turfs = Array.isArray(data.applicable_turfs) && data.applicable_turfs.length > 0
      ? data.applicable_turfs
      : [];
  }
  
  payload.applicable_state = data.applicable_state && typeof data.applicable_state === 'string' && data.applicable_state.trim() !== ''
    ? data.applicable_state
    : null;
  
  payload.applicable_district = data.applicable_district && typeof data.applicable_district === 'string' && data.applicable_district.trim() !== ''
    ? data.applicable_district
    : null;
  
  // Partner specific fields
  if (data.turf !== undefined) {
    payload.turf = data.turf ? Number(data.turf) : null;
  }
  
  return payload;
};

// ─── Helper to clean update payload with null values ──────────────────────────

const cleanPayload = (data: unknown): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  if (!data || typeof data !== 'object') return result;
  
  Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
    // Skip undefined
    if (value === undefined) return;
    
    // Handle empty strings - convert to null
    if (typeof value === 'string' && value.trim() === '') {
      result[key] = null;
      return;
    }
    
    // Handle empty arrays - keep as empty array
    if (Array.isArray(value)) {
      result[key] = value;
      return;
    }
    
    // Keep all other values
    result[key] = value;
  });
  
  return result;
};

// ─── Admin Discounts (Platform Funded) ────────────────────────────────────────

/**
 * GET /api/admin/discounts/admin/
 * List all platform-funded (admin) discounts.
 */
export const listAdminDiscounts = async (
  params?: Omit<ListDiscountsParams, 'source'>,
): Promise<PaginatedDiscounts> => {
  try {
    console.log('📦 Fetching admin discounts with params:', params);
    const response = await apiClient.get('/api/admin/discounts/admin/', { params });
    console.log('📦 Admin discounts response:', response.data);
    return unwrapDiscounts(response.data);
  } catch (error) {
    console.error('❌ Error fetching admin discounts:', error);
    throw error;
  }
};

/**
 * GET /api/admin/discounts/admin/{id}/
 * Get admin discount details.
 */
export const getAdminDiscount = async (id: number): Promise<Discount> => {
  console.log(`📦 Fetching admin discount with ID: ${id}`);
  const response = await apiClient.get<DiscountDetailResponse>(`/api/admin/discounts/admin/${id}/`);
  console.log('📦 Admin discount response:', response.data);
  const data = response.data;
  if (data && typeof data === 'object' && 'data' in data && data.data) {
    return data.data as Discount;
  }
  return data as unknown as Discount;
};

/**
 * POST /api/admin/discounts/admin/
 * Create a platform-funded (admin) discount.
 */
export const createAdminDiscount = async (
  data: CreateAdminDiscountRequest,
): Promise<Discount> => {
  const payload = buildDiscountPayload(data as unknown as Record<string, unknown>);
  
  console.log('🚀 Creating admin discount');
  console.log('📤 Request payload:', JSON.stringify(payload, null, 2));
  
  const response = await apiClient.post('/api/admin/discounts/admin/', payload);
  
  console.log('📥 Response status:', response.status);
  console.log('📥 Response data:', JSON.stringify(response.data, null, 2));
  
  const responseData = response.data;
  
  if (responseData && typeof responseData === 'object') {
    if ('data' in responseData && responseData.data) {
      const discountData = responseData.data;
      if (discountData && typeof discountData === 'object' && 'id' in discountData) {
        console.log('✅ Admin discount created successfully:', discountData);
        return discountData as Discount;
      }
      if (Array.isArray(discountData) && discountData.length > 0) {
        console.log('✅ Admin discount created successfully (from array):', discountData[0]);
        return discountData[0] as Discount;
      }
    }
    if ('id' in responseData) {
      console.log('✅ Admin discount created successfully (direct):', responseData);
      return responseData as unknown as Discount;
    }
  }
  
  console.log('⚠️ Unexpected response format, returning raw data');
  return responseData as unknown as Discount;
};

/**
 * POST /api/admin/discounts/partner/
 * Create a partner-funded discount.
 */
export const createPartnerDiscount = async (
  data: CreatePartnerDiscountRequest,
): Promise<Discount> => {
  const payload = buildDiscountPayload(data as unknown as Record<string, unknown>);
  
  console.log('🚀 Creating partner discount');
  console.log('📤 Request payload:', JSON.stringify(payload, null, 2));
  
  const response = await apiClient.post('/api/admin/discounts/partner/', payload);
  
  console.log('📥 Response status:', response.status);
  console.log('📥 Response data:', JSON.stringify(response.data, null, 2));
  
  const responseData = response.data;
  
  if (responseData && typeof responseData === 'object') {
    if ('data' in responseData && responseData.data) {
      const discountData = responseData.data;
      if (discountData && typeof discountData === 'object' && 'id' in discountData) {
        console.log('✅ Partner discount created successfully:', discountData);
        return discountData as Discount;
      }
      if (Array.isArray(discountData) && discountData.length > 0) {
        console.log('✅ Partner discount created successfully (from array):', discountData[0]);
        return discountData[0] as Discount;
      }
    }
    if ('id' in responseData) {
      console.log('✅ Partner discount created successfully (direct):', responseData);
      return responseData as unknown as Discount;
    }
  }
  
  console.log('⚠️ Unexpected response format, returning raw data');
  return responseData as unknown as Discount;
};

/**
 * PATCH /api/admin/discounts/admin/{id}/
 * Update an admin discount.
 */
export const updateAdminDiscount = async (
  id: number,
  data: UpdateDiscountRequest,
): Promise<Discount> => {
  const payload = cleanPayload(data);
  
  console.log(`🔄 Updating admin discount with ID: ${id}`);
  console.log('📤 Update payload:', JSON.stringify(payload, null, 2));
  
  const response = await apiClient.patch<DiscountDetailResponse>(
    `/api/admin/discounts/admin/${id}/`,
    payload
  );
  
  console.log('📥 Update response:', JSON.stringify(response.data, null, 2));
  
  const responseData = response.data;
  if (responseData && typeof responseData === 'object' && 'data' in responseData && responseData.data) {
    return responseData.data as Discount;
  }
  return responseData as unknown as Discount;
};

/**
 * DELETE /api/admin/discounts/admin/{id}/
 * Delete an admin discount.
 */
export const deleteAdminDiscount = async (id: number): Promise<void> => {
  console.log(`🗑️ Deleting admin discount with ID: ${id}`);
  await apiClient.delete(`/api/admin/discounts/admin/${id}/`);
  console.log('✅ Admin discount deleted successfully');
};

// ─── Partner Discounts (Partner Funded) ───────────────────────────────────────

/**
 * GET /api/admin/discounts/partner/
 * List all partner-funded discounts.
 */
export const listPartnerDiscounts = async (
  params?: Omit<ListDiscountsParams, 'source'>,
): Promise<PaginatedDiscounts> => {
  try {
    console.log('📦 Fetching partner discounts with params:', params);
    const response = await apiClient.get('/api/admin/discounts/partner/', { params });
    console.log('📦 Partner discounts response:', response.data);
    return unwrapDiscounts(response.data);
  } catch (error) {
    console.error('❌ Error fetching partner discounts:', error);
    throw error;
  }
};

/**
 * GET /api/admin/discounts/partner/{id}/
 * Get partner discount details.
 */
export const getPartnerDiscount = async (id: number): Promise<Discount> => {
  console.log(`📦 Fetching partner discount with ID: ${id}`);
  const response = await apiClient.get<DiscountDetailResponse>(`/api/admin/discounts/partner/${id}/`);
  console.log('📦 Partner discount response:', response.data);
  const data = response.data;
  if (data && typeof data === 'object' && 'data' in data && data.data) {
    return data.data as Discount;
  }
  return data as unknown as Discount;
};

/**
 * PATCH /api/admin/discounts/partner/{id}/
 * Update a partner discount.
 */
export const updatePartnerDiscount = async (
  id: number,
  data: UpdateDiscountRequest,
): Promise<Discount> => {
  const payload = cleanPayload(data);
  
  console.log(`🔄 Updating partner discount with ID: ${id}`);
  console.log('📤 Update payload:', JSON.stringify(payload, null, 2));
  
  const response = await apiClient.patch<DiscountDetailResponse>(
    `/api/admin/discounts/partner/${id}/`,
    payload
  );
  
  console.log('📥 Update response:', JSON.stringify(response.data, null, 2));
  
  const responseData = response.data;
  if (responseData && typeof responseData === 'object' && 'data' in responseData && responseData.data) {
    return responseData.data as Discount;
  }
  return responseData as unknown as Discount;
};

/**
 * DELETE /api/admin/discounts/partner/{id}/
 * Delete a partner discount.
 */
export const deletePartnerDiscount = async (id: number): Promise<void> => {
  console.log(`🗑️ Deleting partner discount with ID: ${id}`);
  await apiClient.delete(`/api/admin/discounts/partner/${id}/`);
  console.log('✅ Partner discount deleted successfully');
};

// ─── Legacy / Generic (for backward compatibility) ───────────────────────────

/**
 * @deprecated Use listAdminDiscounts or listPartnerDiscounts instead
 */
export const listDiscounts = async (
  params?: ListDiscountsParams,
): Promise<PaginatedDiscounts> => {
  if (params?.source === 'partner') {
    return listPartnerDiscounts(params);
  }
  return listAdminDiscounts(params);
};

/**
 * @deprecated Use getAdminDiscount or getPartnerDiscount instead
 */
export const getDiscount = async (id: number): Promise<Discount> => {
  try {
    return await getAdminDiscount(id);
  } catch {
    return await getPartnerDiscount(id);
  }
};

/**
 * @deprecated Use updateAdminDiscount or updatePartnerDiscount instead
 */
export const updateDiscount = async (
  id: number,
  data: UpdateDiscountRequest,
): Promise<Discount> => {
  try {
    return await updateAdminDiscount(id, data);
  } catch {
    return await updatePartnerDiscount(id, data);
  }
};

/**
 * @deprecated Use deleteAdminDiscount or deletePartnerDiscount instead
 */
export const deleteDiscount = async (id: number): Promise<void> => {
  try {
    await deleteAdminDiscount(id);
  } catch {
    await deletePartnerDiscount(id);
  }
};

// ─── Export Constants ─────────────────────────────────────────────────────────

export const DISCOUNT_SOURCES = ['admin', 'partner'] as const;
export const DISCOUNT_TYPES = ['percentage', 'fixed'] as const;
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export const DISCOUNT_SOURCE_LABELS: Record<string, string> = {
  admin: 'Platform Funded',
  partner: 'Partner Funded',
};

export const DISCOUNT_TYPE_LABELS: Record<string, string> = {
  percentage: 'Percentage (%)',
  fixed: 'Fixed Amount (₹)',
};

export const DAY_LABELS: Record<string, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};