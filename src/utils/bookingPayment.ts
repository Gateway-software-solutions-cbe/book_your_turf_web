import type {
  Booking,
  BookingPayment,
  PaymentStatus,
} from '../types/admin/booking';

export type DisplayPaymentStatus =
  | 'Pending'
  | 'Advance Paid'
  | 'Partially Paid'
  | 'Fully Paid';

const normalize = (value: string | undefined | null): string =>
  String(value ?? '').trim().toLowerCase();

const amount = (value: string | number | undefined | null): number =>
  Number.parseFloat(String(value ?? '0')) || 0;

/**
 * Uses discounted total when available.
 * Falls back to normal total amount.
 */
export const getEffectiveBookingTotal = (booking: Booking): number => {
  const discountedTotal = amount(booking.discounted_total_amount);

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
  return Array.isArray(booking.payments) ? booking.payments : [];
};

/**
 * Advance amount = payments explicitly recorded as advance.
 *
 * If backend does not send payment.type as "advance", we fall back
 * to paid_amount when the booking is still only advance-paid.
 */
export const getAdvancePaidAmount = (
  booking: Booking,
): number => {
  const payments = getBookingPayments(booking);

  const advanceAmount = payments
    .filter((payment) => {
      const type = normalize(payment.type);

      return (
        type.includes('advance') ||
        type === 'advance_paid'
      );
    })
    .reduce((sum, payment) => sum + amount(payment.amount), 0);

  if (advanceAmount > 0) {
    return advanceAmount;
  }

  const backendStatus = normalize(booking.payment_status);

  if (
    backendStatus === 'advance paid' &&
    amount(booking.paid_amount) > 0
  ) {
    return amount(booking.paid_amount);
  }

  return 0;
};

/**
 * Determines whether a balance payment exists.
 *
 * If payment.type is available, we use it.
 * Otherwise, any payment after the first is considered a balance payment.
 */
export const hasBalancePayment = (
  booking: Booking,
): boolean => {
  const payments = getBookingPayments(booking);

  return payments.some((payment, index) => {
    const type = normalize(payment.type);

    return (
      type.includes('balance') ||
      type === 'balance_paid' ||
      index > 0
    );
  });
};

/**
 * Cash / venue balance means:
 *
 * Advance paid online first
 * +
 * remaining balance collected through Cash / @ Venue.
 */
export const hasCashBalancePayment = (
  booking: Booking,
): boolean => {
  const payments = getBookingPayments(booking);

  return payments.some((payment, index) => {
    const method = normalize(payment.method);
    const type = normalize(payment.type);

    const isCash =
      method === 'cash' ||
      method.includes('cash') ||
      method.includes('venue');

    const isBalance =
      type.includes('balance') ||
      type === 'balance_paid' ||
      index > 0;

    return isCash && isBalance;
  });
};

/**
 * Determines the UI status.
 *
 * Rules:
 * 1. No payment -> Pending
 * 2. Balance through Razorpay / Wallet -> Fully Paid
 * 3. Balance through Cash / Venue -> Partially Paid
 * 4. Paid amount reaches total -> Fully Paid
 * 5. Only advance -> Advance Paid
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

  const cashBalance = hasCashBalancePayment(booking);

  if (cashBalance) {
    return 'Partially Paid';
  }

  const appBalance = payments.some((payment, index) => {
    const method = normalize(payment.method);
    const type = normalize(payment.type);

    const isAppPayment =
      method.includes('razorpay') ||
      method.includes('wallet');

    const isBalance =
      type.includes('balance') ||
      type === 'balance_paid' ||
      index > 0;

    return isAppPayment && isBalance;
  });

  if (appBalance) {
    return 'Fully Paid';
  }

  if (paid >= total && total > 0) {
    return 'Fully Paid';
  }

  if (paid > 0 || payments.length > 0) {
    return 'Advance Paid';
  }

  return 'Pending';
};

/**
 * Amount to show under "Fully Paid".
 *
 * Only a genuinely app-fully-paid booking gets the full total here.
 */
export const getFullyPaidAmount = (
  booking: Booking,
): number => {
  return getDisplayPaymentStatus(booking) === 'Fully Paid'
    ? getEffectiveBookingTotal(booking)
    : 0;
};

/**
 * Amount to show under "Advance Paid".
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
 * Returns a human-readable payment timeline title.
 *
 * Examples:
 * Razorpay - Advance
 * Razorpay - Balance
 * Wallet - Advance
 * Wallet - Balance
 * Balance - Cash / @ Venue
 */
export const getPaymentTimelineTitle = (
  payment: BookingPayment,
  index: number,
  booking: Booking,
): string => {
  const method = String(payment.method || 'Payment');
  const normalizedMethod = normalize(payment.method);
  const type = normalize(payment.type);

  const isCash =
    normalizedMethod === 'cash' ||
    normalizedMethod.includes('cash') ||
    normalizedMethod.includes('venue');

  const isAdvance =
    type.includes('advance') ||
    type === 'advance_paid' ||
    (index === 0 && !hasBalancePayment(booking));

  const isBalance =
    type.includes('balance') ||
    type === 'balance_paid' ||
    index > 0;

  if (isBalance) {
    if (isCash) {
      return 'Balance - Cash / @ Venue';
    }

    return `${method} - Balance`;
  }

  if (isAdvance) {
    return `${method} - Advance`;
  }

  return method;
};

/**
 * Status shown beside each timeline payment.
 */
export const getPaymentTimelineStatus = (
  payment: BookingPayment,
  index: number,
  booking: Booking,
): DisplayPaymentStatus => {
  const method = normalize(payment.method);
  const type = normalize(payment.type);

  const isCash =
    method === 'cash' ||
    method.includes('cash') ||
    method.includes('venue');

  const isBalance =
    type.includes('balance') ||
    type === 'balance_paid' ||
    index > 0;

  if (isBalance && isCash) {
    return 'Partially Paid';
  }

  if (isBalance) {
    return 'Fully Paid';
  }

  if (getDisplayPaymentStatus(booking) === 'Fully Paid') {
    return 'Fully Paid';
  }

  return 'Advance Paid';
};