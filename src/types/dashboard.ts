// ─── Dashboard Types ───────────────────────────────────────────────────────────
// GET /api/admin/dashboard/dashboard/

export interface DashboardStats {
  total_users:           number;
  total_partners:        number;
  razorpay_revenue_all:  string;   // "0.00"
  razorpay_revenue_month:string;
  wallet_holdings:       string;
  game_coin_holdings:    number;
  active_users:          number;
  active_partners:       number;
}

export interface DashboardResponse {
  result:  'success' | 'fail';
  message: string;
  data:    DashboardStats;
}