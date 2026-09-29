
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { partnerTurfsApi, SPORTS_OPTIONS } from "../../../api/partner/turfs";
import type { PartnerTurf } from "../../../types/partner/turf";
import GuardAction from "../../../components/partner/GuardAction";
import "./style/PartnerVenuesPage.css";

const STATUS_LABELS: Record<string, string> = {
  Pending: "Pending Approval",
  Approved: "Live",
  Rejected: "Rejected",
};

const PartnerVenuesPage: React.FC = () => {
  const navigate = useNavigate();

  const [turfs, setTurfs] = useState<PartnerTurf[]>([]);
  const [sportModalOpen, setSportModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All Sports");
  const [filterOpen, setFilterOpen] = useState(false);

  const loadTurfs = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await partnerTurfsApi.list();
      setTurfs(res.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load venues"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTurfs();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All Sports") return turfs;

    return turfs.filter((t) =>
      t.game_type.toLowerCase().includes(filter.toLowerCase())
    );
  }, [turfs, filter]);

  const selectedEmoji =
    SPORTS_OPTIONS.find((s) => s.value === filter)?.emoji || "🎯";

  const approvedCount = turfs.filter(
    (t) => t.status === "Approved"
  ).length;

  const pendingCount = turfs.filter(
    (t) => t.status === "Pending"
  ).length;

  const rejectedCount = turfs.filter(
    (t) => t.status === "Rejected"
  ).length;

  return (
    <div className="pt-venues-page">
      {/* Page heading */}
      <header className="pt-venues-header">
        <div className="pt-venues-heading-copy">
          <span className="pt-venues-eyebrow">
            YOUR PARTNER WORKSPACE
          </span>

          <h1>Manage Sports</h1>

          <p>
            Manage your venues, keep track of approvals, and grow
            your sports business.
          </p>
        </div>

        <button
          type="button"
          className="pt-venues-refresh"
          onClick={loadTurfs}
          disabled={loading}
          aria-label="Refresh venues"
          title="Refresh venues"
        >
          <span className={loading ? "pt-refresh-spinning" : ""}>
            ↻
          </span>
          <span>Refresh</span>
        </button>
      </header>

      {/* Overview */}
      {/* <section className="pt-venues-overview">
        <div className="pt-venues-overview-heading">
          <div>
            <span className="pt-venues-section-kicker">
              VENUE OVERVIEW
            </span>
            <h2>Your sports venues</h2>
            <p>
              A quick look at your venue portfolio.
            </p>
          </div>

          <span className="pt-venues-total">
            {turfs.length} {turfs.length === 1 ? "venue" : "venues"}
          </span>
        </div>

        <div className="pt-venues-summary-grid">
          <SummaryCard
            icon="🏟️"
            label="Total venues"
            value={turfs.length}
            tone="green"
          />

          <SummaryCard
            icon="✓"
            label="Live venues"
            value={approvedCount}
            tone="mint"
          />

          <SummaryCard
            icon="◷"
            label="Pending approval"
            value={pendingCount}
            tone="amber"
          />

          <SummaryCard
            icon="!"
            label="Rejected"
            value={rejectedCount}
            tone="rose"
          />
        </div>
      </section> */}

      {/* Sport filter and results heading */}
      <section className="pt-venues-toolbar">
        <div className="pt-venues-toolbar-copy">
          <h2>All venues</h2>
          <p>
            Browse and manage your registered sports facilities.
          </p>
        </div>

        <div className="pt-venues-filter-wrap">
          <label
            className="pt-venues-filter-label"
            htmlFor="pt-venues-filter-button"
          >
            Filter by sport
          </label>

          <div className="pt-venues-filter">
            <button
              id="pt-venues-filter-button"
              type="button"
              className={`pt-venues-filter-current ${
                filterOpen ? "pt-filter-is-open" : ""
              }`}
              onClick={() => setFilterOpen((v) => !v)}
              aria-expanded={filterOpen}
              aria-haspopup="listbox"
            >
              <span className="pt-venues-filter-emoji">
                {selectedEmoji}
              </span>

              <span className="pt-venues-filter-selected">
                {filter}
              </span>

              <span className="pt-venues-filter-caret">
                {filterOpen ? "⌃" : "⌄"}
              </span>
            </button>

            {filterOpen && (
              <>
                <button
                  type="button"
                  className="pt-venues-filter-dismiss"
                  aria-label="Close sport filter"
                  onClick={() => setFilterOpen(false)}
                />

                <div
                  className="pt-venues-filter-menu"
                  role="listbox"
                  aria-label="Filter venues by sport"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={filter === "All Sports"}
                    className={`pt-venues-filter-option ${
                      filter === "All Sports" ? "pt-active" : ""
                    }`}
                    onClick={() => {
                      setFilter("All Sports");
                      setFilterOpen(false);
                    }}
                  >
                    <span>🎯</span>
                    <span>All Sports</span>

                    {filter === "All Sports" && (
                      <span className="pt-check">✓</span>
                    )}
                  </button>

                  {SPORTS_OPTIONS.map((sport) => (
                    <button
                      key={sport.value}
                      type="button"
                      role="option"
                      aria-selected={filter === sport.value}
                      className={`pt-venues-filter-option ${
                        filter === sport.value ? "pt-active" : ""
                      }`}
                      onClick={() => {
                        setFilter(sport.value);
                        setFilterOpen(false);
                      }}
                    >
                      <span>{sport.emoji}</span>
                      <span>{sport.label}</span>

                      {filter === sport.value && (
                        <span className="pt-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="pt-venues-content">
        {loading && (
          <div className="pt-venues-loading">
            <div className="pt-venues-spinner" />

            <h3>Loading your venues</h3>

            <p>
              Please wait while we fetch your sports facilities.
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="pt-venues-error">
            <div className="pt-venues-error-icon">!</div>

            <h3>Unable to load venues</h3>

            <p>{error}</p>

            <button
              type="button"
              className="pt-venues-retry"
              onClick={loadTurfs}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="pt-venues-empty">
            <div className="pt-venues-empty-icon">
              {filter === "All Sports" ? "🏟️" : selectedEmoji}
            </div>

            <span className="pt-venues-empty-kicker">
              {filter === "All Sports"
                ? "YOUR NEXT CHAPTER STARTS HERE"
                : "NO MATCHING VENUES"}
            </span>

            <h2>
              {filter === "All Sports"
                ? "No sports venues added yet"
                : `No ${filter} venues found`}
            </h2>

            <p>
              {filter === "All Sports"
                ? "Add your first sports venue and start building your business on BookYourTurf."
                : "Try another sport or switch to All Sports to see your venues."}
            </p>

            {filter === "All Sports" ? (
              <GuardAction onAllowed={() => setSportModalOpen(true)}>
                {(onClick) => (
                  <button
                    type="button"
                    className="pt-venues-empty-action"
                    onClick={onClick}
                  >
                    <span>＋</span>
                    Add your first venue
                  </button>
                )}
              </GuardAction>
            ) : (
              <button
                type="button"
                className="pt-venues-empty-action"
                onClick={() => setFilter("All Sports")}
              >
                View all sports
              </button>
            )}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="pt-venues-results-bar">
              <span>
                Showing <strong>{filtered.length}</strong>{" "}
                {filtered.length === 1 ? "venue" : "venues"}
              </span>

              {filter !== "All Sports" && (
                <button
                  type="button"
                  className="pt-venues-clear-filter"
                  onClick={() => setFilter("All Sports")}
                >
                  Clear filter <span>×</span>
                </button>
              )}
            </div>

            <div className="pt-venues-grid">
              {filtered.map((turf) => (
                <VenueCard
                  key={turf.id}
                  turf={turf}
                  onOpen={() =>
                    navigate(`/partner/venues/${turf.id}`)
                  }
                  onEdit={() =>
                    navigate(`/partner/venues/${turf.id}/edit`)
                  }
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Floating Add Sports action */}
      <GuardAction onAllowed={() => setSportModalOpen(true)}>
        {(onClick) => (
          <button
            type="button"
            className="pt-add-venue-fab"
            onClick={onClick}
          >
            <span className="pt-fab-plus">＋</span>
            <span>Add Sports</span>
          </button>
        )}
      </GuardAction>

      {/* Sport picker */}
      {sportModalOpen && (
        <SportPickerModal
          onClose={() => setSportModalOpen(false)}
          onSelect={(sport) => {
            setSportModalOpen(false);

            navigate(
              `/partner/venues/new?sport=${encodeURIComponent(sport)}`
            );
          }}
        />
      )}
    </div>
  );
};

// ─── Summary card ────────────────────────────────────────────

interface SummaryCardProps {
  icon: string;
  label: string;
  value: number;
  tone: "green" | "mint" | "amber" | "rose";
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  icon,
  label,
  value,
  tone,
}) => {
  return (
    <div className={`pt-venues-summary-card pt-summary-${tone}`}>
      <div className="pt-venues-summary-icon">{icon}</div>

      <div className="pt-venues-summary-copy">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <span className="pt-venues-summary-accent" />
    </div>
  );
};

// ─── Venue card ──────────────────────────────────────────────

interface VenueCardProps {
  turf: PartnerTurf;
  onOpen: () => void;
  onEdit: () => void;
}

const VenueCard: React.FC<VenueCardProps> = ({
  turf,
  onOpen,
  onEdit,
}) => {
  const isApproved = turf.status === "Approved";

  const statusClass =
    turf.status === "Approved"
      ? "approved"
      : turf.status === "Pending"
        ? "pending"
        : "rejected";

  const handleCardKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (!isApproved) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      className={`pt-venue-card ${
        isApproved ? "pt-clickable" : "pt-static"
      }`}
      onClick={isApproved ? onOpen : undefined}
      onKeyDown={handleCardKeyDown}
      role={isApproved ? "button" : undefined}
      tabIndex={isApproved ? 0 : undefined}
      aria-label={
        isApproved ? `Open ${turf.name}` : `${turf.name}, ${turf.status}`
      }
    >
      {/* Venue image */}
      <div className="pt-venue-card-image">
        {turf.images?.[0]?.url ? (
          <img
            src={turf.images[0].url}
            alt={`${turf.name} venue`}
            loading="lazy"
          />
        ) : (
          <div className="pt-venue-card-placeholder">
            <span>🏟️</span>
            <small>Venue photo unavailable</small>
          </div>
        )}

        <div className="pt-venue-image-shade" />

        <span className={`pt-venue-image-status pt-status-${statusClass}`}>
          <span className="pt-status-dot" />
          {STATUS_LABELS[turf.status] || turf.status}
        </span>

        <span className="pt-venue-image-sport">
          {turf.game_type.toUpperCase()}
        </span>
      </div>

      {/* Venue details */}
      <div className="pt-venue-card-body">
        <div className="pt-venue-card-heading">
          <div className="pt-venue-card-title-wrap">
            <h3 title={turf.name}>{turf.name.toUpperCase()}</h3>
          </div>

          {isApproved && (
            <span className="pt-venue-live-indicator">
              <span />
              Live
            </span>
          )}
        </div>

        <div className="pt-venue-card-sport-row">
          <span className="pt-venue-sport-icon">⚽</span>
          <span>{turf.game_type.toUpperCase()}</span>
        </div>

        <p className="pt-venue-card-address" title={turf.address}>
          <span className="pt-venue-location-icon">⌖</span>
          <span>{turf.address}</span>
        </p>

        <div className="pt-venue-card-divider" />

        <div className="pt-venue-card-metrics">
          <div className="pt-venue-metric">
            <span className="pt-venue-metric-icon">▦</span>

            <div>
              <strong>{turf.courts}</strong>
              <span>
                {turf.courts === 1 ? "Court" : "Courts"}
              </span>
            </div>
          </div>

          <div className="pt-venue-metric">
            <span className="pt-venue-metric-icon">♙</span>

            <div>
              <strong>{turf.max_persons}</strong>
              <span>Max persons</span>
            </div>
          </div>
        </div>

        {!isApproved && (
          <div className={`pt-venue-review-note pt-review-${statusClass}`}>
            <span>{turf.status === "Pending" ? "◷" : "!"}</span>

            <p>
              {turf.status === "Pending"
                ? "Your venue is awaiting admin approval."
                : "This venue has not been approved. Please review its status."}
            </p>
          </div>
        )}

        <div className="pt-venue-card-actions">
          <button
            type="button"
            className={`pt-venue-card-edit ${
              isApproved ? "" : "pt-disabled"
            }`}
            onClick={(event) => {
              event.stopPropagation();

              if (isApproved) onEdit();
            }}
            disabled={!isApproved}
            title={
              isApproved
                ? "Edit venue"
                : "Available after admin approval"
            }
          >
            <span>✎</span>
            Edit venue
          </button>

          {isApproved && (
            <button
              type="button"
              className="pt-venue-card-open"
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
              aria-label={`View ${turf.name}`}
              title="View venue"
            >
              →
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

// ─── Sport picker modal ──────────────────────────────────────

interface SportPickerModalProps {
  onClose: () => void;
  onSelect: (sport: string) => void;
}

const SportPickerModal: React.FC<SportPickerModalProps> = ({
  onClose,
  onSelect,
}) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="pt-sport-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="pt-sport-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pt-sport-modal-title"
      >
        <header className="pt-sport-modal-header">
          <div className="pt-sport-modal-heading-icon">🏆</div>

          <div>
            <span className="pt-sport-modal-kicker">
              EXPAND YOUR BUSINESS
            </span>

            <h3 id="pt-sport-modal-title">Add a sports venue</h3>

            <p>
              Choose the sport you want to register.
            </p>
          </div>

          <button
            type="button"
            className="pt-sport-modal-close"
            onClick={onClose}
            aria-label="Close sport picker"
          >
            ×
          </button>
        </header>

        <div className="pt-sport-modal-list">
          {SPORTS_OPTIONS.map((sport) => (
            <button
              key={sport.value}
              type="button"
              className="pt-sport-modal-item"
              onClick={() => onSelect(sport.value)}
            >
              <span className="pt-sport-modal-emoji">
                {sport.emoji}
              </span>

              <span className="pt-sport-modal-label">
                {sport.label}
              </span>

              <span className="pt-sport-modal-arrow">→</span>
            </button>
          ))}
        </div>

        <footer className="pt-sport-modal-footer">
          <span>
            You can add venue details in the next step.
          </span>

          <button
            type="button"
            className="pt-sport-modal-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PartnerVenuesPage;