import React, { useState } from "react";
import type { PartnerTurf } from "../../../../types/partner/turf";
import type {
  BookingType,
  PaymentStatus,
} from "../../../../types/partner/slot";
import "./BookingsFiltersModal.css";

export interface BookingsFilters {
  search: string;
  turfId: number | null;
  bookingType: BookingType | null;
  courtNumber: number | null;
  paymentStatus: PaymentStatus | null;
  singleDay: boolean;
  date: string | null;
  startDate: string | null;
  endDate: string | null;
  showActive: boolean;
  showCancelled: boolean;
}

interface Props {
  turfs: PartnerTurf[];
  initialFilters: BookingsFilters;
  onCancel: () => void;
  onApply: (filters: BookingsFilters) => void;
}

const BOOKING_TYPES: (BookingType | null)[] = [null, "Offline", "Online"];
const PAYMENT_STATUSES: (PaymentStatus | null)[] = [
  null,
  "Fully Paid",
  "Advance Paid",
  "Pending",
];

const BookingsFiltersModal: React.FC<Props> = ({
  turfs,
  initialFilters,
  onCancel,
  onApply,
}) => {
  const [f, setF] = useState<BookingsFilters>(initialFilters);
  const [turfOpen, setTurfOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [courtOpen, setCourtOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const selectedTurf = turfs.find((t) => t.id === f.turfId) ?? null;
  const courtCount = selectedTurf?.courts ?? 0;
  const courts = Array.from({ length: courtCount }, (_, i) => i + 1);

  const patch = (p: Partial<BookingsFilters>) => setF((prev) => ({ ...prev, ...p }));

  return (
    <div className="pt-bf-overlay" onClick={onCancel}>
      <div className="pt-bf-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pt-bf-header">
          <span className="pt-bf-header-icon">▼</span>
          <h2>Filter Bookings</h2>
        </header>

        {/* Search */}
        <div className="pt-bf-search">
          <span className="pt-bf-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by customer name, mobile or booking ID..."
            value={f.search}
            onChange={(e) => patch({ search: e.target.value })}
          />
        </div>

        {/* Turf */}
        <div className="pt-bf-field">
          <label className="pt-bf-label">Turf</label>
          <button
            className="pt-bf-select"
            onClick={() => setTurfOpen((v) => !v)}
          >
            <span>📋</span>
            <span>{selectedTurf ? selectedTurf.name : "All Turfs"}</span>
            <span className="pt-bf-caret">▾</span>
          </button>
          {turfOpen && (
            <ul className="pt-bf-menu">
              <li>
                <button
                  className={`pt-bf-menu-item ${f.turfId == null ? "pt-active" : ""}`}
                  onClick={() => {
                    patch({ turfId: null, courtNumber: null });
                    setTurfOpen(false);
                  }}
                >
                  All Turfs
                </button>
              </li>
              {turfs.map((t) => (
                <li key={t.id}>
                  <button
                    className={`pt-bf-menu-item ${f.turfId === t.id ? "pt-active" : ""}`}
                    onClick={() => {
                      patch({ turfId: t.id, courtNumber: null });
                      setTurfOpen(false);
                    }}
                  >
                    {t.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Booking type */}
        <div className="pt-bf-field">
          <label className="pt-bf-label">Booking Type</label>
          <button
            className="pt-bf-select"
            onClick={() => setTypeOpen((v) => !v)}
          >
            <span>📱</span>
            <span>{f.bookingType ?? "All Bookings"}</span>
            <span className="pt-bf-caret">▾</span>
          </button>
          {typeOpen && (
            <ul className="pt-bf-menu">
              {BOOKING_TYPES.map((t, i) => (
                <li key={i}>
                  <button
                    className={`pt-bf-menu-item ${f.bookingType === t ? "pt-active" : ""}`}
                    onClick={() => {
                      patch({ bookingType: t });
                      setTypeOpen(false);
                    }}
                  >
                    {t ?? "All Bookings"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Court */}
        <div className="pt-bf-field">
          <label className="pt-bf-label">Court</label>
          <button
            className="pt-bf-select"
            onClick={() => selectedTurf && setCourtOpen((v) => !v)}
            disabled={!selectedTurf}
          >
            <span>▦</span>
            <span>
              {f.courtNumber ? `Court ${f.courtNumber}` : "All Courts"}
            </span>
            <span className="pt-bf-caret">▾</span>
          </button>
          {courtOpen && selectedTurf && (
            <ul className="pt-bf-menu">
              <li>
                <button
                  className={`pt-bf-menu-item ${f.courtNumber == null ? "pt-active" : ""}`}
                  onClick={() => {
                    patch({ courtNumber: null });
                    setCourtOpen(false);
                  }}
                >
                  All Courts
                </button>
              </li>
              {courts.map((n) => (
                <li key={n}>
                  <button
                    className={`pt-bf-menu-item ${f.courtNumber === n ? "pt-active" : ""}`}
                    onClick={() => {
                      patch({ courtNumber: n });
                      setCourtOpen(false);
                    }}
                  >
                    Court {n}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Payment status */}
        <div className="pt-bf-field">
          <label className="pt-bf-label">Payment Status</label>
          <button
            className="pt-bf-select"
            onClick={() => setStatusOpen((v) => !v)}
          >
            <span>📋</span>
            <span>{f.paymentStatus ?? "All"}</span>
            <span className="pt-bf-caret">▾</span>
          </button>
          {statusOpen && (
            <ul className="pt-bf-menu">
              {PAYMENT_STATUSES.map((s, i) => (
                <li key={i}>
                  <button
                    className={`pt-bf-menu-item ${f.paymentStatus === s ? "pt-active" : ""}`}
                    onClick={() => {
                      patch({ paymentStatus: s });
                      setStatusOpen(false);
                    }}
                  >
                    {s ?? "All"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Show toggle */}
        <div className="pt-bf-show-row">
  <span className="pt-bf-show-icon">✕</span>
  <span className="pt-bf-show-label">Show:</span>
  <button
    className={`pt-bf-show-btn ${f.showActive ? "pt-active" : ""}`}
    onClick={() => {
      // Prevent turning off both
      if (f.showActive && !f.showCancelled) return;
      patch({ showActive: !f.showActive });
    }}
  >
    Active
  </button>
  <button
    className={`pt-bf-show-btn ${f.showCancelled ? "pt-active" : ""}`}
    onClick={() => {
      if (f.showCancelled && !f.showActive) return;
      patch({ showCancelled: !f.showCancelled });
    }}
  >
    Cancelled
  </button>
</div>

        {/* Date mode */}
        <div className="pt-bf-date-mode">
          <button
            className={`pt-bf-mode-btn ${f.singleDay ? "pt-active" : ""}`}
            onClick={() =>
              patch({
                singleDay: true,
                startDate: null,
                endDate: null,
              })
            }
          >
            Single Day
          </button>
          <button
            className={`pt-bf-mode-btn ${!f.singleDay ? "pt-active" : ""}`}
            onClick={() => patch({ singleDay: false, date: null })}
          >
            Date Range
          </button>
        </div>

        {f.singleDay ? (
          <label className="pt-bf-date-field">
            <span>📅</span>
            <span className="pt-bf-date-text">
              {f.date ? f.date : "Select Date"}
            </span>
            <input
              type="date"
              className="pt-bf-date-input"
              value={f.date ?? ""}
              onChange={(e) => patch({ date: e.target.value || null })}
            />
          </label>
        ) : (
          <div className="pt-bf-date-grid">
            <label className="pt-bf-date-field">
              <span>📅</span>
              <span className="pt-bf-date-text">
                {f.startDate ?? "Start Date"}
              </span>
              <input
                type="date"
                className="pt-bf-date-input"
                value={f.startDate ?? ""}
                onChange={(e) =>
                  patch({ startDate: e.target.value || null })
                }
              />
            </label>
            <label className="pt-bf-date-field">
              <span>📅</span>
              <span className="pt-bf-date-text">
                {f.endDate ?? "End Date"}
              </span>
              <input
                type="date"
                className="pt-bf-date-input"
                value={f.endDate ?? ""}
                onChange={(e) => patch({ endDate: e.target.value || null })}
              />
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="pt-bf-actions">
          <button className="pt-bf-btn pt-bf-btn-cancel" onClick={onCancel}>
            ✕ Cancel
          </button>
          <button
            className="pt-bf-btn pt-bf-btn-apply"
            onClick={() => onApply(f)}
          >
            ✓ Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingsFiltersModal;