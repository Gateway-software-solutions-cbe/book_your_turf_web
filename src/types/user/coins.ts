// src/types/user/coins.ts

// ─── Coin Transaction Types ───────────────────────────────────────────────
export type CoinTransactionType = 'credit' | 'debit';
export type CoinTransactionStatus = 'failed' | 'pending' | 'success';

export interface CoinTransactionBooking {
  id: number;
  booking_id: string;
  turf_name?: string;
  // Backend may expand this — kept flexible
  [key: string]: any;
}

export interface CoinTransaction {
  id: number;
  reference_id: string;                         // "GCN20260916090725279782"
  user_email: string;
  transaction_type: CoinTransactionType;        // "credit" | "debit"
  amount: number;                               // 200 (number, NOT string)
  previous_balance: number;                     // 300
  current_balance: number;                      // 100
  description: string;
  status: CoinTransactionStatus;
  booking: CoinTransactionBooking | null;       // linked booking, if any
  created_at: string;                           // ISO timestamp
}

/**
 * Backend returns a FLAT ARRAY — no pagination.
 */
export type CoinTransactionsListResponse = CoinTransaction[];

export interface ListCoinTransactionsParams {
  status?: CoinTransactionStatus;
  type?: CoinTransactionType;
}