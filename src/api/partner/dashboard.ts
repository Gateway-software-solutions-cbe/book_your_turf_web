import client from "../admin/client";
import type {
  PartnerDashboardStats,
  PendingBalanceData,
  PendingBalanceType,
  RevenueData,
} from "../../types/partner/dashboard";

interface ApiResponse<T = unknown> {
  result: "success" | "error";
  message: string;
  data: T;
}

const BASE = "/api/partner/slot-management";

export const partnerDashboardApi = {
  /** GET /api/partner/slot-management/dashboard/ */
  getDashboard: async () => {
    const { data } = await client.get<ApiResponse<PartnerDashboardStats>>(
      `${BASE}/dashboard/`,
    );
    return data;
  },

  /** GET /api/partner/slot-management/pending-balance/?type=past|upcoming */
  getPendingBalance: async (type: PendingBalanceType) => {
    const { data } = await client.get<ApiResponse<PendingBalanceData>>(
      `${BASE}/pending-balance/`,
      { params: { type } },
    );
    return data;
  },

  /** GET /api/partner/slot-management/revenue/ */
  getRevenue: async () => {
    const { data } = await client.get<ApiResponse<RevenueData>>(
      `${BASE}/revenue/`,
    );
    return data;
  },
};