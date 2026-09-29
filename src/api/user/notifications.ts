// src/api/user/notifications.ts
import apiClient from '../admin/client';
import type { ApiResponse } from '../../types/user/userAuth';
import type {
  NotificationsHistoryResponse,
  ListNotificationsParams,
} from '../../types/user/notification';

/**
 * GET /api/user/notifications/history/
 * Paginated notification history (last week).
 */
export const listNotifications = async (
  params?: ListNotificationsParams
): Promise<ApiResponse<NotificationsHistoryResponse>> => {
  const response = await apiClient.get<ApiResponse<NotificationsHistoryResponse>>(
    '/api/user/notifications/history/',
    {
      params: {
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
      },
    }
  );
  return response.data;
};