// src/api/user/coins.ts
import apiClient from '../admin/client';
import type { ApiResponse } from '../../types/user/userAuth';
import type {
  CoinTransactionsListResponse,
  ListCoinTransactionsParams,
} from '../../types/user/coins';

// ─── Coin Transactions ────────────────────────────────────────────────────

/**
 * GET /api/user/coins/transactions/
 * Returns all game coin transactions (no pagination).
 * Filters: status ('success' | 'pending' | 'failed'), type ('credit' | 'debit')
 */
export const listCoinTransactions = async (
  params?: ListCoinTransactionsParams
): Promise<ApiResponse<CoinTransactionsListResponse>> => {
  const response = await apiClient.get<ApiResponse<CoinTransactionsListResponse>>(
    '/api/user/coins/transactions/',
    {
      params: {
        ...(params?.status && { status: params.status }),
        ...(params?.type && { type: params.type }),
      },
    }
  );
  return response.data;
};