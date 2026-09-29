// src/api/user/wallet.ts
import apiClient from '../admin/client';
import type { ApiResponse } from '../../types/user/userAuth';
import type {
  WalletRechargeInitiateRequest,
  WalletRechargeInitiateResponse,
  WalletRechargeConfirmRequest,
  WalletRechargeConfirmResponse,
  ConvertCoinsRequest,
  ConvertCoinsResponse,
  WalletTransactionsListResponse,
  ListWalletTransactionsParams,
} from '../../types/user/wallet';

// ─── Wallet Top-up ────────────────────────────────────────────────────────

export const initiateWalletRecharge = async (
  payload: WalletRechargeInitiateRequest
): Promise<ApiResponse<WalletRechargeInitiateResponse>> => {
  console.log('📤 POST /api/user/wallet/recharge/initiate/', payload);
  const response = await apiClient.post<ApiResponse<WalletRechargeInitiateResponse>>(
    '/api/user/wallet/recharge/initiate/',
    payload
  );
  return response.data;
};

export const confirmWalletRecharge = async (
  payload: WalletRechargeConfirmRequest
): Promise<ApiResponse<WalletRechargeConfirmResponse>> => {
  console.log('📤 POST /api/user/wallet/recharge/confirm/', payload);
  const response = await apiClient.post<ApiResponse<WalletRechargeConfirmResponse>>(
    '/api/user/wallet/recharge/confirm/',
    payload
  );
  return response.data;
};

// ─── Coin Conversion ──────────────────────────────────────────────────────

export const convertCoins = async (
  payload: ConvertCoinsRequest
): Promise<ApiResponse<ConvertCoinsResponse>> => {
  const formData = new FormData();
  formData.append('coins_to_convert', String(payload.coins_to_convert));

  console.log('📤 POST /api/user/convert-coins/', payload);

  const response = await apiClient.post<ApiResponse<ConvertCoinsResponse>>(
    '/api/user/convert-coins/',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

// ─── Wallet Transactions ──────────────────────────────────────────────────

/**
 * GET /api/user/wallet/transactions/
 * Returns ALL transactions (no pagination) filtered by optional status/type.
 */
export const listWalletTransactions = async (
  params?: ListWalletTransactionsParams
): Promise<ApiResponse<WalletTransactionsListResponse>> => {
  const response = await apiClient.get<ApiResponse<WalletTransactionsListResponse>>(
    '/api/user/wallet/transactions/',
    {
      params: {
        ...(params?.status && { status: params.status }),
        ...(params?.type && { type: params.type }),
      },
    }
  );
  return response.data;
};