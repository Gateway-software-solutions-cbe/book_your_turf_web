import client from "../admin/client";
import type {
  PartnerNotificationsHistoryResponse,
  PartnerNotificationsQuery,
} from "../../types/partner/notification";

interface ApiResponse<T = unknown> {
  result: "success" | "error";
  message: string;
  data: T;
}

const NOTIFICATIONS_BASE = "/api/partner/notifications";

/**
 * GET /api/partner/notifications/history/
 * Returns the last week of notifications, paginated.
 */
export const getPartnerNotificationHistory = async (
  query: PartnerNotificationsQuery = {},
): Promise<ApiResponse<PartnerNotificationsHistoryResponse>> => {
  const params: Record<string, number> = {};
  if (query.limit != null) params.limit = query.limit;
  if (query.offset != null) params.offset = query.offset;

  const { data } = await client.get<
    ApiResponse<PartnerNotificationsHistoryResponse>
  >(`${NOTIFICATIONS_BASE}/history/`, { params });
  return data;
};