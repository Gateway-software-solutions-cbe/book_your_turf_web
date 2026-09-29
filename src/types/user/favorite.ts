// src/types/user/favorite.ts
import type { FavoriteTurf } from './turf';

export type FavoritesListResponse = FavoriteTurf[];

// ─── Toggle ───────────────────────────────────────────────────────────────
export interface ToggleFavoriteRequest {
  turf_id: number;
}

export interface ToggleFavoriteResponse {
  status: 'liked' | 'unliked';
  turf_id: number;
}