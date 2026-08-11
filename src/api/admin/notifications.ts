// src/api/notifications.ts
import apiClient from './client';
import type { NotificationHistoryResponse, SendNotificationRequest } from '../../types/admin/notification';

export const getNotificationHistory = async (): Promise<NotificationHistoryResponse> => {
  const res = await apiClient.get<NotificationHistoryResponse>('/api/admin/notifications/history/');
  return res.data;
};

export const sendNotification = async (data: SendNotificationRequest): Promise<{ message: string }> => {
  const response = await apiClient.post<{ result: string; message: string; data: unknown[] }>(
    '/api/admin/notifications/send/',
    data
  );
  return { message: response.data.message };
};