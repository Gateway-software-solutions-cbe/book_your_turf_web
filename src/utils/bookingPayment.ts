import type {
  Booking,
  BookingPayment,
} from '../types/admin/booking';

export type DisplayPaymentStatus =
  | 'Pending'
  | 'Advance Paid'
  | 'Partially Paid'
  | 'Fully Paid';

export type PaymentStage =
  | 'advance'
  | 'balance'
  | 'full';

const normalize = (
  value: string | undefined | null,
): string => String(value ?? '').trim().toLowerCase();

const amount = (
  value: string | number | undefined | null,
): number => Number.parseFloat(String(value ?? '0')) || 0;

const EPSILON = 0.01;

/**
 * Uses discounted total when available.
 * Falls back to normal total amount.
 */
export const getEffectiveBookingTotal = (
  booking: Booking,
): number => {
  const discountedTotal = amount(
    booking.discounted_total_amount,
  );

  return discountedTotal > 0
    ? discountedTotal
    : amount(booking.total_amount);
};

/**
 * Returns all recorded payments safely.
 */
export const getBookingPayments = (
  booking: Booking,
): BookingPayment[] => {
  return Array.isArray(booking.payments)
    ? booking.payments
    : [];
};

/**
 * Identifies the payment method.
 *
 * Payment method and payment stage are separate concepts.
 */
const isCashMethod = (
  payment: BookingPayment,
): boolean => {
  const method = normalize(payment.method);

  return (
    method === 'cash' ||
    method.includes('cash') ||
    method.includes('venue') ||
    method.includes('@ venue')
  );
};

const isAppMethod = (
  payment: BookingPayment,
): boolean => {
  const method = normalize(payment.method);

  return (
    method.includes('razorpay') ||
    method.includes('wallet')
  );
};

/**
 * Reads an explicit advance/balance stage if the API happens
 * to provide one. Otherwise, the stage is derived from amounts.
 *
 * IMPORTANT:
 * payment.type values such as "online", "wallet", and "cash"
 * identify payment categories, NOT advance/balance stages.
 */
const getExplicitPaymentStage = (
  payment: BookingPayment,
): PaymentStage | null => {
  const type = normalize(payment.type);

  if (
    type.includes('advance') ||
    type === 'advance_paid'
  ) {
    return 'advance';
  }

  if (
    type.includes('balance') ||
    type === 'balance_paid'
  ) {
    return 'balance';
  }

  if (
    type.includes('full payment') ||
    type === 'full' ||
    type === 'fully_paid'
  ) {
    return 'full';
  }

  return null;
};

/**
 * Determines the purpose of a payment for display in the timeline.
 *
 * Rules:
 * - A single payment covering the entire booking is Full Payment.
 * - The first payment below the booking total is Advance.
 * - A subsequent payment that completes the total is Balance.
 * - A subsequent payment that does not complete the total is
 *   also treated as a balance/installment collection.
 * - Explicit advance/balance information takes precedence.
 *
 * This function changes UI labels only; it does not modify API data.
 */
export const getPaymentStage = (
  payment: BookingPayment,
  index: number,
  booking: Booking,
): PaymentStage => {
  const explicitStage = getExplicitPaymentStage(payment);

  if (explicitStage) {
    return explicitStage;
  }

  const payments = getBookingPayments(booking);
  const total = getEffectiveBookingTotal(booking);
  const currentAmount = amount(payment.amount);

  if (total <= 0) {
    return index === 0 ? 'advance' : 'balance';
  }

  // A single transaction that covers the total is a full payment.
  if (
    payments.length === 1 &&
    currentAmount >= total - EPSILON
  ) {
    return 'full';
  }

  // A first transaction covering the total is also full payment,
  // even if the API happens to contain other non-payment records.
  if (
    index === 0 &&
    currentAmount >= total - EPSILON
  ) {
    return 'full';
  }

  // For subsequent transactions, calculate the cumulative amount
  // recorded through the current payment.
  const cumulativePaid = payments
    .slice(0, index + 1)
    .reduce(
      (sum, item) => sum + amount(item.amount),
      0,
    );

  if (index === 0) {
    return 'advance';
  }

  // A subsequent transaction is a balance/installment payment.
  // It completes the booking if the cumulative amount reaches total.
  if (cumulativePaid >= total - EPSILON) {
    return 'balance';
  }

  return 'balance';
};

/**
 * Advance amount collected.
 *
 * Uses explicit advance-stage payments when available.
 * Otherwise, for a booking that has only received an advance,
 * falls back to the backend's paid_amount.
 */
