import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  partnerTurfsApi,
  FACILITY_OPTIONS,
} from "../../../api/partner/turfs";
import type { PartnerTurf } from "../../../types/partner/turf";
import { usePartnerAuth } from "../../../context/PartnerAuthContext";
import { useProfileGuard } from "../../../context/ProfileGuardContext";
import "./style/PartnerVenueDetailPage.css";

const DAYS: {
  key: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  short: string;
}[] = [
  { key: "mon", short: "Mon" },
  { key: "tue", short: "Tue" },
  { key: "wed", short: "Wed" },
  { key: "thu", short: "Thu" },
  { key: "fri", short: "Fri" },
  { key: "sat", short: "Sat" },
  { key: "sun", short: "Sun" },
];

const STATUS_META: Record<
  string,
  { label: string; description: string; className: string }
> = {
  Pending: {
    label: "Pending Approval",
    description:
      "Your venue is under review. You'll be notified once approved.",
    className: "vdp-status-pending",
  },
  Approved: {
    label: "Live",
    description: "Your venue is live and accepting bookings.",
    className: "vdp-status-approved",
  },
  Rejected: {
    label: "Rejected",
    description: "Your venue was rejected. Please review and resubmit.",
    className: "vdp-status-rejected",
  },
};

const formatTime = (time?: string | null) => {
  if (!time) return "—";
  return time.slice(0, 5);
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAmount = (amount?: string | number | null) => {
  if (amount === undefined || amount === null || amount === "") return "—";
  return `₹${amount}`;
};

/**
 * Standard court data for racket sports. These venues always
 * follow regulation dimensions, so no custom length/breadth/
 * height/shape fields are required for them.
 */
const getStandardCourt = (sportRaw: string) => {
  const s = sportRaw.toLowerCase();

  if (s.includes("badminton")) {
    return {
      label: "Standard badminton court",
      lines: [
        { key: "Singles", value: "13.40 × 6.10 m" },
        { key: "Doubles", value: "13.40 × 7.60 m" },
      ],
    };
  }

  if (s.includes("pickleball")) {
    return {
      label: "Standard pickleball court",
      lines: [
        { key: "Doubles", value: "13.41 × 6.10 m" },
        { key: "Singles", value: "13.41 × 5.18 m" },
      ],
    };
  }

  return null;
};

const PartnerVenueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { isGuest } = usePartnerAuth();
  const { openCompleteProfile } = useProfileGuard();

  const [turf, setTurf] = useState<PartnerTurf | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  /* ------------- Fetch venue ------------- */
  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Venue ID is missing.");
      return;
    }

    let cancelled = false;

    const loadVenue = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await partnerTurfsApi.detail(id);
        if (!cancelled) {
          setTurf(response.data);
          setActiveImageIdx(0);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.response?.data?.message ||
              "Failed to load venue details."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadVenue();
    return () => {
      cancelled = true;
    };
  }, [id]);

  /* ------------- Redirect non-approved ------------- */
  useEffect(() => {
    if (turf && turf.status !== "Approved") {
      navigate("/partner/venues", { replace: true });
    }
  }, [turf, navigate]);

  /* ------------- Edit guard ------------- */
  const handleEdit = () => {
    if (!turf) return;
    const goToEdit = () => {
      navigate(`/partner/venues/${turf.id}/edit`);
    };
    if (isGuest) return openCompleteProfile(goToEdit);
    goToEdit();
  };

  /* ------------- Gallery ------------- */
  const images = turf?.images ?? [];

  const showPreviousImage = () => {
    if (images.length < 2) return;
    setActiveImageIdx((c) => (c === 0 ? images.length - 1 : c - 1));
  };

  const showNextImage = () => {
    if (images.length < 2) return;
    setActiveImageIdx((c) => (c === images.length - 1 ? 0 : c + 1));
  };

  /* ------------- Loading ------------- */
  if (loading) {
    return (
      <main className="vdp">
        <div className="vdp-state">
          <span className="vdp-spinner" />
          <h2>Loading venue details</h2>
          <p>Retrieving your venue information…</p>
        </div>
      </main>
    );
  }

  /* ------------- Error ------------- */
  if (error && !turf) {
    return (
      <main className="vdp">
        <div className="vdp-state">
          <div className="vdp-state-icon">!</div>
          <h2>Unable to load venue</h2>
          <p>{error}</p>
          <button
            type="button"
            className="vdp-edit-btn"
            onClick={() => navigate("/partner/venues")}
          >
            ← Back to My Venues
          </button>
        </div>
      </main>
    );
  }

  if (!turf || turf.status !== "Approved") return null;

  const statusMeta = STATUS_META[turf.status] ?? STATUS_META.Pending;

  const activeAmenities = FACILITY_OPTIONS.filter(
    (facility) => turf.facilities?.[facility.key]
  );

  const timingEntries = Object.entries(turf.timings ?? {}).sort(
    ([keyA], [keyB]) => {
      const order = (key: string) => {
        const m = key.match(/court_(\d+)_(day|night)/);
        if (!m) return Number.MAX_SAFE_INTEGER;
        return Number(m[1]) * 2 + (m[2] === "day" ? 0 : 1);
      };
      return order(keyA) - order(keyB);
    }
  );

  const locationParts = [turf.district, turf.state, turf.pincode].filter(
    Boolean
  );
  const locationSummary = locationParts.length
    ? locationParts.join(" · ")
    : "Location not specified";

  const dimensions = turf.dimension_data;

  /* ------------- Sport-aware dimension logic ------------- */
  const sportRaw = turf.game_type || "";
  const standardCourt = getStandardCourt(sportRaw);
  const isRacketSport = standardCourt !== null;

  return (
    <main className="vdp">
      {/* ============ SLIM TOP RAIL ============ */}
      <div className="vdp-rail">
        <button
          type="button"
          className="vdp-rail-back"
          onClick={() => navigate("/partner/venues")}
        >
          <span aria-hidden="true">←</span>
          <span>My Venues</span>
          <span className="vdp-rail-sep" aria-hidden="true">
            /
          </span>
          <span className="vdp-rail-current">Venue Details</span>
        </button>

        <div className="vdp-rail-actions">
          <span className={`vdp-status ${statusMeta.className}`}>
            <span className="vdp-status-dot" />
            {statusMeta.label}
          </span>
          <button
            type="button"
            className="vdp-edit-btn"
            onClick={handleEdit}
          >
            Edit Venue
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {/* ============ COVER ============ */}
      <section className="vdp-cover">
        <div className="vdp-cover-media">
          {images.length > 0 ? (
            <img
              key={images[activeImageIdx]?.id}
              src={images[activeImageIdx]?.url}
              alt={`${turf.name} venue`}
              className="vdp-cover-image"
            />
          ) : (
            <div className="vdp-cover-fallback">
              <span aria-hidden="true">▧</span>
              <p>No venue image available</p>
            </div>
          )}

          <div className="vdp-cover-counter">
            {images.length > 0
              ? `${activeImageIdx + 1} / ${images.length}`
              : "No images"}
          </div>

          {images.length > 1 && (
            <>
              <button
                type="button"
                className="vdp-gallery-btn vdp-gallery-prev"
                onClick={showPreviousImage}
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                type="button"
                className="vdp-gallery-btn vdp-gallery-next"
                onClick={showNextImage}
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}

          {images.length > 1 && (
            <div className="vdp-cover-thumbs">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={`vdp-cover-thumb ${
                    index === activeImageIdx ? "is-active" : ""
                  }`}
                  onClick={() => setActiveImageIdx(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={index === activeImageIdx}
                >
                  <img
                    src={image.url}
                    alt={`${turf.name} thumbnail ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="vdp-cover-aside">
          <span className="vdp-eyebrow">Partner Venue</span>

          <h1 className="vdp-cover-title">{turf.name || "Venue"}</h1>

          <dl className="vdp-cover-facts">
            {turf.game_type && (
              <div>
                <dt>Sport</dt>
                <dd>{turf.game_type}</dd>
              </div>
            )}
            {turf.courts != null && (
              <div>
                <dt>Capacity</dt>
                <dd>
                  {turf.courts} court{turf.courts === 1 ? "" : "s"}
                  {turf.max_persons != null
                    ? ` · up to ${turf.max_persons} people`
                    : ""}
                </dd>
              </div>
            )}
            <div>
              <dt>Hours</dt>
              <dd>
                {formatTime(turf.open_time)} – {formatTime(turf.close_time)}
              </dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{locationSummary}</dd>
            </div>
            {turf.address && (
              <div className="vdp-cover-facts-full">
                <dt>Address</dt>
                <dd>{turf.address}</dd>
              </div>
            )}
          </dl>
        </aside>
      </section>

      {/* ============  SPECIFICATION ============ */}
      <section className="vdp-section">
        <header className="vdp-section-head">
          <h2 className="vdp-section-title">
            {isRacketSport ? "Court specification" : "Venue dimensions"}
          </h2>
        </header>

        <div className="vdp-section-body">
          {isRacketSport && standardCourt ? (
            <div className="vdp-standard">
              <span className="vdp-standard-eyebrow">
                {standardCourt.label}
              </span>

              <div className="vdp-standard-grid">
                {standardCourt.lines.map((line) => (
                  <div key={line.key} className="vdp-standard-line">
                    <span className="vdp-standard-key">{line.key}</span>
                    <span className="vdp-standard-value">
                      {line.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="vdp-facts-row">
              <div className="vdp-fact">
                <span className="vdp-fact-label">Length</span>
                <span className="vdp-fact-value">
                  {dimensions?.length ?? "—"}
                  {dimensions?.unit ? ` ${dimensions.unit}` : ""}
                </span>
              </div>
              <div className="vdp-fact">
                <span className="vdp-fact-label">Breadth</span>
                <span className="vdp-fact-value">
                  {dimensions?.breadth ?? "—"}
                  {dimensions?.unit ? ` ${dimensions.unit}` : ""}
                </span>
              </div>
              <div className="vdp-fact">
                <span className="vdp-fact-label">Height</span>
                <span className="vdp-fact-value">
                  {dimensions?.height ?? "—"}
                  {dimensions?.unit ? ` ${dimensions.unit}` : ""}
                </span>
              </div>
              <div className="vdp-fact">
                <span className="vdp-fact-label">Shape</span>
                <span className="vdp-fact-value">
                  {dimensions?.turf_shape || "—"}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============  AMENITIES ============ */}
      <section className="vdp-section">
        <header className="vdp-section-head">
          <h2 className="vdp-section-title">
            Amenities
          </h2>
        </header>

        <div className="vdp-section-body">
          {activeAmenities.length > 0 ? (
            <div className="vdp-pills">
              {activeAmenities.map((a) => (
                <span key={a.key as string} className="vdp-pill">
                  <span className="vdp-pill-icon" aria-hidden="true">
                    {a.icon}
                  </span>
                  {a.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="vdp-empty">No amenities specified.</p>
          )}
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section className="vdp-section">
        <header className="vdp-section-head">
          <h2 className="vdp-section-title">Timings &amp; prices</h2>
        </header>

        <div className="vdp-section-body">
          {timingEntries.length > 0 ? (
            <div className="vdp-pricing">
              {timingEntries.map(([key, shift]) => {
                const courtNumber =
                  key.match(/court_(\d+)/)?.[1] || "—";
                const isNight = key.endsWith("_night");

                return (
                  <div key={key} className="vdp-price-row">
                    <div className="vdp-price-meta">
                      <span className="vdp-price-court">
                        Court {courtNumber}
                      </span>
                      <span className="vdp-price-session">
                        {isNight ? "Night session" : "Day session"}
                      </span>
                      <span className="vdp-price-time">
                        {formatTime(shift.start_time)}–
                        {formatTime(shift.end_time)}
                      </span>
                    </div>

                    <div className="vdp-price-days">
                      {DAYS.map((day) => (
                        <div key={day.key} className="vdp-price-day">
                          <span className="vdp-price-day-label">
                            {day.short}
                          </span>
                          <span className="vdp-price-day-value">
                            {formatAmount(shift.prices?.[day.key])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="vdp-empty">
              No court pricing information is available.
            </p>
          )}
        </div>
      </section>

      {/* ============ HOURS & POLICY ============ */}
      <section className="vdp-section vdp-section-last">
        <header className="vdp-section-head">
          <h2 className="vdp-section-title">Hours &amp; policy</h2>
        </header>

        <div className="vdp-section-body">
          <div className="vdp-policy-groups">
            <div className="vdp-policy-group">
              <span className="vdp-policy-group-label">
                Operating hours
              </span>
              <div className="vdp-facts-row vdp-facts-row-4">
                <div className="vdp-fact">
                  <span className="vdp-fact-label">Opening time</span>
                  <span className="vdp-fact-value">
                    {formatTime(turf.open_time)}
                  </span>
                </div>
                <div className="vdp-fact">
                  <span className="vdp-fact-label">Closing time</span>
                  <span className="vdp-fact-value">
                    {formatTime(turf.close_time)}
                  </span>
                </div>
              </div>
            </div>

            <div className="vdp-policy-group">
              <span className="vdp-policy-group-label">
                Booking policy
              </span>
              <div className="vdp-facts-row vdp-facts-row-4">
                <div className="vdp-fact">
                  <span className="vdp-fact-label">Advance payment</span>
                  <span className="vdp-fact-value">
                    {turf.advance_type === "percentage"
                      ? `${turf.advance_value}%`
                      : formatAmount(turf.advance_value)}
                  </span>
                </div>
                <div className="vdp-fact">
                  <span className="vdp-fact-label">Commission</span>
                  <span className="vdp-fact-value">
                    {turf.commission_type === "percentage"
                      ? `${turf.commission_value}%`
                      : formatAmount(turf.commission_value)}
                  </span>
                </div>
                <div className="vdp-fact">
                  <span className="vdp-fact-label">Minimum slots</span>
                  <span className="vdp-fact-value">
                    {turf.min_slots ?? "—"}
                  </span>
                </div>
                <div className="vdp-fact">
                  <span className="vdp-fact-label">Created on</span>
                  <span className="vdp-fact-value">
                    {formatDate(turf.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOT ============ */}
      <div className="vdp-foot">
        <p>Need to update something?</p>
        <button
          type="button"
          className="vdp-edit-btn"
          onClick={handleEdit}
        >
          Edit Venue
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </main>
  );
};

export default PartnerVenueDetailPage;