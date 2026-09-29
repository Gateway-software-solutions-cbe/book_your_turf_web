// src/api/turfs.ts
import apiClient from './client';
import type { Turf, CreateTurfRequest, UpdateTurfRequest } from '../../types/admin/turf';

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

/**
 * GET /api/admin/turfs/
 * Supports optional query params: ?status=Approved&partner_id=1
 * Fetches ALL pages automatically.
 */
export const listTurfs = async (params?: Record<string, unknown>): Promise<Turf[]> => {
  try {
    console.log('📦 Fetching turfs with params:', params);
    
    let allTurfs: Turf[] = [];
    let nextUrl: string | null = '/api/admin/turfs/';
    let pageCount: number = 0;
    
    // Build query string from params
    let queryString: string = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      queryString = searchParams.toString();
      if (queryString) {
        nextUrl = `/api/admin/turfs/?${queryString}`;
      }
    }

    // Fetch all pages
    while (nextUrl) {
      pageCount++;
      console.log(`📦 Fetching turfs page ${pageCount}...`);
      
      const response = await apiClient.get<PaginatedTurfsResponse>(nextUrl);
      
      console.log(`📦 Page ${pageCount} response status:`, response.status);
      
      const responseData: PaginatedTurfsResponse = response.data;
      
      // Extract turfs from response
      let turfs: Turf[] = [];
      if (responseData?.data?.results && Array.isArray(responseData.data.results)) {
        turfs = responseData.data.results;
        console.log(`✅ Page ${pageCount} turfs:`, turfs.length);
      } else {
        console.warn(`⚠️ Unknown response format on page ${pageCount}:`, responseData);
        break;
      }
      
      // Add to collection
      allTurfs = [...allTurfs, ...turfs];
      console.log(`📊 Total turfs so far: ${allTurfs.length}`);
      
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

    console.log(`✅ Total turfs fetched: ${allTurfs.length}`);
    console.log(`📊 Pages fetched: ${pageCount}`);
    
    // Validate that we have turfs with proper structure
    if (allTurfs.length > 0 && !allTurfs[0]?.id) {
      console.warn('⚠️ Turfs found but missing id property:', allTurfs[0]);
    }
    
    return allTurfs;
  } catch (error: unknown) {
    console.error('❌ Error fetching turfs:', error);
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
 * GET /api/admin/turfs/{id}/
 */
export const getTurf = async (id: number): Promise<Turf> => {
  try {
    console.log(`📦 Fetching turf with ID: ${id}`);
    const response = await apiClient.get<{ data: Turf }>(`/api/admin/turfs/${id}/`);
    console.log('📦 Get turf response:', response.data);
    
    // Handle different response formats
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data as unknown as Turf;
  } catch (error: unknown) {
    console.error(`❌ Error fetching turf ${id}:`, error);
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { status?: number; data?: unknown } };
      if (err.response) {
        console.error('❌ Response status:', err.response.status);
        console.error('❌ Response data:', err.response.data);
      }
    }
    throw error;
  }
};

/**
 * POST /api/admin/turfs/
 * Creates a turf for a given partner.
 */
export const createTurf = async (data: FormData | CreateTurfRequest): Promise<Turf> => {
  try {
    const isFormData = data instanceof FormData;
    
    // Log FormData contents if it's FormData
    if (isFormData) {
      console.log('📦 Creating turf with FormData:');
      for (const [key, value] of data.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    } else {
      console.log('📦 Creating turf with data:', data);
    }
    
    const response = await apiClient.post<{ data: Turf }>('/api/admin/turfs/', data, {
      headers: isFormData ? {
        'Content-Type': 'multipart/form-data',
      } : undefined,
    });
    
    console.log('📦 Create turf response:', response.data);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data as unknown as Turf;
  } catch (error: unknown) {
    console.error('❌ Error creating turf:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { status?: number; data?: unknown } };
      if (err.response) {
        console.error('❌ Response status:', err.response.status);
        console.error('❌ Response data:', err.response.data);
      }
    }
    throw error;
  }
};

/**
 * PATCH /api/admin/turfs/{id}/
 * Partial update.
 */
export const updateTurf = async (id: number, data: FormData | UpdateTurfRequest): Promise<Turf> => {
  try {
    const isFormData = data instanceof FormData;
    
    // Log FormData contents if it's FormData
    if (isFormData) {
      console.log(`📦 Updating turf ${id} with FormData:`);
      for (const [key, value] of data.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    } else {
      console.log(`📦 Updating turf ${id} with data:`, data);
    }
    
    const response = await apiClient.patch<{ data: Turf }>(`/api/admin/turfs/${id}/`, data, {
      headers: isFormData ? {
        'Content-Type': 'multipart/form-data',
      } : undefined,
    });
    
    console.log('📦 Update turf response:', response.data);
    
    if (response.data?.data) {
      return response.data.data;
    }
    return response.data as unknown as Turf;
  } catch (error: unknown) {
    console.error(`❌ Error updating turf ${id}:`, error);
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { status?: number; data?: unknown } };
      if (err.response) {
        console.error('❌ Response status:', err.response.status);
        console.error('❌ Response data:', err.response.data);
      }
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
  } catch (error: unknown) {
    console.error(`❌ Error deleting turf ${id}:`, error);
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { status?: number; data?: unknown } };
      if (err.response) {
        console.error('❌ Response status:', err.response.status);
        console.error('❌ Response data:', err.response.data);
      }
    }
    throw error;
  }
};