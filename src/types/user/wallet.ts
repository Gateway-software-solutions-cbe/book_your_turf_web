// src/types/user/wallet.ts

// ─── Wallet Recharge (Top-up) ─────────────────────────────────────────────
export interface WalletRechargeInitiateRequest {
  amount: string;   // decimal as string, e.g. "500"
}

export interface WalletRechargeInitiateResponse {
  razorpay_order_id: string;
  amount: string;         // "1.00"
  currency: string;       // "INR"
  reference_id: string;   // "WAL20260916085340846632" — our internal ref
  key?: string;           // optional — Razorpay public key (not returned by backend)
}

export interface WalletRechargeConfirmRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
}

export interface WalletRechargeConfirmResponse {
  wallet_balance?: string;
  [key: string]: any;
}

// ─── Coin Conversion ──────────────────────────────────────────────────────
export const MIN_COINS_TO_CONVERT = 200;
export const COIN_TO_RUPEE_RATIO = 1; // 200 coins → ₹200.0000

export interface ConvertCoinsRequest {
  coins_to_convert: number;
}

export interface ConvertCoinsResponse {
  game_coins: number;       // remaining coins after conversion
  wallet_balance: string;   // "9729.0000"
}

// ─── Wallet Transactions ──────────────────────────────────────────────────
export type WalletTransactionType = 'credit' | 'debit';
export type WalletTransactionStatus = 'failed' | 'pending' | 'success';

export interface WalletTransaction {
  id: number;
  reference_id: string;                         // "WAL20260916085340846632"
  user_email: string;                           // "user@example.com"
  transaction_type: WalletTransactionType;      // "credit" | "debit"
  amount: string;                               // "1.00"
  previous_balance: string;                     // "9529.00"
  current_balance: string;                      // "9529.00"
  description: string;                          // "Wallet top-up via Razorpay"
  status: WalletTransactionStatus;              // "pending" | "success" | "failed"
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;                           // ISO timestamp
}

/**
 * NOTE: Backend currently returns a FLAT ARRAY (no pagination).
 * Type kept as array for correctness. If backend adds pagination later,
 * switch to PaginatedWalletTransactionsResponse.
 */
export type WalletTransactionsListResponse = WalletTransaction[];

// Kept for future compatibility (if backend adds pagination)
export interface PaginatedWalletTransactionsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: WalletTransaction[];
}

export interface ListWalletTransactionsParams {
  status?: WalletTransactionStatus;
  type?: WalletTransactionType;
}