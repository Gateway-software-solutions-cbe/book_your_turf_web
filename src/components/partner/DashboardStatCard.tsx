
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
  const hasSubLines = Boolean(subLines && subLines.length > 0);

  return (
    <button
      type="button"
      className="pt-dsc"
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${label}: ${value}. View details`}
    >
      {/* Top accent */}
      <span className="pt-dsc-accent" aria-hidden="true" />

      {/* Icon */}
      <span className="pt-dsc-icon" aria-hidden="true">
        {icon}
      </span>

      {/* Main content */}
      <span className="pt-dsc-body">
        <span className="pt-dsc-label">{label}</span>

        <span className="pt-dsc-value">{value}</span>

        {hasSubLines && (
          <span className="pt-dsc-subs">
            {subLines!.map((s) => (
              <span key={s.label} className="pt-dsc-sub">
                <span className="pt-dsc-sub-label">{s.label}</span>
                <span className="pt-dsc-sub-value">{s.value}</span>
              </span>
            ))}
          </span>
        )}
      </span>

      {/* Navigation indicator */}
      <span className="pt-dsc-arrow" aria-hidden="true">
        <svg
          viewBox="0 0 20 20"
          width="17"
          height="17"
          fill="none"
        >
          <path
            d="M7.5 4.5L13 10L7.5 15.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
};

export default DashboardStatCard;