// src/types/user/notification.ts

export type NotificationType =
  | 'coin_deduction'
  | 'coin_earned'
  | 'wallet_topup_success'
  | 'wallet_topup_failed'
  | 'wallet_debit'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'payment_success'
  | 'payment_failed'
  | 'general'
  | string; // allow future types

export type NotificationStatus = 'success' | 'failed' | 'pending';

export interface AppNotification {
  id: number;
  notification_type: NotificationType;
  title: string;
  body: string;
  sent_at: string;                // ISO timestamp
  status: NotificationStatus;
}

export interface NotificationsHistoryResponse {
  total: number;
  offset: number;
  limit: number;
  notifications: AppNotification[];
}

export interface ListNotificationsParams {
  limit?: number;
  offset?: number;
}