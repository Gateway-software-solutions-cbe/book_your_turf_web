import React from "react";
import { usePartnerAuth } from "../../../../context/PartnerAuthContext";

interface Props {
  name: string;
  businessName: string;
  description: string;
  achievements: string;
  onChange: (key: string, value: string) => void;
}

const MAX_DESC = 130;
const MAX_ACH = 130;

const BusinessInfoSection: React.FC<Props> = ({
  name,
  businessName,
  description,
  achievements,
  onChange,
}) => {
  const { partner } = usePartnerAuth();

  return (
    <section className="pt-form-section">
      <header className="pt-form-section-header">
        <span className="pt-form-section-icon">🏢</span>
        <div>
          <h3>Business Information</h3>
          <p>Contact &amp; owner details</p>
        </div>
      </header>

      {/* Owner Name — read-only from partner profile */}
      <div className="pt-field">
        <label className="pt-field-label">Owner Name</label>
        <div className="pt-field-readonly">
          <span className="pt-field-icon">👤</span>
          <span>{partner?.name || "—"}</span>
        </div>
      </div>

      {/* Email — read-only */}
      <div className="pt-field">
        <label className="pt-field-label">Email</label>
        <div className="pt-field-readonly">
          <span className="pt-field-icon">✉</span>
          <span>{partner?.email || "—"}</span>
        </div>
      </div>

      {/* Phone — read-only */}
      <div className="pt-field">
        <label className="pt-field-label">Phone</label>
        <div className="pt-field-readonly">
          <span className="pt-field-icon">☎</span>
          <span>{partner?.number || "—"}</span>
        </div>
      </div>

      {/* Editable fields */}
      <div className="pt-field">
        <label className="pt-field-label">
          Venue / Business Name
        </label>
        <input
          className="pt-input"
          placeholder="Enter venue name"
          value={name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>

      <div className="pt-field">
        <label className="pt-field-label">Description (Optional)</label>
        <textarea
          className="pt-input pt-textarea"
          placeholder="Tell players about your venue"
          value={description}
          maxLength={MAX_DESC}
          onChange={(e) => onChange("description", e.target.value)}
        />
        <span className="pt-char-count">
          {description.length}/{MAX_DESC}
        </span>
      </div>

      <div className="pt-field">
        <label className="pt-field-label">Achievements (Optional)</label>
        <textarea
          className="pt-input pt-textarea"
          placeholder="Awards, certifications, etc."
          value={achievements}
          maxLength={MAX_ACH}
          onChange={(e) => onChange("achievements", e.target.value)}
        />
        <span className="pt-char-count">
          {achievements.length}/{MAX_ACH}
        </span>
      </div>
    </section>
  );
};

export default BusinessInfoSection;