// src/api/admin/analytics.ts
import apiClient from './client';
import type {
  AnalyticsOverview,
  AnalyticsOverviewResponse,
  AnalyticsQuery,
} from '../../types/admin/analytics';

/**
 * GET /api/admin/analytics/overview/
 * One call returns every click count for today / a period / a date range.
 * `from` + `to` override `period` when both are set.
 */
export const getAnalyticsOverview = async (
  query: AnalyticsQuery = {},
): Promise<AnalyticsOverview> => {
  // Drop empty strings / undefined so we don't send `?area=&turf_id=`
  const params: Record<string, string | number> = {};
  if (query.period) params.period = query.period;
  if (query.from)   params.from = query.from;
  if (query.to)     params.to = query.to;
  if (query.turf_id) params.turf_id = query.turf_id;
  if (query.area)   params.area = query.area;

  const res = await apiClient.get<AnalyticsOverviewResponse>(
    '/api/admin/analytics/overview/',
    { params },
  );
  return res.data.data;
};