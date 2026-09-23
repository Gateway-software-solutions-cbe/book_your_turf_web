import React from "react";
import type { ExpenseDashboardData } from "../../../../types/partner/management";
import "./AnalyticsOverview.css";

interface Props {
  data: ExpenseDashboardData;
}

const Donut: React.FC<{
  segments: { value: number; color: string; label: string }[];
  centerLabel?: string;
  centerValue?: string;
}> = ({ segments, centerLabel, centerValue }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const R = 90;
  const r = 55;
  const CX = 110;
  const CY = 110;

  if (total === 0) {
    return (
      <div className="pt-ano-donut-empty">
        <div className="pt-ano-donut-empty-ring" />
        <p>No data</p>
      </div>
    );
  }

  let angle = -Math.PI / 2; // start at 12 o'clock

  const polar = (radius: number, a: number) => ({
    x: CX + radius * Math.cos(a),
    y: CY + radius * Math.sin(a),
  });

  const describeSegment = (start: number, end: number, outer: number, inner: number) => {
    const large = end - start > Math.PI ? 1 : 0;
    const [x1, y1] = Object.values(polar(outer, start));
    const [x2, y2] = Object.values(polar(outer, end));
    const [x3, y3] = Object.values(polar(inner, end));
    const [x4, y4] = Object.values(polar(inner, start));
    return [
      `M ${x1} ${y1}`,
      `A ${outer} ${outer} 0 ${large} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4}`,
      "Z",
    ].join(" ");
  };

  return (
    <div className="pt-ano-donut">
      <svg viewBox="0 0 220 220" className="pt-ano-donut-svg">
        {segments.map((seg, i) => {
          const sweep = (seg.value / total) * Math.PI * 2;
          const path = describeSegment(angle, angle + sweep, R, r);
          const [lx, ly] = Object.values(
            polar((R + r) / 2, angle + sweep / 2),
          );
          angle += sweep;
          return (
            <g key={i}>
              <path d={path} fill={seg.color} />
              {seg.value / total > 0.05 && (
                <text
                  x={lx}
                  y={ly}
                  fill="#fff"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {seg.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {centerLabel && (
        <div className="pt-ano-donut-center">
          <span className="pt-ano-donut-center-value">{centerValue}</span>
          <span className="pt-ano-donut-center-label">{centerLabel}</span>
        </div>
      )}
    </div>
  );
};

const AnalyticsOverview: React.FC<Props> = ({ data }) => {
  const { summary, expense_breakdown } = data;

  const rev = Number(summary.revenue) || 0;
  const exp = Number(summary.grand_total_expenses) || 0;
  const total = rev + exp;

  const byPurpose: Record<string, number> = {};
  expense_breakdown.forEach((e) => {
    const key = e.purpose || "Other";
    byPurpose[key] = (byPurpose[key] || 0) + Number(e.amount || 0);
  });
  const purposeRows = Object.entries(byPurpose).sort((a, b) => b[1] - a[1]);
  const purposeMax = Math.max(...purposeRows.map(([, v]) => v), 1);

  return (
    <div className="pt-ano">
      {/* Revenue vs Expenses donut */}
      <div className="pt-ano-card">
        <h3 className="pt-ano-title">Revenue vs Expenses</h3>
        <Donut
          segments={[
            { value: exp, color: "#ef4444", label: `Expenses\n₹${exp.toFixed(0)}` },
            { value: rev, color: "#22c55e", label: `Revenue\n₹${rev.toFixed(0)}` },
          ]}
        />
        <div className="pt-ano-legend">
          <span className="pt-ano-legend-item">
            <span className="pt-ano-dot" style={{ background: "#22c55e" }} />
            Revenue (
            {total > 0 ? ((rev / total) * 100).toFixed(1) : "0"}%)
          </span>
          <span className="pt-ano-legend-item">
            <span className="pt-ano-dot" style={{ background: "#ef4444" }} />
            Expenses (
            {total > 0 ? ((exp / total) * 100).toFixed(1) : "0"}%)
          </span>
        </div>
      </div>

      {/* Top Expenses */}
      {purposeRows.length > 0 && (
        <div className="pt-ano-card">
          <h3 className="pt-ano-title">Top Expenses</h3>
          <div className="pt-ano-top-list">
            {purposeRows.map(([purpose, amount]) => (
              <div key={purpose} className="pt-ano-top-row">
                <span className="pt-ano-top-purpose">{purpose}</span>
                <span className="pt-ano-top-amount">
                  ₹{amount.toFixed(0)}
                  <span className="pt-ano-top-pct">
                    ({(amount / purposeMax * 100).toFixed(1)}%)
                  </span>
                </span>
                <div className="pt-ano-top-bar-track">
                  <div
                    className="pt-ano-top-bar-fill"
                    style={{ width: `${(amount / purposeMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {purposeRows.length === 0 && exp === 0 && (
        <div className="pt-ano-empty">
          <p>No expense data for this month.</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsOverview;