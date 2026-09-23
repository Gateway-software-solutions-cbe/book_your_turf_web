import React from "react";
import type { ExpenseDashboardData } from "../../../../types/partner/management";
import "./AnalyticsCharts.css";

interface Props {
  data: ExpenseDashboardData;
}

/** Simple SVG donut with percentage-based segments. No inline text. */
const Donut: React.FC<{
  segments: { value: number; color: string; label: string }[];
}> = ({ segments }) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className="pt-anc-donut-empty">
        <div className="pt-anc-donut-empty-ring" />
        <p>No data</p>
      </div>
    );
  }

  const CX = 100;
  const CY = 100;
  const OUTER = 80;
  const INNER = 50;
  const TAU = Math.PI * 2;

  const polar = (radius: number, angle: number) => ({
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  });

  const describeArc = (startAngle: number, endAngle: number): string => {
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    const o1 = polar(OUTER, startAngle);
    const o2 = polar(OUTER, endAngle);
    const i1 = polar(INNER, endAngle);
    const i2 = polar(INNER, startAngle);
    return [
      `M ${o1.x.toFixed(3)} ${o1.y.toFixed(3)}`,
      `A ${OUTER} ${OUTER} 0 ${large} 1 ${o2.x.toFixed(3)} ${o2.y.toFixed(3)}`,
      `L ${i1.x.toFixed(3)} ${i1.y.toFixed(3)}`,
      `A ${INNER} ${INNER} 0 ${large} 0 ${i2.x.toFixed(3)} ${i2.y.toFixed(3)}`,
      "Z",
    ].join(" ");
  };

  // If a single segment is the whole pie, just render a full ring.
  const isFullRing =
    segments.length === 1 ||
    segments.some((s) => s.value / total > 0.999);

  if (isFullRing) {
    const color = segments[0].color;
    return (
      <svg
        width="220"
        height="220"
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
        style={{
          display: "block",
          width: "220px",
          height: "220px",
          flexShrink: 0,
        }}
      >
        <circle
          cx={CX}
          cy={CY}
          r={(OUTER + INNER) / 2}
          fill="none"
          stroke={color}
          strokeWidth={OUTER - INNER}
        />
      </svg>
    );
  }

  let cursor = -Math.PI / 2;

  return (
    <svg
      width="220"
      height="220"
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid meet"
      style={{
        display: "block",
        width: "220px",
        height: "220px",
        flexShrink: 0,
      }}
    >
      {segments.map((seg, i) => {
        // Cap the sweep to just under a full turn so SVG arcs always render
        const rawSweep = (seg.value / total) * TAU;
        const sweep = Math.min(rawSweep, TAU - 0.001);
        const path = describeArc(cursor, cursor + sweep);
        cursor += rawSweep;
        return <path key={i} d={path} fill={seg.color} />;
      })}
    </svg>
  );
};

const AnalyticsCharts: React.FC<Props> = ({ data }) => {
  const { summary, expense_breakdown, salary_breakdown } = data;

  // ── Expense distribution ─────────────────────────────
  const byPurpose: Record<string, number> = {};
  expense_breakdown.forEach((e) => {
    const key = e.purpose || "Other";
    byPurpose[key] = (byPurpose[key] || 0) + Number(e.amount || 0);
  });

  const purposeColors = [
    "#3b82f6",
    "#ef4444",
    "#f59e0b",
    "#8b5cf6",
    "#10b981",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];

  const purposeSegments = Object.entries(byPurpose)
    .sort((a, b) => b[1] - a[1])
    .map(([purpose, amount], i) => ({
      value: amount,
      color: purposeColors[i % purposeColors.length],
      label: purpose,
    }));

  const purposeTotal = purposeSegments.reduce((s, x) => s + x.value, 0);

  // ── Salary distribution by role ──────────────────────
  const byRole: Record<string, number> = {};
  salary_breakdown.forEach((s) => {
    const key = s.role || "Other";
    byRole[key] = (byRole[key] || 0) + Number(s.payable_salary || 0);
  });

  const roleColors = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"];
  const roleSegments = Object.entries(byRole)
    .sort((a, b) => b[1] - a[1])
    .map(([role, amount], i) => ({
      value: amount,
      color: roleColors[i % roleColors.length],
      label: role,
    }));

  const roleTotal = roleSegments.reduce((s, x) => s + x.value, 0);
  const hasSalary = roleTotal > 0;

  return (
    <div className="pt-anc">
      {/* Expense Distribution */}
      <div className="pt-anc-card">
        <h3 className="pt-anc-title">Expense Distribution</h3>

        {purposeTotal > 0 ? (
          <>
            <div className="pt-anc-donut-wrap"
            style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "12px 0",
    width: "100%",
    minHeight: "240px",
    height: "240px",
  }}
>
              <Donut segments={purposeSegments} />
            </div>
            <div className="pt-anc-legend">
              {purposeSegments.map((seg) => (
                <span key={seg.label} className="pt-anc-legend-item">
                  <span
                    className="pt-anc-legend-dot"
                    style={{ background: seg.color }}
                  />
                  {seg.label}
                  <span className="pt-anc-legend-pct">
                    {((seg.value / purposeTotal) * 100).toFixed(0)}%
                  </span>
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="pt-anc-empty">
            <p>No expenses recorded this month</p>
          </div>
        )}
      </div>

      {/* Salary Distribution by Role */}
      <div className="pt-anc-card">
        <h3 className="pt-anc-title">Salary Distribution by Role</h3>

        {hasSalary ? (
          <>
            <div className="pt-anc-donut-wrap"
            style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "12px 0",
    width: "100%",
    minHeight: "240px",
    height: "240px",
  }}>
              <Donut segments={roleSegments} />
            </div>
            <div className="pt-anc-legend">
              {roleSegments.map((seg) => (
                <span key={seg.label} className="pt-anc-legend-item">
                  <span
                    className="pt-anc-legend-dot"
                    style={{ background: seg.color }}
                  />
                  {seg.label}
                  <span className="pt-anc-legend-pct">
                    ₹{seg.value.toLocaleString("en-IN")}
                  </span>
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="pt-anc-empty">
            <p>No salary payable this month</p>
          </div>
        )}
      </div>

      {/* Bottom stat cards */}
      <div className="pt-anc-stats">
        <div className="pt-anc-stat pt-anc-stat-green">
          <div className="pt-anc-stat-icon">₹</div>
          <div className="pt-anc-stat-value">
            ₹{Number(summary.revenue).toLocaleString("en-IN")}
          </div>
          <div className="pt-anc-stat-label">Total Revenue</div>
          <div className="pt-anc-stat-sub pt-anc-sub-green">100%</div>
        </div>

        <div className="pt-anc-stat pt-anc-stat-red">
          <div className="pt-anc-stat-icon">📈</div>
          <div className="pt-anc-stat-value">
            {Number(summary.revenue) > 0
              ? (
                  (Number(summary.net_profit) / Number(summary.revenue)) *
                  100
                ).toFixed(1)
              : "0"}
            %
          </div>
          <div className="pt-anc-stat-label">Net Profit Margin</div>
          <div className="pt-anc-stat-sub pt-anc-sub-red">of revenue</div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;