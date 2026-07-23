// src/api/partners.ts
import apiClient from './client';
import type { Partner, CreatePartnerRequest, UpdatePartnerRequest, PartnerTurf } from '../types/partner';

// ─── Partners API ──────────────────────────────────────────────────────────────

interface PaginatedPartnersResponse {
  result: string;
  message: string;
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: Partner[];
  };
}

interface SimplePaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Partner[];
}

interface PaginatedPartnerTurfsResponse {
  result: string;
  message: string;
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: PartnerTurf[];
  };
}

interface PartnerDetailResponse {
  result: string;
  message: string;
  data: Partner;
}

// Create response type - matches your API response structure
interface CreatePartnerResponse {
  result: string;
  message: string;
  data: Partner;
}

/**
 * GET /api/admin/partners/
 * Returns all channel partners.
 */
export const listPartners = async (): Promise<Partner[]> => {
  try {
    console.log('📦 Fetching partners...');
    const response = await apiClient.get("/api/admin/partners/");
    
    console.log('📦 Raw partners response:', response.data);
    console.log('📦 Response status:', response.status);
    
    // Try different response formats
    let partners: Partner[] = [];
    const data = response.data;
    
    // Format 1: { result, message, data: { count, next, previous, results: [...] } }
    if (data?.data?.results && Array.isArray(data.data.results)) {
      partners = data.data.results;
      console.log('✅ Partners from data.data.results:', partners.length);
    }
    // Format 2: { count, next, previous, results: [...] }
    else if (data?.results && Array.isArray(data.results)) {
      partners = data.results;
      console.log('✅ Partners from data.results:', partners.length);
    }
    // Format 3: Direct array
    else if (Array.isArray(data)) {
      partners = data;
      console.log('✅ Partners from direct array:', partners.length);
    }
    // Format 4: { data: [...] }
    else if (data?.data && Array.isArray(data.data)) {
      partners = data.data;
      console.log('✅ Partners from data.data (array):', partners.length);
    }
    // Format 5: { result, message, data: [...] }
    else if (data?.result === 'success' && data?.data && Array.isArray(data.data)) {
      partners = data.data;
      console.log('✅ Partners from result.data (array):', partners.length);
    }
    else {
      console.warn('⚠️ Unknown partners response format:', data);
      // Try to see if there's any array in the response
      for (const key of Object.keys(data || {})) {
        if (Array.isArray(data[key]) && data[key].length > 0 && data[key][0]?.id) {
          partners = data[key];
          console.log(`✅ Found partners in response.${key}:`, partners.length);
          break;
        }
      }
    }
    
    // Validate that we have partners with proper structure
    if (partners.length > 0 && !partners[0]?.id) {
      console.warn('⚠️ Partners found but missing id property:', partners[0]);
    }
    
    return partners;
  } catch (error: any) {
    console.error('❌ Error fetching partners:', error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * GET /api/admin/partners/{id}/
 */
export const getPartner = async (id: number): Promise<Partner> => {
  try {
    console.log(`📦 Fetching partner with ID: ${id}`);
    const response = await apiClient.get(`/api/admin/partners/${id}/`);
    console.log('📦 Get partner response:', response.data);
    
    // Handle different response formats
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error: any) {
    console.error(`❌ Error fetching partner ${id}:`, error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * POST /api/admin/partners/
 */
export const createPartner = async (data: CreatePartnerRequest): Promise<Partner> => {
  try {
    console.log('📦 Creating partner with data:', data);
    const response = await apiClient.post('/api/admin/partners/', data);
    console.log('📦 Create partner response:', response.data);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data as unknown as Partner;
  } catch (error: any) {
    console.error('❌ Error creating partner:', error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * PATCH /api/admin/partners/{id}/
 * Partial update — only send fields that changed.
 */
export const updatePartner = async (
  id: number,
  data: UpdatePartnerRequest,
): Promise<Partner> => {
  try {
    console.log(`📦 Updating partner ${id} with data:`, data);
    const response = await apiClient.patch(`/api/admin/partners/${id}/`, data);
    console.log('📦 Update partner response:', response.data);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data as unknown as Partner;
  } catch (error: any) {
    console.error(`❌ Error updating partner ${id}:`, error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * DELETE /api/admin/partners/{id}/
 */
export const deletePartner = async (id: number): Promise<void> => {
  try {
    console.log(`🗑️ Deleting partner ${id}`);
    await apiClient.delete(`/api/admin/partners/${id}/`);
    console.log(`✅ Partner ${id} deleted successfully`);
  } catch (error: any) {
    console.error(`❌ Error deleting partner ${id}:`, error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * GET /api/admin/partners/{id}/turfs/
 */
export const getPartnerTurfs = async (
  id: number
): Promise<PartnerTurf[]> => {
  try {
    console.log(`📦 Fetching turfs for partner ${id}`);
    const response = await apiClient.get(`/api/admin/partners/${id}/turfs/`);
    console.log('📦 Partner turfs response:', response.data);
    
    // Try different response formats
    let turfs: PartnerTurf[] = [];
    const data = response.data;
    
    if (data?.data?.results && Array.isArray(data.data.results)) {
      turfs = data.data.results;
    } else if (data?.results && Array.isArray(data.results)) {
      turfs = data.results;
    } else if (Array.isArray(data)) {
      turfs = data;
    } else if (data?.data && Array.isArray(data.data)) {
      turfs = data.data;
    }
    
    return turfs;
  } catch (error: any) {
    console.error(`❌ Error fetching turfs for partner ${id}:`, error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    return [];
  }
};