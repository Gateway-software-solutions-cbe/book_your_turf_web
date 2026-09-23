import React from "react";
import { SPORTS_OPTIONS } from "../../../../api/partner/turfs";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const SportSection: React.FC<Props> = ({ value }) => {
  const sport = SPORTS_OPTIONS.find((s) => s.value === value);
  return (
    <section className="pt-form-section">
      <header className="pt-form-section-header">
        <span className="pt-form-section-icon">⚽</span>
        <div>
          <h3>Sport</h3>
          <p>Selected from owned venues</p>
        </div>
      </header>

      <div className="pt-sport-readonly">
        <span className="pt-sport-readonly-emoji">
          {sport?.emoji ?? "🏆"}
        </span>
        <span className="pt-sport-readonly-label">
          {value || "Not selected"}
        </span>
      </div>
    </section>
  );
};

export default SportSection;