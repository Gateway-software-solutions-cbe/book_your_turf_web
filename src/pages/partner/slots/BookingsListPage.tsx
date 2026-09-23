import React, { useCallback, useEffect, useMemo, useState } from "react";
import { partnerTurfsApi } from "../../../api/partner/turfs";
import { partnerSlotsApi } from "../../../api/partner/slots";
import type { PartnerTurf } from "../../../types/partner/turf";
import type {
  PartnerBooking,
  BlockedSlot,
  BookingsQuery,
} from "../../../types/partner/slot";
import BookingCard from "./components/BookingCard";
import BlockCard from "./components/BlockCard";
import BookingsFiltersModal, {
  BookingsFilters,
} from "./components/BookingsFiltersModal";
import PaymentCollectModal from "./components/PaymentCollectModal";
import "./BookingsListPage.css";

type TabKey = "bookings" | "blocks";
type QuickFilter = "today" | "all" | "pending";

const emptyFilters: BookingsFilters = {
  search: "",
  turfId: null,
  bookingType: null,
  courtNumber: null,
  paymentStatus: null,
  singleDay: true,
  date: null,
  startDate: null,
  endDate: null,
  showActive: true,
  showCancelled: false,
};

const todayIso = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** Does this booking have any slot on the given date? */
const hasSlotOnDate = (b: PartnerBooking, iso: string): boolean =>
  b.slots.some((s) => s.date === iso);

