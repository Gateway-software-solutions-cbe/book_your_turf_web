// ─── Dashboard (comprehensive) ──────────────────────────────
export interface PartnerDashboardStats {
  // Venues
  approved_venues_count: number;
  pending_approval_venues_count: number;

  // Completed bookings — all time
  overall_previous_completed_bookings_count: number;
  overall_previous_completed_online_bookings_count: number;
  overall_previous_completed_offline_bookings_count: number;

  // Completed bookings — this month
  overall_previous_completed_this_month_bookings_count: number;
  overall_previous_completed_this_month_online_count: number;
  overall_previous_completed_this_month_offline_count: number;

  // Upcoming
  upcoming_bookings_total_count: number;
  upcoming_bookings_online_count: number;
  upcoming_bookings_offline_count: number;
  upcoming_this_month_online_count: number;
  upcoming_this_month_offline_count: number;
  today_upcoming_online_count: number;
  today_upcoming_offline_count: number;

  // Completed amounts — all time
  overall_previous_completed_booking_amount: string;
  overall_previous_completed_this_month_booking_amount: string;
  overall_previous_completed_online_amount: string;
  overall_previous_completed_this_month_online_amount: string;
  overall_previous_completed_offline_amount: string;
  overall_previous_completed_this_month_offline_amount: string;

  // Upcoming amounts
  overall_upcoming_booking_amount: string;
  upcoming_this_month_booking_amount: string;
  overall_upcoming_online_amount: string;
  upcoming_this_month_online_amount: string;
  overall_upcoming_offline_amount: string;
  upcoming_this_month_offline_amount: string;

  // Pending amounts
  overall_pending_amount_for_completed_bookings: string;
  this_month_pending_amount_for_completed_bookings: string;
  overall_upcoming_pending_amount: string;
  this_month_upcoming_pending_amount: string;
  pending_online_count: number;
  pending_online_amount: string;
  pending_offline_count: number;
  pending_offline_amount: string;

  // Cancelled
  cancelled_bookings_count: number;
  cancelled_bookings_this_month_count: number;
  cancelled_bookings_amount: string;
  cancelled_bookings_this_month_amount: string;

  // Blocks
  unavailable_blocks: number;

  // Collected
  overall_collected_amount: string;
  overall_collected_online_amount: string;
  overall_collected_offline_amount: string;
}

// ─── Pending Balance ────────────────────────────────────────
export type PendingBalanceType = "past" | "upcoming";

export interface PendingBalanceData {
  overall_pending: string;
  online_pending: string;
  offline_pending: string;
}

// ─── Revenue ────────────────────────────────────────────────
export interface RevenueData {
  overall_collected: string;
  online_collected: string;
  offline_collected: string;
  advance_collected: string;
  fully_paid_collected: string;
}