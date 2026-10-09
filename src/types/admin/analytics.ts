// src/types/admin/analytics.ts
// ─── Analytics Types ──────────────────────────────────────────────────────

export interface AnalyticsClicks {
  otp_send: number;
  otp_new_user: number;
  otp_relogin: number;
  otp_fail: number;
  turf_list: number;
  calendar_open: number;
  razorpay_click: number;
  payment_success: number;
  payment_failure: number;
  booking_create: number;
  advance_pay: number;
  full_pay: number;
  pay_balance_click: number;
  wallet_book: number;
  wallet_topup_click: number;
  wallet_topup_success: number;
  wallet_topup_failure: number;
  booking_cancel: number;
  turf_favorite: number;
}

export type AnalyticsClickKey = keyof AnalyticsClicks;

export interface AnalyticsUseCase {
  click: AnalyticsClickKey | string;
  when: string;
  api: string;
}

export interface AnalyticsOverview {
  from: string;   // YYYY-MM-DD
  to: string;     // YYYY-MM-DD
  total_clicks: number;
  clicks: AnalyticsClicks;
  use_cases: AnalyticsUseCase[];
}

export interface AnalyticsOverviewResponse {
  result: 'success' | 'error';
  message: string;
  data: AnalyticsOverview;
}

export type AnalyticsPeriod = 'today' | 'yesterday' | 'month' | 'year';

export interface AnalyticsQuery {
  period?: AnalyticsPeriod;
  from?: string;      // YYYY-MM-DD (overrides period)
  to?: string;        // YYYY-MM-DD
  turf_id?: number;
  area?: string;
}