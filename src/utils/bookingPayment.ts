
import type { Booking, BookingPayment } from "../types/admin/booking";

export type DisplayPaymentStatus =
  | "Pending"
  | "Advance Paid"
  | "Partially Paid"
  | "Fully Paid";

export type PaymentStage = "advance" | "balance" | "full";

const EPSILON = 0.01;

const normalize = (value: unknown): string =>
  String(value ?? "").trim().toLowerCase();

const amount = (value: unknown): number => {
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getEffectiveBookingTotal = (booking: Booking): number => {
  const discounted = amount(booking.discounted_total_amount);
  return discounted > 0 ? discounted : amount(booking.total_amount);
};

export const getBookingPayments = (
  booking: Booking,
): BookingPayment[] => {
  return Array.isArray(booking.payments) ? booking.payments : [];
};

const isCashMethod = (payment: BookingPayment): boolean => {
  const method = normalize(payment.method);
  return (
    method === "cash" ||
    method.includes("cash") ||
    method.includes("venue")
  );
};

/**
 * Sort whole payment records chronologically.
 * The original index is preserved so payment references,
 * dates, amounts and methods remain attached to each other.
 */
export const getChronologicalBookingPayments = (
  booking: Booking,
): Array<{ payment: BookingPayment; originalIndex: number }> => {
  return getBookingPayments(booking)
    .map((payment, originalIndex) => ({
      payment,
      originalIndex,
    }))
    .sort((a, b) => {
      const dateA = new Date(a.payment.date).getTime();
      const dateB = new Date(b.payment.date).getTime();

      const validA = Number.isFinite(dateA) ? dateA : 0;
      const validB = Number.isFinite(dateB) ? dateB : 0;

      return validA - validB || a.originalIndex - b.originalIndex;
    });
};

/**
 * Use paid_amount and the recorded transaction total.
 * This handles cases where cash collections are present in
 * payments but are not included in the backend paid_amount.
 */
export const getTotalCollectedAmount = (
  booking: Booking,
): number => {
  const recordedTotal = getBookingPayments(booking).reduce(
    (sum, payment) => sum + amount(payment.amount),
    0,
  );

  return Math.max(amount(booking.paid_amount), recordedTotal);
};

/**
 * Only treat explicit stage values as stages.
 * "online", "wallet", and "cash" are payment categories,
 * not advance/balance stages.
 */
const getExplicitPaymentStage = (
  payment: BookingPayment,
): PaymentStage | null => {
  const type = normalize(payment.type);

  if (
    type === "advance" ||
    type === "advance_paid"
  ) {
    return "advance";
  }

  if (
    type === "balance" ||
    type === "balance_paid"
  ) {
    return "balance";
  }

  if (
    type === "full" ||
    type === "full payment" ||
    type === "fully_paid"
  ) {
    return "full";
  }

  return null;
};

/**
 * index is the payment's ORIGINAL index in booking.payments.
 * Stage calculation always follows transaction dates.
 */
export const getPaymentStage = (
  payment: BookingPayment,
  index: number,
  booking: Booking,
): PaymentStage => {
  const explicitStage = getExplicitPaymentStage(payment);

  if (explicitStage) return explicitStage;

  const total = getEffectiveBookingTotal(booking);
  const chronological = getChronologicalBookingPayments(booking);

  if (total <= 0) {
    return "advance";
  }

  const rank = chronological.findIndex(
    (entry) => entry.originalIndex === index,
  );

  if (rank < 0) return "advance";

  const current = chronological[rank].payment;

  // A single transaction settling the entire booking.
  if (
    rank === 0 &&
    amount(current.amount) >= total - EPSILON
  ) {
    return "full";
  }

  // First partial transaction is the advance.
  if (rank === 0) {
    return "advance";
  }

  // All subsequent transactions are balance collections.
  return "balance";
};

/**
 * Total amount of advance payments.
 * If the API does not supply explicit stage values,
 * the first chronological partial transaction is the advance.
 */
export const getAdvancePaidAmount = (
  booking: Booking,
): number => {
  const payments = getBookingPayments(booking);
  const total = getEffectiveBookingTotal(booking);

  const explicitAdvance = payments.reduce((sum, payment) => {
    return getExplicitPaymentStage(payment) === "advance"
      ? sum + amount(payment.amount)
      : sum;
  }, 0);

  if (explicitAdvance > 0) return explicitAdvance;

  const first = getChronologicalBookingPayments(booking)[0];

  if (!first || total <= 0) return 0;

  return amount(first.payment.amount) < total - EPSILON
    ? amount(first.payment.amount)
    : 0;
};

export const hasBalancePayment = (booking: Booking): boolean => {
  return getBookingPayments(booking).some((payment, index) => {
    return getPaymentStage(payment, index, booking) === "balance";
  });
};

export const hasCashBalancePayment = (booking: Booking): boolean => {
  return getBookingPayments(booking).some((payment, index) => {
    return (
      getPaymentStage(payment, index, booking) === "balance" &&
      isCashMethod(payment)
    );
  });
};

/**
 * Booking-level payment status.
 * Cash is not automatically considered partially paid:
 * settlement depends on the total amount collected.
 */
export const getDisplayPaymentStatus = (
  booking: Booking,
): DisplayPaymentStatus => {
  const total = getEffectiveBookingTotal(booking);
  const collected = getTotalCollectedAmount(booking);

  if (collected <= 0) return "Pending";

  if (total > 0 && collected >= total - EPSILON) {
    return "Fully Paid";
  }

  return hasBalancePayment(booking)
    ? "Partially Paid"
    : "Advance Paid";
};

/**
 * Show the full settled booking total, not a stale paid_amount.
 */
export const getFullyPaidAmount = (booking: Booking): number => {
  const total = getEffectiveBookingTotal(booking);

  return (
    total > 0 &&
    getTotalCollectedAmount(booking) >= total - EPSILON
  )
    ? total
    : 0;
};

/**
 * Keep the advance amount visible even after the booking
 * becomes fully paid.
 */
export const getAdvanceColumnAmount = (
  booking: Booking,
): number => {
  return getAdvancePaidAmount(booking);
};

/**
 * Timeline payment title.
 */
export const getPaymentTimelineTitle = (
  payment: BookingPayment,
  index: number,
  booking: Booking,
): string => {
  const method = String(payment.method || "Payment").trim();
  const stage = getPaymentStage(payment, index, booking);

  if (stage === "full") {
    return `${method} - Fully Paid`;
  }

  if (stage === "balance") {
    return isCashMethod(payment)
      ? "Cash - Balance at Venue"
      : `${method} - Balance`;
  }

  return `${method} - Advance`;
};

/**
 * A balance transaction is Fully Paid when cumulative
 * collections through that transaction settle the total.
 */
export const getPaymentTimelineStatus = (
  payment: BookingPayment,
  index: number,
  booking: Booking,
): DisplayPaymentStatus => {
  const stage = getPaymentStage(payment, index, booking);

  if (stage === "advance") return "Advance Paid";

  const chronological = getChronologicalBookingPayments(booking);
  const rank = chronological.findIndex(
    (entry) => entry.originalIndex === index,
  );

  const cumulative = chronological
    .slice(0, rank + 1)
    .reduce((sum, entry) => sum + amount(entry.payment.amount), 0);

  const total = getEffectiveBookingTotal(booking);

  if (total > 0 && cumulative >= total - EPSILON) {
    return "Fully Paid";
  }

  return "Partially Paid";
};
