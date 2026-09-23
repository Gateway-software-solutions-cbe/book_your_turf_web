import React from "react";
import type { ExpenseDashboardData } from "../../../../types/partner/management";
import "./AnalyticsExpenses.css";

interface Props {
  data: ExpenseDashboardData;
}

const purposeEmoji = (purpose: string): string => {
  const p = purpose.toLowerCase();
  if (p.includes("electric")) return "⚡";
  if (p.includes("water")) return "💧";
  if (p.includes("rent")) return "🏠";
  if (p.includes("salary") || p.includes("wage")) return "👤";
  if (p.includes("maintenance") || p.includes("repair")) return "🔧";
  if (p.includes("internet") || p.includes("wifi")) return "📶";
  if (p.includes("equipment")) return "🏏";
  if (p.includes("cleaning")) return "🧹";
  if (p.includes("marketing") || p.includes("ad")) return "📢";
  if (p.includes("tax")) return "📋";
  return "🧾";
};

const AnalyticsExpenses: React.FC<Props> = ({ data }) => {
  const { expense_breakdown, summary } = data;
  const total = Number(summary.total_custom_expenses) || 0;

  // Group by purpose
  const byPurpose: Record<string, number> = {};
  expense_breakdown.forEach((e) => {
    const key = e.purpose || "Other";
    byPurpose[key] = (byPurpose[key] || 0) + Number(e.amount || 0);
  });
  const rows = Object.entries(byPurpose).sort((a, b) => b[1] - a[1]);

  if (rows.length === 0) {
    return (
      <div className="pt-anx-empty">
        <div className="pt-anx-empty-icon">🧾</div>
        <p>No custom expenses for this month</p>
      </div>
    );
  }

  return (
    <div className="pt-anx">
      <div className="pt-anx-card">
        <div className="pt-anx-head">
          <h3 className="pt-anx-title">Expense Breakdown</h3>
          <span className="pt-anx-total">
            Total: <strong>₹{total.toLocaleString("en-IN")}</strong>
          </span>
        </div>

        <div className="pt-anx-rows">
          {rows.map(([purpose, amount]) => {
            const pct = total > 0 ? (amount / total) * 100 : 0;
            return (
              <div key={purpose} className="pt-anx-row">
                <div className="pt-anx-row-head">
                  <div className="pt-anx-row-icon">
                    {purposeEmoji(purpose)}
                  </div>
                  <div className="pt-anx-row-body">
                    <span className="pt-anx-row-purpose">{purpose}</span>
                    <span className="pt-anx-row-pct">
                      {pct.toFixed(1)}% of total expenses
                    </span>
                  </div>
                  <span className="pt-anx-row-amount">
                    ₹{amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="pt-anx-row-bar-track">
                  <div
                    className="pt-anx-row-bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsExpenses;