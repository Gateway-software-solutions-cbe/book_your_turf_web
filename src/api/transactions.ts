// src/api/transactions.ts
import apiClient from './client';
import type {
  ListTransactionsParams,
  PaginatedTransactions,
  TransactionsListResponse,
} from '../types/transaction';

// ─── Unwrap helper ─────────────────────────────────────────────────────────────

const unwrapTransactions = (body: unknown): PaginatedTransactions => {
  const b = body as TransactionsListResponse;
  if (b?.data && b.data.results !== undefined) {
    return b.data;
  }
  return body as unknown as PaginatedTransactions;
};

// ─── List Transactions ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/transactions/list_transactions/
 * Returns paginated transactions with advanced filters.
 * 
 * @example
 * // Get all transactions for a specific date range
 * const transactions = await listTransactions({
 *   page: 1,
 *   page_size: 20,
 *   date_from: '2026-07-01',
 *   date_to: '2026-07-31',
 *   search: 'Robbin',
 * });
 */
export const listTransactions = async (
  params?: ListTransactionsParams,
): Promise<PaginatedTransactions> => {
  const response = await apiClient.get<TransactionsListResponse>(
    '/api/admin/transactions/list_transactions/',
    { params }
  );
  return unwrapTransactions(response.data);
};

// ─── Export Constants ──────────────────────────────────────────────────────────

export const TRANSACTION_TYPES = [
  'wallet_topup',
  'online_payment',
  'cash_payment',
  'booking_payment',
  'refund',
  'commission',
  'advance_payment',
  'balance_payment',
] as const;

export const TRANSACTION_STATUSES = [
  'success',
  'failed',
  'pending',
  'refunded',
  'partially_refunded',
] as const;

export const TRANSACTION_METHODS = [
  'Cash',
  'Razorpay',
  'Wallet',
  'UPI',
  'Card',
  'Offline',
] as const;

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  wallet_topup: 'Wallet Top-up',
  online_payment: 'Online Payment',
  cash_payment: 'Cash Payment',
  booking_payment: 'Booking Payment',
  refund: 'Refund',
  commission: 'Commission',
  advance_payment: 'Advance Payment',
  balance_payment: 'Balance Payment',
};

export const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  success: 'Success',
  failed: 'Failed',
  pending: 'Pending',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
};

export const TRANSACTION_METHOD_LABELS: Record<string, string> = {
  Cash: 'Cash',
  Razorpay: 'Razorpay',
  Wallet: 'Wallet',
  UPI: 'UPI',
  Card: 'Card',
  Offline: 'Offline',
};