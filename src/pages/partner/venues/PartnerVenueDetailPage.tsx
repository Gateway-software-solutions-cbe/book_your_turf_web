import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { partnerTurfsApi, FACILITY_OPTIONS } from "../../../api/partner/turfs";
import type { PartnerTurf } from "../../../types/partner/turf";
import { usePartnerAuth } from "../../../context/PartnerAuthContext";
import { useProfileGuard } from "../../../context/ProfileGuardContext";
import "./style/PartnerVenueDetailPage.css";

const STATUS_META: Record<string, { label: string; cls: string; desc: string }> = {
  Pending: {
    label: "Pending Approval",
    cls: "pt-status-pending",
    desc: "Your venue is under review. You'll be notified once approved.",
  },
  Approved: {
    label: "Live",
    cls: "pt-status-approved",
    desc: "Your venue is live and accepting bookings.",
  },
  Rejected: {
    label: "Rejected",
    cls: "pt-status-rejected",
    desc: "Your venue was rejected. Please review and resubmit.",
  },
};

const DAYS: { key: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"; short: string }[] = [
  { key: "mon", short: "Mon" },
  { key: "tue", short: "Tue" },
  { key: "wed", short: "Wed" },
  { key: "thu", short: "Thu" },
  { key: "fri", short: "Fri" },
  { key: "sat", short: "Sat" },
  { key: "sun", short: "Sun" },
];

const PartnerVenueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  console.log("[PartnerVenueDetailPage] mounted, id =", id);
  const navigate = useNavigate();
  const { isGuest } = usePartnerAuth();
  const { openCompleteProfile } = useProfileGuard();

  const [turf, setTurf] = useState<PartnerTurf | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ─── Load ───────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await partnerTurfsApi.detail(id);
        setTurf(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load venue");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
  if (turf && turf.status !== "Approved") {
    navigate("/partner/venues", { replace: true });
  }
}, [turf, navigate]);

  // ─── Guarded actions ────────────────────────────────────
  const handleEdit = () => {
    if (!turf) return;
    const go = () => navigate(`/partner/venues/${turf.id}/edit`);
    if (isGuest) return openCompleteProfile(go);
    go();
  };

  // const handleDelete = async () => {
  //   if (!turf) return;
  //   setDeleting(true);
  //   try {
  //     await partnerTurfsApi.remove(turf.id);
  //     navigate("/partner/venues");
  //   } catch (err: any) {
  //     setError(err?.response?.data?.message || "Failed to delete venue");
  //     setDeleting(false);
  //     setConfirmDelete(false);
  //   }
  // };

  // ─── Render ─────────────────────────────────────────────
  if (loading) {
    return <div className="pt-venue-detail-loading">Loading venue...</div>;
  }

  if (error && !turf) {
    return (
      <div className="pt-venue-detail">
        <div className="pt-auth-error">{error}</div>
        <button className="pt-btn-primary" onClick={() => navigate("/partner/venues")}>
          Back to Venues
        </button>
      </div>
    );
  }

  if (!turf) return null;
