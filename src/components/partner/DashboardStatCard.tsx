import React from "react";
import "./DashboardStatCard.css";

interface Props {
  icon: string;
  label: string;
  value: string;
  subLines?: { label: string; value: string }[];
  onClick?: () => void;
}

const DashboardStatCard: React.FC<Props> = ({
  icon,
  label,
  value,
  subLines,
  onClick,
}) => {
  return (
    <button
      type="button"
      className="pt-dsc"
      onClick={onClick}
      disabled={!onClick}
    >
      <div className="pt-dsc-icon">{icon}</div>
      <div className="pt-dsc-body">
        <span className="pt-dsc-label">{label}</span>
        <span className="pt-dsc-value">{value}</span>
        {subLines && subLines.length > 0 && (
          <div className="pt-dsc-subs">
            {subLines.map((s) => (
              <span key={s.label} className="pt-dsc-sub">
                {s.label} <strong>{s.value}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="pt-dsc-arrow">›</span>
    </button>
  );
};

export default DashboardStatCard;