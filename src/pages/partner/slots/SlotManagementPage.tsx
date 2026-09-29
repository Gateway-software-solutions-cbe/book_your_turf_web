import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { partnerTurfsApi } from "../../../api/partner/turfs";
import { partnerSlotsApi } from "../../../api/partner/slots";
import type { PartnerTurf } from "../../../types/partner/turf";
import type { CalendarSlot, SlotMode } from "../../../types/partner/slot";
import VenueCourtSelector from "./components/VenueCourtSelector";
import DatePicker from "./components/DatePicker";
import SlotGrid from "./components/SlotGrid";
import CustomerDetailsForm, {
  CustomerDetails,
} from "./components/CustomerDetailsForm";
import BlockSlotsModal, { BlockConfig } from "./components/BlockSlotsModal";
import {
  metaCalendarViewed,
  metaSlotBlocked,
  metaSlotUnblocked,
} from "../../../lib/metaPixel";
import "./SlotManagementPage.css";

// ─── Helpers ───────────────────────────────────────────────
const todayIso = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDays = (iso: string, days: number): string => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
};

const slotKey = (s: CalendarSlot) =>
  `${s.date}|${s.start_time}|${s.end_time}|${s.is_next_day}`;

// ─── Component ─────────────────────────────────────────────
const SlotManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const [turfs, setTurfs] = useState<PartnerTurf[]>([]);
  const [selectedTurfId, setSelectedTurfId] = useState<number | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());
  const [mode, setMode] = useState<SlotMode>("book");

  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const [customer, setCustomer] = useState<CustomerDetails>({
    name: "",
    mobile: "",
    paidAmount: "",
  });
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockSubmitting, setBlockSubmitting] = useState(false);

  const [successDialog, setSuccessDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const calendarSignatureRef = useRef<string>('');

  // ─── Load turfs (Approved only) ─────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await partnerTurfsApi.list();
        const approved = (res.data || []).filter(
          (t) => t.status === "Approved",
        );
        setTurfs(approved);
        if (approved.length > 0 && selectedTurfId === null) {
          setSelectedTurfId(approved[0].id);
          setSelectedCourt(1);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load venues");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Load calendar when turf / court / date changes ─────
  useEffect(() => {
    if (selectedTurfId == null || selectedCourt == null) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await partnerSlotsApi.getCalendar({
          turf_id: selectedTurfId,
          court_number: selectedCourt,
          date: selectedDate,
        });
        setSlots(res.data || []);
        setSelectedKeys(new Set());
        setCustomer({ name: "", mobile: "", paidAmount: "" });
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load slots");
        setSlots([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedTurfId, selectedCourt, selectedDate]);

  // ─── Meta Pixel: calendar_viewed (once per turf/court/date) ─────
  useEffect(() => {
    if (loading || slots.length === 0) return;
    if (selectedTurfId == null || selectedCourt == null) return;

    const signature = `${selectedTurfId}|${selectedCourt}|${selectedDate}`;
    if (calendarSignatureRef.current === signature) return;
    calendarSignatureRef.current = signature;

    metaCalendarViewed({
      turf_id: selectedTurfId,
      court_number: selectedCourt,
      date: selectedDate,
    });
  }, [loading, slots.length, selectedTurfId, selectedCourt, selectedDate]);

  // Reset customer details when leaving book mode
  useEffect(() => {
    if (mode !== "book") {
      setCustomer({ name: "", mobile: "", paidAmount: "" });
    }
  }, [mode]);

  const selectedTurf = useMemo(
    () => turfs.find((t) => t.id === selectedTurfId) ?? null,
    [turfs, selectedTurfId],
  );

  const selectedSlots = useMemo(
    () => slots.filter((s) => selectedKeys.has(slotKey(s))),
    [slots, selectedKeys],
  );

  const handleToggle = (s: CalendarSlot) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const k = slotKey(s);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const handleRefresh = () => {
    setSelectedKeys(new Set());
    setCustomer({ name: "", mobile: "", paidAmount: "" });
    // Force a refetch by bouncing a dependency
    setSelectedCourt((c) => c);
  };

  // ─── Derived totals ─────────────────────────────────────
  const totalAmount = selectedSlots.reduce(
    (sum, s) => sum + Number(s.price || 0),
    0,
  );
  const slotCount = selectedSlots.length;

  // ─── Primary action ─────────────────────────────────────
  const handlePrimaryAction = () => {
    setError("");
    if (slotCount === 0) return;

    if (mode === "book") {
      if (!customer.name.trim()) {
        setError("Please enter the customer name");
        return;
      }
      if (!/^\d{10}$/.test(customer.mobile)) {
        setError("Please enter a valid 10-digit mobile number");
        return;
      }
      const paid = Number(customer.paidAmount);
      if (customer.paidAmount === "" || Number.isNaN(paid) || paid < 0) {
        setError("Please enter the paid amount (0 if not paid)");
        return;
      }
      if (paid > totalAmount) {
        setError("Paid amount cannot exceed the total");
        return;
      }

      navigate("/partner/slots/summary", {
        state: {
          turfId: selectedTurfId,
          turfName: selectedTurf?.name ?? "",
          gameType: selectedTurf?.game_type ?? "",
          courtNumber: selectedCourt,
          date: selectedDate,
          slots: selectedSlots,
          customer: {
            name: customer.name.trim(),
            mobile: customer.mobile,
            paidAmount: paid.toFixed(2),
          },
        },
      });
      return;
    }

    if (mode === "block") {
      setBlockModalOpen(true);
      return;
    }

    if (mode === "unblock") {
      handleUnblock();
      return;
    }
  };

  const primaryLabel = (() => {
    if (mode === "block") return "Block Now";
    if (mode === "unblock") return "Unblock";
    return "Book selected slots";
  })();

  // ─── Block handler ──────────────────────────────────────
  const handleBlockConfirm = async (config: BlockConfig) => {
    if (selectedTurfId == null || selectedCourt == null) return;
    setBlockSubmitting(true);
    setError("");
    try {
      const calls: Promise<any>[] = [];
      const step = config.repeatType === "Daily" ? 1 : 7;
      const unitLabel = config.repeatType === "Daily" ? "Day" : "Week";

      for (let i = 0; i < config.repeatCount; i++) {
        const offset = i * step;
        for (const slot of selectedSlots) {
          const targetDate = addDays(slot.date, offset);
          const suffix =
            config.repeatCount > 1
              ? config.reason
                ? `${config.reason} (${unitLabel} ${i + 1} of ${config.repeatCount})`
                : `${unitLabel} ${i + 1} of ${config.repeatCount}`
              : config.reason;

          calls.push(
            partnerSlotsApi.blockSlots({
              turf_id: selectedTurfId,
              court_number: selectedCourt,
              start_date: targetDate,
              end_date: targetDate,
              start_time: slot.start_time,
              end_time: slot.end_time,
              reason: suffix,
            }),
          );
        }
      }

      await Promise.all(calls);

      setBlockModalOpen(false);
      setSuccessDialog({
        title: "Block Successful",
        message: `${selectedSlots.length} slot(s) blocked for ${config.repeatCount} ${unitLabel.toLowerCase()}${config.repeatCount > 1 ? "s" : ""}!`,
      });
      // ─── Meta Pixel: slot_blocked ───────────────────────────────
      if (selectedTurfId != null) {
        const firstSlot = selectedSlots[0];
        const slotDateTime = firstSlot
          ? `${firstSlot.date}T${firstSlot.start_time}`
          : selectedDate;

        metaSlotBlocked({
          turf_id: selectedTurfId,
          court_number: selectedCourt ?? undefined,
          slot_datetime: slotDateTime,
          method: 'app',
          reason: config.reason,
          repeat_type: config.repeatType,
          repeat_count: config.repeatCount,
          slots_count: selectedSlots.length,
        });
      }
      setSelectedKeys(new Set());

      // Reload calendar
      const res = await partnerSlotsApi.getCalendar({
        turf_id: selectedTurfId,
        court_number: selectedCourt,
        date: selectedDate,
      });
      setSlots(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to block slots");
      setBlockModalOpen(false);
    } finally {
      setBlockSubmitting(false);
    }
  };

  // ─── Unblock handler (fixed: reads block_ids array) ─────
  const handleUnblock = async () => {
    setError("");

    // Flatten all block_ids from all selected slots
    const blockIds: number[] = [];
    selectedSlots.forEach((s) => {
      if (Array.isArray(s.block_ids)) {
        s.block_ids.forEach((id) => {
          if (typeof id === "number") blockIds.push(id);
        });
      }
    });

    if (blockIds.length === 0) {
      setError("Selected slots don't have block IDs to unblock.");
      return;
    }

    setBlockSubmitting(true);
    try {
      await Promise.all(
        blockIds.map((id) => partnerSlotsApi.unblock({ block_id: id })),
      );

      setSuccessDialog({
        title: "Unblock Successful",
        message: `${blockIds.length} block(s) removed. Slot(s) available again!`,
      });
      // ─── Meta Pixel: slot_unblocked ─────────────────────────────
      if (selectedTurfId != null && selectedSlots[0]) {
        metaSlotUnblocked({
          turf_id: selectedTurfId,
          court_number: selectedCourt ?? undefined,
          slot_datetime: `${selectedSlots[0].date}T${selectedSlots[0].start_time}`,
          block_ids: blockIds,
        });
      }
      setSelectedKeys(new Set());

      if (selectedTurfId != null && selectedCourt != null) {
        const res = await partnerSlotsApi.getCalendar({
          turf_id: selectedTurfId,
          court_number: selectedCourt,
          date: selectedDate,
        });
        setSlots(res.data || []);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to unblock slots");
    } finally {
      setBlockSubmitting(false);
    }
  };

  const actionEnabled = slotCount > 0 && !loading && !blockSubmitting;

  return (
    <div className="pt-slot-page">
      {/* Header */}
      <header className="pt-slot-header">
        <div>
          <h1>Slot Management</h1>
          <p>Book &amp; manage court slots</p>
        </div>
        <button
          type="button"
          className="pt-slot-refresh"
          onClick={handleRefresh}
          aria-label="Refresh"
        >
          ⟳
        </button>
      </header>

      {/* Sport badge */}
      {selectedTurf && (
        <div className="pt-slot-sport-badge">
          <span className="pt-slot-sport-icon">
            {selectedTurf.game_type.toLowerCase().includes("badminton")
              ? "🏸"
              : selectedTurf.game_type.toLowerCase().includes("pickle")
                ? "🏓"
                : "⚽"}
          </span>
          <div className="pt-slot-sport-text">
            <span className="pt-slot-sport-label">Sport</span>
            <span className="pt-slot-sport-value">{selectedTurf.game_type}</span>
          </div>
          <span className="pt-slot-sport-tag">
            {selectedTurf.game_type.toLowerCase().includes("cricket") ||
            selectedTurf.game_type.toLowerCase().includes("football")
              ? "Turf"
              : "Court"}
          </span>
        </div>
      )}

      {/* Mode toggle */}
      <div className="pt-slot-mode-toggle">
        <button
          className={`pt-slot-mode-btn ${mode === "book" ? "pt-active" : ""}`}
          onClick={() => {
            setMode("book");
            setSelectedKeys(new Set());
          }}
        >
          <span>📱</span>
          <span>Book</span>
        </button>
        <button
          className={`pt-slot-mode-btn ${mode === "block" ? "pt-active" : ""}`}
          onClick={() => {
            setMode("block");
            setSelectedKeys(new Set());
          }}
        >
          <span>🚫</span>
          <span>Block</span>
        </button>
        <button
          className={`pt-slot-mode-btn ${mode === "unblock" ? "pt-active" : ""}`}
          onClick={() => {
            setMode("unblock");
            setSelectedKeys(new Set());
          }}
        >
          <span>🔓</span>
          <span>Unblock</span>
        </button>
      </div>

      {error && <div className="pt-auth-error">{error}</div>}

      {/* Venue & court */}
      <VenueCourtSelector
        turfs={turfs}
        selectedTurfId={selectedTurfId}
        selectedCourt={selectedCourt}
        onTurfChange={(id) => {
          setSelectedTurfId(id);
          setSelectedCourt(1);
        }}
        onCourtChange={(n) => setSelectedCourt(n)}
      />

      {/* Date */}
      <DatePicker value={selectedDate} onChange={setSelectedDate} />

      {/* Customer details — only in Book mode */}
      {mode === "book" && (
        <CustomerDetailsForm
          value={customer}
          onChange={(patch) =>
            setCustomer((prev) => ({ ...prev, ...patch }))
          }
          totalAmount={totalAmount}
        />
      )}

      {/* Slot grid */}
      <section className="pt-form-section">
        <header className="pt-form-section-header">
          <span className="pt-form-section-icon">🗓</span>
          <div>
            <h3>Time Slots</h3>
            <p>
              {selectedSlots.length > 0
                ? `${selectedSlots.length} slot(s) selected · ₹${totalAmount.toFixed(2)}`
                : "Tap slots to select"}
            </p>
          </div>
        </header>

        {loading ? (
          <div className="pt-slot-loading">Loading slots...</div>
        ) : (
          <SlotGrid
            slots={slots}
            mode={mode}
            selectedKeys={selectedKeys}
            onToggle={handleToggle}
          />
        )}
      </section>

      {/* Sticky primary action */}
      <div className="pt-slot-action-bar">
        {slotCount > 0 && (
          <div className="pt-slot-action-summary">
            <span>
              {slotCount} slot{slotCount > 1 ? "s" : ""} selected
            </span>
            <span className="pt-slot-action-amount">
              ₹{totalAmount.toFixed(2)}
            </span>
          </div>
        )}
        <button
          className="pt-slot-action-btn"
          disabled={!actionEnabled}
          onClick={handlePrimaryAction}
        >
          {blockSubmitting ? "Processing..." : primaryLabel}
        </button>
      </div>

      {/* Block modal */}
      {blockModalOpen && mode === "block" && (
        <BlockSlotsModal
          slots={selectedSlots}
          submitting={blockSubmitting}
          onCancel={() => setBlockModalOpen(false)}
          onConfirm={handleBlockConfirm}
        />
      )}

      {/* Success dialog */}
      {successDialog && (
        <div
          className="pt-slot-success-overlay"
          onClick={() => setSuccessDialog(null)}
        >
          <div
            className="pt-slot-success-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-slot-success-icon">✓</div>
            <h3 className="pt-slot-success-title">{successDialog.title}</h3>
            <p className="pt-slot-success-message">{successDialog.message}</p>
            <button
              className="pt-slot-success-ok"
              onClick={() => setSuccessDialog(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotManagementPage;