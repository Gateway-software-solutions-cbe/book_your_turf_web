import React, { useEffect } from "react";
import type { DimensionData } from "../../../../types/partner/turf";

interface Props {
  data: DimensionData;
  maxPersons: number;
  courts: number;
  gameType: string;
  onChangeDimensions: (patch: Partial<DimensionData>) => void;
  onChangeMaxPersons: (n: number) => void;
  onChangeCourts: (n: number) => void;
}

const STANDARD_SPORTS: Record<
  string,
  { label: string; size: string; maxPlayers: number }
> = {
  badminton: {
    label: "Badminton",
    size: "20 ft × 44 ft",
    maxPlayers: 4,
  },
  pickleball: {
    label: "Pickleball",
    size: "20 ft × 44 ft",
    maxPlayers: 4,
  },
};

const DimensionsSection: React.FC<Props> = ({
  data,
  maxPersons,
  courts,
  gameType,
  onChangeDimensions,
  onChangeMaxPersons,
}) => {
  const key = gameType.trim().toLowerCase();
  const standard = STANDARD_SPORTS[key];
  const isCricketFootball = key.includes("cricket") || key.includes("football");

  // Auto-lock max persons for badminton/pickleball
  useEffect(() => {
    if (standard && maxPersons !== standard.maxPlayers) {
      onChangeMaxPersons(standard.maxPlayers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [standard?.maxPlayers, standard]);

  return (
    <section className="pt-form-section">
      <header className="pt-form-section-header">
        <span className="pt-form-section-icon">📐</span>
        <div>
          <h3>Dimensions</h3>
          <p>
            {standard
              ? `Standard ${standard.label} dimensions apply`
              : "Enter your turf dimensions"}
          </p>
        </div>
      </header>

      {standard ? (
        <>
          <div className="pt-info-note">
            ⓘ Standard {standard.label} court dimensions apply ({standard.size})
          </div>

          <div className="pt-grid-2">
            <div className="pt-field">
              <label className="pt-field-label">
                Max Persons <span className="pt-req">*</span>
              </label>
              <input
                className="pt-input"
                type="number"
                value={standard.maxPlayers}
                readOnly
                disabled
              />
              <span className="pt-char-count">
                Locked for {standard.label}
              </span>
            </div>
            <div className="pt-field">
              <label className="pt-field-label">Total Courts</label>
              <input className="pt-input" value={courts} readOnly disabled />
              <span className="pt-char-count">
                Add or remove below in Time &amp; Prices
              </span>
            </div>
          </div>
        </>
      ) : isCricketFootball ? (
        <>
          {/* Unit */}
          <div className="pt-field">
            <label className="pt-field-label">
              Dimension Unit <span className="pt-req">*</span>
            </label>
            <div className="pt-segmented">
              {(["feet", "meters"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  className={`pt-segmented-btn ${
                    data.unit === u ? "pt-active" : ""
                  }`}
                  onClick={() => onChangeDimensions({ unit: u })}
                >
                  {u === "feet" ? "Feet" : "Meters"}
                </button>
              ))}
            </div>
          </div>

          {/* Shape */}
          <div className="pt-field">
            <label className="pt-field-label">
              Turf Shape <span className="pt-req">*</span>
            </label>
            <div className="pt-segmented">
              {(["square", "round"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`pt-segmented-btn ${
                    data.turf_shape === s ? "pt-active" : ""
                  }`}
                  onClick={() => onChangeDimensions({ turf_shape: s })}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Length / Breadth / Height */}
          <div className="pt-grid-3">
            <div className="pt-field">
              <label className="pt-field-label">
                Length <span className="pt-req">*</span>
              </label>
              <input
                className="pt-input"
                type="number"
                min={1}
                placeholder="0"
                value={data.length}
                onChange={(e) =>
                  onChangeDimensions({ length: e.target.value })
                }
              />
            </div>
            <div className="pt-field">
              <label className="pt-field-label">
                Breadth <span className="pt-req">*</span>
              </label>
              <input
                className="pt-input"
                type="number"
                min={1}
                placeholder="0"
                value={data.breadth}
                onChange={(e) =>
                  onChangeDimensions({ breadth: e.target.value })
                }
              />
            </div>
            <div className="pt-field">
              <label className="pt-field-label">Height (Optional)</label>
              <input
                className="pt-input"
                type="number"
                min={0}
                placeholder="0"
                value={data.height}
                onChange={(e) =>
                  onChangeDimensions({ height: e.target.value })
                }
              />
            </div>
          </div>

          {/* Max Persons + read-only Total Turfs */}
          <div className="pt-grid-2">
            <div className="pt-field">
              <label className="pt-field-label">
                Max Persons <span className="pt-req">*</span>
              </label>
              <input
                className="pt-input"
                type="number"
                min={1}
                value={maxPersons || ""}
                placeholder="0"
                onChange={(e) =>
                  onChangeMaxPersons(Number(e.target.value) || 0)
                }
              />
            </div>
            <div className="pt-field">
              <label className="pt-field-label">Total Turfs</label>
              <input className="pt-input" value={courts} readOnly disabled />
              <span className="pt-char-count">
                Add or remove below in Time &amp; Prices
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="pt-info-note">
          ⓘ Please select a sport above to configure dimensions.
        </div>
      )}
    </section>
  );
};

export default DimensionsSection;