if (turf.status !== "Approved") {
  // redirect effect above will fire; render nothing in the meantime
  return null;
}

  const statusMeta = STATUS_META[turf.status] ?? STATUS_META.Pending;
  const activeAmenities = FACILITY_OPTIONS.filter((f) => turf.facilities[f.key]);

  // Sort timings so court_1_day < court_1_night < court_2_day ...
  const timingEntries = Object.entries(turf.timings);

  return (
    <div className="pt-venue-detail">
      {/* Header */}
      <header className="pt-venue-detail-header">
        <button
          className="pt-add-venue-back"
          onClick={() => navigate("/partner/venues")}
          aria-label="Back"
        >
          ‹
        </button>
        <h1>{turf.name || "Venue"}</h1>
        <span className={`pt-venue-status ${statusMeta.cls}`}>
          {statusMeta.label}
        </span>
      </header>

      {/* Status banner */}
      <div className={`pt-venue-detail-status-banner ${statusMeta.cls}`}>
        {statusMeta.desc}
      </div>

      {error && <div className="pt-auth-error">{error}</div>}

      {/* Image gallery */}
      {turf.images.length > 0 && (
        <section className="pt-venue-detail-gallery">
          <div className="pt-venue-detail-main-image">
            <img
              src={turf.images[activeImageIdx]?.url}
              alt={turf.name}
            />
          </div>
          {turf.images.length > 1 && (
            <div className="pt-venue-detail-thumbs">
              {turf.images.map((img, i) => (
                <button
                  key={img.id}
                  className={`pt-venue-detail-thumb ${i === activeImageIdx ? "pt-active" : ""}`}
                  onClick={() => setActiveImageIdx(i)}
                >
                  <img src={img.url} alt={`${turf.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sport + code */}
      <section className="pt-venue-detail-section">
        <div className="pt-venue-detail-row">
          <span className="pt-venue-detail-label">Sport</span>
          <span className="pt-venue-detail-value">{turf.game_type}</span>
        </div>
        <div className="pt-venue-detail-row">
          <span className="pt-venue-detail-label">Turf Code</span>
          <span className="pt-venue-detail-value">{turf.turf_code}</span>
        </div>
        <div className="pt-venue-detail-row">
          <span className="pt-venue-detail-label">Courts</span>
          <span className="pt-venue-detail-value">{turf.courts}</span>
        </div>
        <div className="pt-venue-detail-row">
          <span className="pt-venue-detail-label">Max Persons</span>
          <span className="pt-venue-detail-value">{turf.max_persons}</span>
        </div>
      </section>

      {/* Location */}
      <section className="pt-venue-detail-section">
        <h3 className="pt-venue-detail-section-title">📍 Location</h3>
        <p className="pt-venue-detail-address">{turf.address}</p>
        <div className="pt-venue-detail-grid-2">
          <div>
            <span className="pt-venue-detail-label">State</span>
            <span className="pt-venue-detail-value">{turf.state || "—"}</span>
          </div>
          <div>
            <span className="pt-venue-detail-label">District</span>
            <span className="pt-venue-detail-value">{turf.district || "—"}</span>
          </div>
          <div>
            <span className="pt-venue-detail-label">Pincode</span>
            <span className="pt-venue-detail-value">{turf.pincode || "—"}</span>
          </div>
          <div>
            <span className="pt-venue-detail-label">Coordinates</span>
            <span className="pt-venue-detail-value">
              {turf.latitude && turf.longitude
                ? `${Number(turf.latitude).toFixed(4)}, ${Number(turf.longitude).toFixed(4)}`
                : "—"}
            </span>
          </div>
        </div>
      </section>

      {/* Business info */}
      {(turf.description || turf.achievements) && (
        <section className="pt-venue-detail-section">
          <h3 className="pt-venue-detail-section-title">🏢 Business Info</h3>
          {turf.description && (
            <p className="pt-venue-detail-paragraph">{turf.description}</p>
          )}
          {turf.achievements && (
            <p className="pt-venue-detail-paragraph">
              <strong>Achievements:</strong> {turf.achievements}
            </p>
          )}
        </section>
      )}

      {/* Operating hours */}
      <section className="pt-venue-detail-section">
        <h3 className="pt-venue-detail-section-title">⏰ Operating Hours</h3>
        <div className="pt-venue-detail-grid-2">
          <div>
            <span className="pt-venue-detail-label">Opens</span>
            <span className="pt-venue-detail-value">
              {turf.open_time.slice(0, 5)}
            </span>
          </div>
          <div>
            <span className="pt-venue-detail-label">Closes</span>
            <span className="pt-venue-detail-value">
              {turf.close_time.slice(0, 5)}
            </span>
          </div>
        </div>
      </section>

      {/* Dimensions */}
      <section className="pt-venue-detail-section">
        <h3 className="pt-venue-detail-section-title">📐 Dimensions</h3>
        <div className="pt-venue-detail-grid-2">
          <div>
            <span className="pt-venue-detail-label">Length</span>
            <span className="pt-venue-detail-value">
              {turf.dimension_data.length} {turf.dimension_data.unit}
            </span>
          </div>
          <div>
            <span className="pt-venue-detail-label">Breadth</span>
            <span className="pt-venue-detail-value">
              {turf.dimension_data.breadth} {turf.dimension_data.unit}
            </span>
          </div>
          <div>
            <span className="pt-venue-detail-label">Height</span>
            <span className="pt-venue-detail-value">
              {turf.dimension_data.height || "—"} {turf.dimension_data.unit}
            </span>
          </div>
          <div>
            <span className="pt-venue-detail-label">Shape</span>
            <span className="pt-venue-detail-value">
              {turf.dimension_data.turf_shape}
            </span>
          </div>
        </div>
      </section>

      {/* Amenities */}
      {activeAmenities.length > 0 && (
        <section className="pt-venue-detail-section">
          <h3 className="pt-venue-detail-section-title">✨ Amenities</h3>
          <div className="pt-venue-detail-amenities">
            {activeAmenities.map((a) => (
              <span key={a.key as string} className="pt-venue-detail-amenity">
                <span>{a.icon}</span>
                <span>{a.label}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Timings & prices */}
      {timingEntries.length > 0 && (
        <section className="pt-venue-detail-section">
          <h3 className="pt-venue-detail-section-title">💸 Timings & Prices</h3>
          {timingEntries.map(([key, shift]) => {
            // key looks like "court_1_day" or "court_1_night"
            const [courtPart, shiftPart] = key.split("_").slice(-2);
            const courtLabel = key.match(/court_(\d+)/)?.[1];
            return (
              <div key={key} className="pt-venue-detail-shift">
                <div className="pt-venue-detail-shift-header">
                  <span>
                    Court {courtLabel} —{" "}
                    {shiftPart === "night" ? "🌙 Night" : "☀ Day"}
                  </span>
                  <span className="pt-venue-detail-shift-time">
                    {shift.start_time} → {shift.end_time}
                  </span>
                </div>
                <div className="pt-venue-detail-prices">
                  {DAYS.map((d) => (
                    <div key={d.key} className="pt-venue-detail-price">
                      <span className="pt-venue-detail-price-day">{d.short}</span>
                      <span className="pt-venue-detail-price-val">
                        ₹{shift.prices[d.key] ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Policy — advance, commission, min slots */}
      <section className="pt-venue-detail-section">
        <h3 className="pt-venue-detail-section-title">📋 Policy</h3>
        <div className="pt-venue-detail-grid-2">
          <div>
            <span className="pt-venue-detail-label">Advance</span>
            <span className="pt-venue-detail-value">
              {turf.advance_type === "percentage"
                ? `${turf.advance_value}%`
                : `₹${turf.advance_value}`}
            </span>
          </div>
          <div>
            <span className="pt-venue-detail-label">Commission</span>
            <span className="pt-venue-detail-value">
              {turf.commission_type === "percentage"
                ? `${turf.commission_value}%`
                : `₹${turf.commission_value}`}
            </span>
          </div>
          <div>
            <span className="pt-venue-detail-label">Min Slots</span>
            <span className="pt-venue-detail-value">{turf.min_slots}</span>
          </div>
          <div>
            <span className="pt-venue-detail-label">Created</span>
            <span className="pt-venue-detail-value">
              {new Date(turf.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="pt-venue-detail-actions">
        <button
          className="pt-btn-primary pt-venue-detail-edit"
          onClick={handleEdit}
        >
          ✏ Edit Venue
        </button>
        {/* <button
          className="pt-venue-detail-delete"
          onClick={() => setConfirmDelete(true)}
        >
          🗑 Delete
        </button> */}
      </div>

      {/* Delete confirmation */}
      {/* {confirmDelete && (
        <div
          className="pt-map-modal-overlay"
          onClick={() => !deleting && setConfirmDelete(false)}
        >
          <div
            className="pt-map-modal"
            style={{ maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="pt-map-modal-header">
              <h3>Delete Venue?</h3>
            </header>
            <div className="pt-map-modal-body">
              <p style={{ margin: 0, fontSize: 14, color: "#4b5563" }}>
                This will permanently delete <strong>{turf.name}</strong>. This
                action cannot be undone.
              </p>
            </div>
            <footer
              className="pt-map-modal-footer"
              style={{ gap: 10 }}
            >
              <button
                className="pt-btn-outline-otp"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="pt-btn-primary"
                style={{ background: "#dc2626" }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </footer>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default PartnerVenueDetailPage;