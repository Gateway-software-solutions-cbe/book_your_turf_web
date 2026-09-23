import client from "../admin/client";
import type {
  CalendarQuery,
  CalendarSlot,
  BlockedSlot,
  BlockedSlotsQuery,
  BlockSlotPayload,
  BlockSlotResponse,
  UnblockPayload,
  OwnBookingPayload,
  OwnBookingResponse,
  AddPaymentPayload,
  PartnerBooking,
  CancelBookingPayload,
  BookingsListData,
  BookingsQuery,
  PaymentMethod,
  PaymentStatus,
} from "../../types/partner/slot";

const BASE = "/api/partner/slot-management";

interface ApiResponse<T = unknown> {
  result: "success" | "error";
  message: string;
  data: T;
}

// Strip empty/undefined params so the URL stays clean
const buildParams = (obj: Record<string, any>): Record<string, any> => {
  const out: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  });
  return out;
};

export const partnerSlotsApi = {
  // ─── Calendar ──────────────────────────────────────────
  getCalendar: async (query: CalendarQuery) => {
    const { data } = await client.get<ApiResponse<CalendarSlot[]>>(
      `${BASE}/calendar/`,
      { params: buildParams(query) },
    );
    return data;
  },

  // ─── Blocked slots list ────────────────────────────────
  listBlocks: async (query: BlockedSlotsQuery = {}) => {
    const { data } = await client.get<ApiResponse<BlockedSlot[]>>(
      `${BASE}/blocks/`,
      { params: buildParams(query) },
    );
    return data;
  },

  // ─── Block slots ───────────────────────────────────────
  blockSlots: async (payload: BlockSlotPayload) => {
    const { data } = await client.post<ApiResponse<BlockSlotResponse>>(
      `${BASE}/block-slots/`,
      payload,
    );
    return data;
  },

  // ─── Unblock ───────────────────────────────────────────
  unblock: async (payload: UnblockPayload) => {
    const { data } = await client.post<ApiResponse<[]>>(
      `${BASE}/unblock/`,
      payload,
    );
    return data;
  },

  // ─── Own (walk-in) booking ─────────────────────────────
  createOwnBooking: async (payload: OwnBookingPayload) => {
    const { data } = await client.post<ApiResponse<OwnBookingResponse>>(
      `${BASE}/own-booking/`,
      payload,
    );
    return data;
  },

  // ─── Cancel booking ────────────────────────────────────
  cancelBooking: async (payload: CancelBookingPayload) => {
    const { data } = await client.post<ApiResponse<[]>>(
      `${BASE}/cancel-booking/`,
      payload,
    );
    return data;
  },

  // ─── List bookings ─────────────────────────────────────
  listBookings: async (query: BookingsQuery = {}) => {
    const { data } = await client.get<ApiResponse<BookingsListData>>(
      `${BASE}/bookings/`,
      { params: buildParams(query) },
    );
    return data;
  },

  // ─── Collect payment ───────────────────────────────────
  addPayment: async (payload: AddPaymentPayload) => {
    const { data } = await client.post<ApiResponse<PartnerBooking>>(
      `${BASE}/add-payment/`,
      payload,
    );
    return data;
  },
};

// ─── Helpers ───────────────────────────────────────────────
export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Card",
  "UPI",
  "Bank Transfer",
];

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "Pending",
  "Advance Paid",
  "Fully Paid",
];