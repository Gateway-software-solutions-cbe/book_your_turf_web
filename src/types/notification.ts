// ─── Notification Types ────────────────────────────────────────────────────────
// GET /api/admin/notifications/history/
// POST /api/admin/notifications/send/

export type NotificationType = 'walk_in_booking' | 'booking' | 'system' | string;
export type NotificationStatus = 'success' | 'failed' | 'pending';

export interface NotificationRecord {
  type:      NotificationType;
  title:     string;
  body:      string;
  recipient: string;   // email or phone
  status:    NotificationStatus;
  sent_at:   string;   // ISO 8601
}

export interface NotificationHistoryResponse {
  result:  'success' | 'error';
  message: string;
  data:    NotificationRecord[];
}

// ─── Send Notification ─────────────────────────────────────────────────────────

export type FilterType = 'all_users' | 'all_partners' | 'specific_users' | 'specific_partners';

export interface SendNotificationRequest {
  title:       string;
  body:        string;
  filter_type: FilterType;
  filter_data: Record<string, unknown>;
}