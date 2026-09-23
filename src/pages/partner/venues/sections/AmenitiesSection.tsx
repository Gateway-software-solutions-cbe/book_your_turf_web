import React from "react";
import { FACILITY_OPTIONS } from "../../../../api/partner/turfs";
import type { Facilities } from "../../../../types/partner/turf";

interface Props {
  facilities: Facilities;
  onChange: (key: keyof Facilities, value: boolean) => void;
}

const AmenitiesSection: React.FC<Props> = ({ facilities, onChange }) => {
  return (
    <section className="pt-form-section">
      <header className="pt-form-section-header">
        <span className="pt-form-section-icon">✨</span>
        <div>
          <h3>Amenities</h3>
          <p>Select what your venue offers</p>
        </div>
      </header>

      <div className="pt-amenities-grid">
        {FACILITY_OPTIONS.map((f) => {
          const active = Boolean(facilities[f.key]);
          return (
            <button
              key={f.key as string}
              type="button"
              className={`pt-amenity-chip ${active ? "pt-active" : ""}`}
              onClick={() => onChange(f.key, !active)}
            >
              <span className="pt-amenity-icon">{f.icon}</span>
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      <div className="pt-info-note">
        ⓘ Select at least one amenity to continue
      </div>
    </section>
  );
};

export default AmenitiesSection;