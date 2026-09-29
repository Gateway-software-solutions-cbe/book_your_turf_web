// src/api/user/favorites.ts
import apiClient from '../admin/client';
import type { ApiResponse } from '../../types/user/userAuth';
import type {
  FavoritesListResponse,
  ToggleFavoriteRequest,
  ToggleFavoriteResponse,
} from '../../types/user/favorite';

// ─── List Favourites ──────────────────────────────────────────────────────

/**
 * GET /api/user/favorites/
 * Returns the full turf objects for all of the user's favourites.
 */
export const listFavorites = async (): Promise<ApiResponse<FavoritesListResponse>> => {
  const response = await apiClient.get<ApiResponse<FavoritesListResponse>>(
    '/api/user/favorites/'
  );
  return response.data;
};

// ─── Toggle Favourite ─────────────────────────────────────────────────────

/**
 * POST /api/user/favorites/toggle/
 * Likes/unlikes a turf. Body: multipart/form-data { turf_id: number }
 */
export const toggleFavorite = async (
  payload: ToggleFavoriteRequest
): Promise<ApiResponse<ToggleFavoriteResponse>> => {
  const formData = new FormData();
  formData.append('turf_id', String(payload.turf_id));

  console.log('📤 POST /api/user/favorites/toggle/', payload);

  const response = await apiClient.post<ApiResponse<ToggleFavoriteResponse>>(
    '/api/user/favorites/toggle/',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};