// src/api/turfs.ts
import apiClient from './client';
import type { Turf, CreateTurfRequest, UpdateTurfRequest } from '../types/turf';

// ─── Turfs API ─────────────────────────────────────────────────────────────────

interface PaginatedTurfsResponse {
  result: string;
  message: string;
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    results: Turf[];
  };
}

interface SimplePaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Turf[];
}

/**
 * GET /api/admin/turfs/
 * Supports optional query params: ?status=Approved&partner_id=1
 */
export const listTurfs = async (params?: any): Promise<Turf[]> => {
  try {
    console.log('📦 Fetching turfs with params:', params);
    const response = await apiClient.get("/api/admin/turfs/", { params });
    
    console.log('📦 Raw response:', response.data);
    console.log('📦 Response status:', response.status);
    
    // Try different response formats
    let turfs: Turf[] = [];
    const data = response.data;
    
    // Format 1: { result, message, data: { count, next, previous, results: [...] } }
    if (data?.data?.results && Array.isArray(data.data.results)) {
      turfs = data.data.results;
      console.log('✅ Turfs from data.data.results:', turfs.length);
    }
    // Format 2: { count, next, previous, results: [...] }
    else if (data?.results && Array.isArray(data.results)) {
      turfs = data.results;
      console.log('✅ Turfs from data.results:', turfs.length);
    }
    // Format 3: Direct array
    else if (Array.isArray(data)) {
      turfs = data;
      console.log('✅ Turfs from direct array:', turfs.length);
    }
    // Format 4: { data: [...] }
    else if (data?.data && Array.isArray(data.data)) {
      turfs = data.data;
      console.log('✅ Turfs from data.data (array):', turfs.length);
    }
    // Format 5: { result, message, data: [...] }
    else if (data?.result === 'success' && data?.data && Array.isArray(data.data)) {
      turfs = data.data;
      console.log('✅ Turfs from result.data (array):', turfs.length);
    }
    else {
      console.warn('⚠️ Unknown response format:', data);
      // Try to see if there's any array in the response
      for (const key of Object.keys(data || {})) {
        if (Array.isArray(data[key]) && data[key].length > 0 && data[key][0]?.id) {
          turfs = data[key];
          console.log(`✅ Found turfs in response.${key}:`, turfs.length);
          break;
        }
      }
    }
    
    // Validate that we have turfs with proper structure
    if (turfs.length > 0 && !turfs[0]?.id) {
      console.warn('⚠️ Turfs found but missing id property:', turfs[0]);
    }
    
    return turfs;
  } catch (error: any) {
    console.error('❌ Error fetching turfs:', error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * GET /api/admin/turfs/{id}/
 */
export const getTurf = async (id: number): Promise<Turf> => {
  try {
    console.log(`📦 Fetching turf with ID: ${id}`);
    const response = await apiClient.get(`/api/admin/turfs/${id}/`);
    console.log('📦 Get turf response:', response.data);
    
    // Handle different response formats
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error: any) {
    console.error(`❌ Error fetching turf ${id}:`, error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * POST /api/admin/turfs/
 * Creates a turf for a given partner.
 */
export const createTurf = async (data: CreateTurfRequest): Promise<Turf> => {
  try {
    console.log('📦 Creating turf with data:', data);
    const response = await apiClient.post('/api/admin/turfs/', data);
    console.log('📦 Create turf response:', response.data);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error: any) {
    console.error('❌ Error creating turf:', error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * PATCH /api/admin/turfs/{id}/
 * Partial update. Most importantly: { status: "Approved" | "Rejected" | "Pending" }
 */
export const updateTurf = async (id: number, data: UpdateTurfRequest): Promise<Turf> => {
  try {
    console.log(`📦 Updating turf ${id} with data:`, data);
    const response = await apiClient.patch(`/api/admin/turfs/${id}/`, data);
    console.log('📦 Update turf response:', response.data);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error: any) {
    console.error(`❌ Error updating turf ${id}:`, error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * DELETE /api/admin/turfs/{id}/
 */
export const deleteTurf = async (id: number): Promise<void> => {
  try {
    console.log(`🗑️ Deleting turf ${id}`);
    await apiClient.delete(`/api/admin/turfs/${id}/`);
    console.log(`✅ Turf ${id} deleted successfully`);
  } catch (error: any) {
    console.error(`❌ Error deleting turf ${id}:`, error);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
    throw error;
  }
};