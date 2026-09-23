export type PartnerNotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "payment_received"
  | "turf_approved"
  | "turf_rejected"
  | string;

export type PartnerNotificationStatus = "success" | "failed" | "pending";

export interface PartnerNotification {
  id: number;
  notification_type: PartnerNotificationType;
  title: string;
  body: string;
  sent_at: string;          // ISO timestamp
  status: PartnerNotificationStatus;
}

export interface PartnerNotificationsHistoryResponse {
  total: number;
  offset: number;
  limit: number;
  notifications: PartnerNotification[];
}

export interface PartnerNotificationsQuery {
  limit?: number;
  offset?: number;
}