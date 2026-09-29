// src/utils/notificationUtils.ts
import type { NotificationType } from '../types/user/notification';

// ─── Icon per notification type ───────────────────────────────────────────
export const notificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'coin_deduction':       return 'coin';
    case 'coin_earned':          return 'coin';
    case 'wallet_topup_success': return 'wallet2';
    case 'wallet_topup_failed':  return 'x-circle';
    case 'wallet_debit':         return 'wallet2';
    case 'booking_confirmed':    return 'calendar-check';
    case 'booking_cancelled':    return 'calendar-x';
    case 'booking_reminder':     return 'bell';
    case 'payment_success':      return 'credit-card';
    case 'payment_failed':       return 'credit-card';
    default:                     return 'bell';
  }
};

// ─── Accent (color theme) per notification type ───────────────────────────
// Returns a suffix used for CSS classes: --success, --warning, --danger, --info
export const notificationAccent = (
  type: NotificationType,
  status?: string
): 'success' | 'warning' | 'danger' | 'info' => {
  if (status === 'failed') return 'danger';
  if (status === 'pending') return 'warning';

  switch (type) {
    case 'coin_deduction':
    case 'coin_earned':
      return 'warning';                 // amber / coin color
    case 'wallet_topup_success':
    case 'wallet_topup_failed':
    case 'wallet_debit':
      return 'info';                    // blue
    case 'booking_confirmed':
    case 'payment_success':
      return 'success';                 // green
    case 'booking_cancelled':
    case 'payment_failed':
      return 'danger';                  // red
    default:
      return 'info';
  }
};

// ─── Friendly "relative time" formatter ───────────────────────────────────
export const formatRelativeTime = (iso: string): string => {
  const d = new Date(iso);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const sec = Math.floor(diffMs / 1000);

  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.floor(hr / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  // Fall back to date if older than a week
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatAbsoluteTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─── "Since last view" tracker (localStorage) ─────────────────────────────
const LAST_VIEWED_KEY = 'byt_notifications_last_viewed_at';

export const getLastViewedAt = (): number | null => {
  const raw = localStorage.getItem(LAST_VIEWED_KEY);
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
};

export const markNotificationsAsViewed = (): void => {
  localStorage.setItem(LAST_VIEWED_KEY, String(Date.now()));
};