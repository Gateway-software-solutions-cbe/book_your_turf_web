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
  const [filter, setFilter] = useState<string>("All Sports");
  const [filterOpen, setFilterOpen] = useState(false);

  const loadTurfs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await partnerTurfsApi.list();
      setTurfs(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load venues");
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
      t.game_type.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [turfs, filter]);

  const selectedEmoji =
    SPORTS_OPTIONS.find((s) => s.value === filter)?.emoji || "🎯";

  return (
    <div className="pt-venues-page">
      <header className="pt-venues-header">
        <h1>Manage Sports</h1>
        <p>Grow your business &amp; manage all sports venues in one app</p>
      </header>

      {/* Sport filter */}
      <div className="pt-venues-filter-wrap">
        <span className="pt-venues-filter-label">Select Sport</span>
        <div className="pt-venues-filter">
          <button
            className="pt-venues-filter-current"
            onClick={() => setFilterOpen((v) => !v)}
          >
            <span className="pt-venues-filter-emoji">{selectedEmoji}</span>
            <span>{filter}</span>
            {filter !== "All Sports" && (
              <span className="pt-venues-filter-check">✓</span>
            )}
            <span className="pt-venues-filter-caret">▾</span>
          </button>

          {filterOpen && (
            <div className="pt-venues-filter-menu">
              <button
                className="pt-venues-filter-option pt-active"
                onClick={() => {
                  setFilter("All Sports");
                  setFilterOpen(false);
                }}
              >
                <span>🎯</span>
                <span>All Sports</span>
                <span className="pt-check">✓</span>
              </button>
              {SPORTS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  className="pt-venues-filter-option"
                  onClick={() => {
                    setFilter(s.value);
                    setFilterOpen(false);
                  }}
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-venues-content">
        {loading && <div className="pt-venues-empty">Loading venues...</div>}

        {!loading && error && (
          <div
            className="pt-auth-error"
            style={{ maxWidth: 480, margin: "0 auto" }}
          >
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="pt-venues-empty">
            <div className="pt-venues-empty-icon">⚽</div>
            <h2>No Sports Venues Added Yet</h2>
            <p>Start growing your business by adding your first venue.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="pt-venues-grid">
            {filtered.map((t) => (
              <VenueCard
                key={t.id}
                turf={t}
                onOpen={() => navigate(`/partner/venues/${t.id}`)}
                onEdit={() => navigate(`/partner/venues/${t.id}/edit`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Sports FAB — opens sport picker modal */}
      <GuardAction onAllowed={() => setSportModalOpen(true)}>
        {(onClick) => (
          <button className="pt-add-venue-fab" onClick={onClick}>
            <span className="pt-fab-plus">+</span>
            <span>Add Sports</span>
          </button>
        )}
      </GuardAction>

      {/* Sport picker modal */}
      {sportModalOpen && (
        <SportPickerModal
          onClose={() => setSportModalOpen(false)}
          onSelect={(sport) => {
            setSportModalOpen(false);
            navigate(`/partner/venues/new?sport=${encodeURIComponent(sport)}`);
          }}
        />
      )}
    </div>
  );
};

// ─── Card subcomponent ─────────────────────────────────────
interface VenueCardProps {
  turf: PartnerTurf;
  onOpen: () => void;
  onEdit: () => void;
}

const VenueCard: React.FC<VenueCardProps> = ({ turf, onOpen, onEdit }) => {
  const isApproved = turf.status === "Approved";

  const handleCardClick = () => {
    if (isApproved) onOpen();
  };

  return (
    <div
      className={`pt-venue-card ${isApproved ? "pt-clickable" : "pt-static"}`}
      onClick={handleCardClick}
      role={isApproved ? "button" : undefined}
      tabIndex={isApproved ? 0 : -1}
    >
      <div className="pt-venue-card-image">
        {turf.images?.[0]?.url ? (
          <img src={turf.images[0].url} alt={turf.name} />
        ) : (
          <div className="pt-venue-card-placeholder">🏟</div>
        )}
        {!isApproved && (
          <div
            className={`pt-venue-card-overlay pt-overlay-${turf.status.toLowerCase()}`}
          >
            <span className="pt-overlay-icon">
              {turf.status === "Pending" ? "⏳" : "⚠"}
            </span>
            <span className="pt-overlay-text">
              {STATUS_LABELS[turf.status] || turf.status}
            </span>
          </div>
        )}
      </div>

      <div className="pt-venue-card-body">
        <div className="pt-venue-card-top">
          <h3>{turf.name}</h3>
          {isApproved && (
            <span className="pt-venue-status pt-venue-status-approved">
              {STATUS_LABELS.Approved}
            </span>
          )}
        </div>

        <p className="pt-venue-card-sport">{turf.game_type}</p>
        <p className="pt-venue-card-address">{turf.address}</p>

        <div className="pt-venue-card-footer">
          <span>
            {turf.courts} court{turf.courts > 1 ? "s" : ""}
          </span>
          <span>{turf.max_persons} max persons</span>
        </div>

        <button
          className={`pt-venue-card-edit ${isApproved ? "" : "pt-disabled"}`}
          onClick={(e) => {
            e.stopPropagation();
            if (isApproved) onEdit();
          }}
          disabled={!isApproved}
          title={
            isApproved ? "Edit venue" : "Available after admin approval"
          }
        >
          ✏ Edit
        </button>
      </div>
    </div>
  );
};

// ─── Sport Picker Modal ────────────────────────────────────
interface SportPickerModalProps {
  onClose: () => void;
  onSelect: (sport: string) => void;
}

const SportPickerModal: React.FC<SportPickerModalProps> = ({
  onClose,
  onSelect,
}) => {
  return (
    <div className="pt-sport-modal-overlay" onClick={onClose}>
      <div className="pt-sport-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pt-sport-modal-header">
          <h3>Select Sport</h3>
          <p>Choose the sport you want to add:</p>
        </header>

        <ul className="pt-sport-modal-list">
          {SPORTS_OPTIONS.map((s) => (
            <li key={s.value}>
              <button
                className="pt-sport-modal-item"
                onClick={() => onSelect(s.value)}
              >
                <span className="pt-sport-modal-emoji">{s.emoji}</span>
                <span className="pt-sport-modal-label">{s.label}</span>
                <span className="pt-sport-modal-arrow">›</span>
              </button>
            </li>
          ))}
        </ul>

        <footer className="pt-sport-modal-footer">
          <button className="pt-sport-modal-cancel" onClick={onClose}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PartnerVenuesPage;