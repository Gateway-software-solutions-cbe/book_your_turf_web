import apiClient from './client';
import type { DashboardStats, DashboardResponse } from '../types/dashboard';

/**
 * GET /api/admin/dashboard/dashboard/
 * Returns aggregated counts and revenue stats.
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await apiClient.get<DashboardResponse>('/api/admin/dashboard/dashboard/');
  return res.data.data;
};