export const getAdvancePaidAmount = (
  booking: Booking,
): number => {
  const payments = getBookingPayments(booking);

  const explicitAdvanceAmount = payments
    .filter(
      (payment) =>
        getExplicitPaymentStage(payment) === 'advance',
    )
    .reduce(
      (sum, payment) => sum + amount(payment.amount),
      0,
    );

  if (explicitAdvanceAmount > 0) {
    return explicitAdvanceAmount;
  }

  const backendStatus = normalize(
    booking.payment_status,
  );

  if (
    backendStatus === 'advance paid' &&
    amount(booking.paid_amount) > 0
  ) {
    return amount(booking.paid_amount);
  }

  // For the standard API response, the first partial payment
  // is the advance when there are multiple recorded payments.
  if (
    payments.length > 0 &&
    getPaymentStage(payments[0], 0, booking) === 'advance'
  ) {
    return amount(payments[0].amount);
  }

  return 0;
};

/**
 * Checks whether the booking contains a balance transaction.
 */
export const hasBalancePayment = (
  booking: Booking,
): boolean => {
  return getBookingPayments(booking).some(
    (payment, index) =>
      getPaymentStage(payment, index, booking) === 'balance',
  );
};

/**
 * Checks whether a balance/installment was collected in cash
 * or at the venue.
 */
export const hasCashBalancePayment = (
  booking: Booking,
): boolean => {
  return getBookingPayments(booking).some(
    (payment, index) =>
      getPaymentStage(payment, index, booking) === 'balance' &&
      isCashMethod(payment),
  );
};

/**
 * Booking-level payment status.
 *
 * Existing business rule retained:
 * - No payment -> Pending
 * - Cash/venue balance -> Partially Paid
 * - Fully settled through app payments -> Fully Paid
 * - Only advance -> Advance Paid
 */
export const getDisplayPaymentStatus = (
  booking: Booking,
): DisplayPaymentStatus => {
  const total = getEffectiveBookingTotal(booking);
  const paid = amount(booking.paid_amount);
  const payments = getBookingPayments(booking);

  if (paid <= 0 && payments.length === 0) {
    return 'Pending';
  }

  if (hasCashBalancePayment(booking)) {
    return 'Partially Paid';
  }

  if (
    total > 0 &&
    paid >= total - EPSILON
  ) {
    return 'Fully Paid';
  }

  if (paid > 0 || payments.length > 0) {
    return 'Advance Paid';
  }

  return 'Pending';
};

/**
 * Amount displayed in the Fully Paid table column.
 */
export const getFullyPaidAmount = (
  booking: Booking,
): number => {
  return getDisplayPaymentStatus(booking) === 'Fully Paid'
    ? getEffectiveBookingTotal(booking)
    : 0;
};

/**
 * Amount displayed in the Advance Paid table column.
 *
 * Retains the existing convention:
 * fully paid bookings show 0 in this column.
 */
export const getAdvanceColumnAmount = (
  booking: Booking,
): number => {
  const status = getDisplayPaymentStatus(booking);

  if (
    status === 'Fully Paid' ||
    status === 'Pending'
  ) {
    return 0;
  }

  return getAdvancePaidAmount(booking);
};

/**
 * Payment Timeline title.
 *
 * Examples:
 * Razorpay - Advance
 * Razorpay - Fully Paid
 * Razorpay - Balance
 * Wallet - Advance
 * Wallet - Fully Paid
 * Wallet - Balance
 * Cash - Balance at Venue
 */
export const getPaymentTimelineTitle = (
  payment: BookingPayment,
  index: number,
  booking: Booking,
): string => {
  const method = String(
    payment.method || 'Payment',
  ).trim();

  const stage = getPaymentStage(
    payment,
    index,
    booking,
  );

  if (stage === 'balance') {
    return isCashMethod(payment)
      ? 'Cash - Balance at Venue'
      : `${method} - Balance`;
  }

  if (stage === 'full') {
    return `${method} - Fully Paid`;
  }

  return `${method} - Advance`;
};

/**
 * Status badge displayed beside each timeline payment.
 *
 * A cash/venue balance retains the existing partially-paid
 * booking business rule. Other balance transactions are fully
 * settled when the cumulative payment reaches the booking total.
 */
export const getPaymentTimelineStatus = (
  payment: BookingPayment,
  index: number,
  booking: Booking,
): DisplayPaymentStatus => {
  const stage = getPaymentStage(
    payment,
    index,
    booking,
  );

  if (stage === 'advance') {
    return 'Advance Paid';
  }

  if (stage === 'full') {
    return 'Fully Paid';
  }

  if (isCashMethod(payment)) {
    return 'Partially Paid';
  }

  const cumulativePaid = getBookingPayments(booking)
    .slice(0, index + 1)
    .reduce(
      (sum, item) => sum + amount(item.amount),
      0,
    );

  const total = getEffectiveBookingTotal(booking);

  return total > 0 && cumulativePaid >= total - EPSILON
    ? 'Fully Paid'
    : 'Partially Paid';
};