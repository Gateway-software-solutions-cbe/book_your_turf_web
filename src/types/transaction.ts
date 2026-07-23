// src/types/transaction.ts
// ─── Transaction Types ─────────────────────────────────────────────────────────
// Based on GET /api/admin/transactions/list_transactions/ response
export type TransactionFilterType = 'wallet_topup' | 'online_payment' | 'cash_payment';

export type TransactionType = 
  | 'wallet_topup'
  | 'online_payment'
  | 'cash_payment';

export type TransactionStatus = 
  | 'success'
  | 'failed'
  | 'pending'
  | 'refunded'
  | 'partially_refunded';

export type TransactionMethod = 
  | 'Cash'
  | 'Razorpay'
  | 'Wallet'
  | 'UPI'
  | 'Card'
  | 'Offline';

export interface Transaction {
  id: string;                 // "CASH" or numeric ID
  type: TransactionType;
  amount: string;             // "150.00"
  date: string;               // ISO 8601
  status: TransactionStatus;
  method: TransactionMethod;
  
  // User (nullable for cash payments from partners)
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  
  // Partner
  partner_name: string | null;
  partner_email: string | null;
  partner_business: string | null;
  
  // Turf
  turf_name: string | null;
  turf_code: string | null;
  
  // Booking
  booking_code: string | null;
  booking_id: number | null;
  
  // Reference & Description
  reference: string | null;   // "Collected by Robbinfernandes"
  description: string | null;
}

// ─── List Parameters ──────────────────────────────────────────────────────────

export interface ListTransactionsParams {
  page?: number;
  page_size?: number;
  date_from?: string;         // YYYY-MM-DD
  date_to?: string;           // YYYY-MM-DD
  search?: string;            // Search in user name/email/phone, partner name, turf name, booking code, reference
  type?: TransactionType | 'all';
}

// ─── Paginated Response ──────────────────────────────────────────────────────

export interface PaginatedTransactions {
  count: number;
  next: string | null;
  previous: string | null;
  results: Transaction[];
}

export interface TransactionsListResponse {
  result: 'success' | 'error';
  message: string;
  data: PaginatedTransactions;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const TRANSACTION_TYPES: TransactionType[] = [
  'wallet_topup',
  'online_payment',
  'cash_payment',
];

export const TRANSACTION_STATUSES: TransactionStatus[] = [
  'success',
  'failed',
  'pending',
  'refunded',
  'partially_refunded',
];

export const TRANSACTION_METHODS: TransactionMethod[] = [
  'Cash',
  'Razorpay',
  'Wallet',
  'UPI',
  'Card',
  'Offline',
];

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  wallet_topup: 'Wallet Top-up',
  online_payment: 'Online Payment',
  cash_payment: 'Cash Payment',
};

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  success: 'Success',
  failed: 'Failed',
  pending: 'Pending',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
};

export const TRANSACTION_METHOD_LABELS: Record<TransactionMethod, string> = {
  Cash: 'Cash',
  Razorpay: 'Razorpay',
  Wallet: 'Wallet',
  UPI: 'UPI',
  Card: 'Card',
  Offline: 'Offline',
};