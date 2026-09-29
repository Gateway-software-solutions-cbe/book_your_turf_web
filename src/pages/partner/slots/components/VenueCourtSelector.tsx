import React, { useState, useRef, useEffect } from "react";
import type { PartnerTurf } from "../../../../types/partner/turf";
import "./VenueCourtSelector.css";

interface Props {
  turfs: PartnerTurf[];
  selectedTurfId: number | null;
  selectedCourt: number | null;
  onTurfChange: (id: number) => void;
  onCourtChange: (n: number) => void;
}

const VenueCourtSelector: React.FC<Props> = ({
  turfs,
  selectedTurfId,
  selectedCourt,
  onTurfChange,
  onCourtChange,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedTurf = turfs.find((t) => t.id === selectedTurfId) ?? null;
  const courtCount = selectedTurf?.courts ?? 0;
  const courts = Array.from({ length: courtCount }, (_, i) => i + 1);

  return (
    <section className="pt-form-section pt-vcs-section">
      <header className="pt-form-section-header">
        <span className="pt-form-section-icon">🏟</span>
        <div>
          <h3>Venue &amp; Court</h3>
          <p>Select the venue and court</p>
        </div>
      </header>

      {/* Venue dropdown */}
      <div className="pt-vcs-dropdown" ref={ref}>
        <button
          className="pt-vcs-trigger"
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          <span className="pt-vcs-trigger-icon">🏟</span>
          <span className="pt-vcs-trigger-body">
            {selectedTurf ? (
              <>
                <span className="pt-vcs-trigger-name">{selectedTurf.name}</span>
                <span className="pt-vcs-trigger-meta">
                  {selectedTurf.courts} court{selectedTurf.courts > 1 ? "s" : ""}
                  <span className="pt-vcs-badge">Approved</span>
                </span>
              </>
            ) : (
              <span className="pt-vcs-trigger-name">Select venue</span>
            )}
          </span>
          <span className="pt-vcs-caret">▾</span>
        </button>

        {open && (
          <ul className="pt-vcs-menu">
            {turfs.length === 0 && (
              <li className="pt-vcs-menu-empty">No approved venues yet</li>
            )}
            {turfs.map((t) => (
              <li key={t.id}>
                <button
                  className={`pt-vcs-menu-item ${
                    t.id === selectedTurfId ? "pt-active" : ""
                  }`}
                  onClick={() => {
                    onTurfChange(t.id);
                    setOpen(false);
                  }}
                >
                  <span className="pt-vcs-menu-name">{t.name}</span>
                  <span className="pt-vcs-menu-meta">
                    {t.courts} court{t.courts > 1 ? "s" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Court pills */}
      {selectedTurf && courtCount > 0 && (
        <div className="pt-vcs-courts">
          {courts.map((n) => (
            <button
              key={n}
              type="button"
              className={`pt-vcs-court-pill ${
                selectedCourt === n ? "pt-active" : ""
              }`}
              onClick={() => onCourtChange(n)}
            >
              <span className="pt-vcs-court-icon">🏟</span>
              {getCourtLabel(selectedTurf, n)}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

const getCourtLabel = (turf: PartnerTurf, n: number): string => {
  const isTurfSport =
    turf.game_type.toLowerCase().includes("cricket") ||
    turf.game_type.toLowerCase().includes("football");
  return `${isTurfSport ? "Turf" : "Court"} ${n}`;
};

export default VenueCourtSelector;