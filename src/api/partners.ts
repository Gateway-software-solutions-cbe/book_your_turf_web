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
    let allPartners: Partner[] = [];
    let nextUrl: string | null = '/api/admin/partners/';
    let pageCount: number = 0;

    // Fetch all pages
    while (nextUrl) {
      pageCount++;
      console.log(`📦 Fetching page ${pageCount}...`);
      
      const response = await apiClient.get<PaginatedPartnersResponse>(nextUrl);
      
      console.log(`📦 Page ${pageCount} response:`, response.data);
      console.log(`📦 Page ${pageCount} status:`, response.status);
      
      const responseData: PaginatedPartnersResponse = response.data;
      
      // Extract partners from response
      let partners: Partner[] = [];
      if (responseData?.data?.results && Array.isArray(responseData.data.results)) {
        partners = responseData.data.results;
        console.log(`✅ Page ${pageCount} partners:`, partners.length);
      } else {
        console.warn(`⚠️ Unknown response format on page ${pageCount}:`, responseData);
        break;
      }
      
      // Add to collection
      allPartners = [...allPartners, ...partners];
      console.log(`📊 Total partners so far: ${allPartners.length}`);
      
      // Check for next page
      nextUrl = responseData.data?.next || null;
      
      // If nextUrl is a full URL, extract the path
      if (nextUrl) {
        try {
          const url: URL = new URL(nextUrl);
          nextUrl = url.pathname + url.search;
        } catch {
          // If it's already a path, keep it as is
          // nextUrl already contains the path
        }
      }
    }

    console.log(`✅ Total partners fetched: ${allPartners.length}`);
    console.log(`📊 Pages fetched: ${pageCount}`);
    
    // Validate that we have partners with proper structure
    if (allPartners.length > 0 && !allPartners[0]?.id) {
      console.warn('⚠️ Partners found but missing id property:', allPartners[0]);
    }
    
    return allPartners;
  } catch (error: unknown) {
    console.error('❌ Error fetching partners:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { status?: number; data?: unknown } };
      if (err.response) {
        console.error('❌ Response status:', err.response.status);
        console.error('❌ Response data:', err.response.data);
      }
    }
    // Return empty array instead of throwing to avoid breaking the UI
    return [];
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