const BookingsListPage: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("bookings");

  // Header toggle: today ⇄ all
  const [headerToday, setHeaderToday] = useState<boolean>(true);

  // Chip filter (mutually exclusive): today | pending | all
  const [chipFilter, setChipFilter] = useState<QuickFilter>("today");

  const [filters, setFilters] = useState<BookingsFilters>(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [turfs, setTurfs] = useState<PartnerTurf[]>([]);
  const [bookings, setBookings] = useState<PartnerBooking[]>([]);
  const [blocks, setBlocks] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [paymentBooking, setPaymentBooking] = useState<PartnerBooking | null>(null);
  const [paySubmitting, setPaySubmitting] = useState(false);

  const [cancelBooking, setCancelBooking] = useState<PartnerBooking | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  // ─── Load turfs once ────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await partnerTurfsApi.list();
        setTurfs((res.data || []).filter((t) => t.status === "Approved"));
      } catch {
        /* silent */
      }
    })();
  }, []);

  // ─── Query for the API (no date unless modal sets one) ──
  const buildQuery = useCallback((): BookingsQuery => {
    const q: BookingsQuery = { page: 1, page_size: 100 };

    if (filters.turfId != null) q.turf_id = filters.turfId;
    if (filters.courtNumber != null) q.court_number = filters.courtNumber;
    if (filters.bookingType) q.booking_type = filters.bookingType;
    if (filters.paymentStatus) q.payment_status = filters.paymentStatus;

    // Only apply dates from the filters modal — the header/chip "today"
    // is applied client-side so it matches the mobile app's semantics.
    if (filters.singleDay && filters.date) {
      q.date = filters.date;
    } else if (!filters.singleDay) {
      if (filters.startDate) q.start_date = filters.startDate;
      if (filters.endDate) q.end_date = filters.endDate;
    }

    return q;
  }, [filters]);

  // ─── Load bookings (raw, then filter client-side) ───────
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await partnerSlotsApi.listBookings(buildQuery());
      let list = res.data?.bookings?.results || [];

      // Filter cancelled out unless explicitly included
      list = list.filter((b) => {
  if (b.is_cancelled) return filters.showCancelled;
  return filters.showActive;
});

      // Client-side date filter to match mobile semantics
      if (headerToday || chipFilter === "today") {
        const today = todayIso();
        list = list.filter((b) => hasSlotOnDate(b, today));
      }

      // Pending payment filter
      if (chipFilter === "pending") {
        list = list.filter(
          (b) =>
            b.payment_status === "Pending" ||
            b.payment_status === "Advance Paid",
        );
      }

      // Client-side search
      if (filters.search.trim()) {
        const s = filters.search.trim().toLowerCase();
        list = list.filter(
          (b) =>
            b.customer.name.toLowerCase().includes(s) ||
            b.customer.mobile.includes(s) ||
            b.booking_id.toLowerCase().includes(s),
        );
      }

      setBookings(list);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, filters.search, filters.showActive, filters.showCancelled, headerToday, chipFilter]);

  // ─── Load blocks ────────────────────────────────────────
  const loadBlocks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query: Record<string, any> = {};
      if (filters.turfId != null) query.turf_id = filters.turfId;
      if (filters.courtNumber != null) query.court_number = filters.courtNumber;

      // Header toggle applies to blocks too
      if (headerToday) {
        query.date = todayIso();
      } else if (filters.singleDay && filters.date) {
        query.date = filters.date;
      } else if (!filters.singleDay) {
        if (filters.startDate) query.start_date = filters.startDate;
        if (filters.endDate) query.end_date = filters.endDate;
      }

      const res = await partnerSlotsApi.listBlocks(query);
      setBlocks(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load blocks");
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [filters, headerToday]);

  // ─── Refetch on tab/filter change ───────────────────────
  useEffect(() => {
    if (tab === "bookings") loadBookings();
    else loadBlocks();
  }, [tab, loadBookings, loadBlocks]);

  // ─── Actions ────────────────────────────────────────────
  const handleCollectPayment = async (amount: string, method: string) => {
    if (!paymentBooking) return;
    setPaySubmitting(true);
    try {
      await partnerSlotsApi.addPayment({
        booking_id: paymentBooking.id,
        amount,
        payment_method: method as any,
      });
      setPaymentBooking(null);
      await loadBookings();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to record payment");
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelBooking) return;
    setCancelSubmitting(true);
    try {
      await partnerSlotsApi.cancelBooking({ booking_id: cancelBooking.id });
      setCancelBooking(null);
      await loadBookings();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleRemoveBlock = async (blockId: number) => {
    try {
      await partnerSlotsApi.unblock({ block_id: blockId });
      await loadBlocks();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to remove block");
    }
  };

  const activeFilterCount = useMemo(() => {
  let n = 0;
  if (filters.turfId != null) n++;
  if (filters.courtNumber != null) n++;
  if (filters.bookingType) n++;
  if (filters.paymentStatus) n++;
  if (filters.singleDay && filters.date) n++;
  if (!filters.singleDay && (filters.startDate || filters.endDate)) n++;
  // Count "Show" only when it differs from default
  if (filters.showCancelled) n++;
  return n;
}, [filters]);

  return (
    <div className="pt-bk-page">
      {/* Header */}
      <header className="pt-bk-header">
        <div>
          <h1>Bookings</h1>
          <p>Bookings &amp; Blocks History</p>
        </div>
        <button
          className="pt-bk-refresh"
          onClick={() => (tab === "bookings" ? loadBookings() : loadBlocks())}
          aria-label="Refresh"
        >
          ⟳
        </button>
      </header>

      {/* Filter row */}
      <div className="pt-bk-filter-row">
        <button
          className="pt-bk-filter-btn"
          onClick={() => setFiltersOpen(true)}
        >
          <span>▼</span>
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="pt-bk-filter-badge">{activeFilterCount}</span>
          )}
        </button>

        <button
          className="pt-bk-filter-btn pt-bk-quick-btn"
          onClick={() => setHeaderToday((v) => !v)}
        >
          <span>📅</span>
          <span>{headerToday ? "Today" : "All Bookings"}</span>
        </button>

        <button className="pt-bk-sort-btn" aria-label="Sort">
          ⇅
        </button>
      </div>

      {/* Tabs */}
      <div className="pt-bk-tabs">
        <button
          className={`pt-bk-tab ${tab === "bookings" ? "pt-active" : ""}`}
          onClick={() => setTab("bookings")}
        >
          <span className="pt-bk-tab-icon">📖</span>
          <span>Bookings</span>
        </button>
        <button
          className={`pt-bk-tab ${tab === "blocks" ? "pt-active" : ""}`}
          onClick={() => setTab("blocks")}
        >
          <span className="pt-bk-tab-icon">🚫</span>
          <span>Blocks</span>
        </button>
      </div>

      {/* Chips (bookings only) */}
      {tab === "bookings" && (
        <div className="pt-bk-chips">
          <button
            className={`pt-bk-chip ${chipFilter === "today" ? "pt-active" : ""}`}
            onClick={() =>
              setChipFilter((c) => (c === "today" ? "all" : "today"))
            }
          >
            📅 Today
          </button>
          <button
            className={`pt-bk-chip ${chipFilter === "pending" ? "pt-active" : ""}`}
            onClick={() =>
              setChipFilter((c) => (c === "pending" ? "all" : "pending"))
            }
          >
            ⏳ Pending Payment
          </button>
        </div>
      )}

      {error && <div className="pt-auth-error">{error}</div>}

      {/* Content */}
      <div className="pt-bk-content">
        {loading && <div className="pt-bk-loading">Loading...</div>}

        {!loading && tab === "bookings" && bookings.length === 0 && (
          <div className="pt-bk-empty">
            <div className="pt-bk-empty-icon">📖</div>
            <h3>No bookings found</h3>
            <p>Try adjusting filters or book a slot from Slot Management.</p>
          </div>
        )}

        {!loading && tab === "blocks" && blocks.length === 0 && (
          <div className="pt-bk-empty">
            <div className="pt-bk-empty-icon">🚫</div>
            <h3>No blocked slots</h3>
            <p>Blocked slots appear here with a remove action.</p>
          </div>
        )}

        {!loading && tab === "bookings" && bookings.length > 0 && (
          <div className="pt-bk-list">
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                onCollect={() => setPaymentBooking(b)}
                onCancel={() => setCancelBooking(b)}
              />
            ))}
          </div>
        )}

        {!loading && tab === "blocks" && blocks.length > 0 && (
          <div className="pt-bk-list">
            {blocks.map((b) => (
              <BlockCard
                key={b.id}
                block={b}
                onRemove={() => handleRemoveBlock(b.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Filters modal */}
      {filtersOpen && (
        <BookingsFiltersModal
          turfs={turfs}
          initialFilters={filters}
          onCancel={() => setFiltersOpen(false)}
          onApply={(next) => {
            setFilters(next);
            setFiltersOpen(false);
          }}
        />
      )}

      {/* Payment modal */}
      {paymentBooking && (
        <PaymentCollectModal
          booking={paymentBooking}
          submitting={paySubmitting}
          onCancel={() => setPaymentBooking(null)}
          onConfirm={handleCollectPayment}
        />
      )}

      {/* Cancel confirmation */}
{cancelBooking && (
  <div
    className="pt-cxl-overlay"
    onClick={() => !cancelSubmitting && setCancelBooking(null)}
  >
    <div
      className="pt-cxl-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <header className="pt-cxl-header">
        <span className="pt-cxl-header-icon">🚫</span>
        <h3>Cancel Booking</h3>
      </header>

      <div className="pt-cxl-details">
        <div className="pt-cxl-row">
          <span className="pt-cxl-icon">👤</span>
          <span className="pt-cxl-value">
            {cancelBooking.customer.name}
          </span>
        </div>
        <div className="pt-cxl-row">
          <span className="pt-cxl-icon">🏟</span>
          <span className="pt-cxl-value">{cancelBooking.turf_name}</span>
        </div>
        <div className="pt-cxl-row">
          <span className="pt-cxl-icon">🎯</span>
          <span className="pt-cxl-value">
            Court {cancelBooking.court_number}
          </span>
        </div>
        <div className="pt-cxl-row">
          <span className="pt-cxl-icon">📅</span>
          <span className="pt-cxl-value">
            {new Date(cancelBooking.slots[0]?.date ?? "").toLocaleDateString(
              "en-IN",
              { day: "2-digit", month: "2-digit", year: "numeric" },
            )}
          </span>
        </div>
        <div className="pt-cxl-row">
          <span className="pt-cxl-icon">₹</span>
          <span className="pt-cxl-value">
            ₹{cancelBooking.total_amount}
          </span>
        </div>
      </div>

      <p className="pt-cxl-question">
        Are you sure you want to cancel this booking?
      </p>

      <div className="pt-cxl-actions">
        <button
          className="pt-cxl-btn pt-cxl-btn-no"
          onClick={() => setCancelBooking(null)}
          disabled={cancelSubmitting}
        >
          No
        </button>
        <button
          className="pt-cxl-btn pt-cxl-btn-yes"
          onClick={handleCancelBooking}
          disabled={cancelSubmitting}
        >
          {cancelSubmitting ? "Cancelling..." : "Yes, Cancel"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default BookingsListPage;