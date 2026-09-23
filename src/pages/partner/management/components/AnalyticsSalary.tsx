import React from "react";
import type { ExpenseDashboardData } from "../../../../types/partner/management";
import "./AnalyticsSalary.css";

interface Props {
  data: ExpenseDashboardData;
}

const roleEmoji = (role: string): string => {
  const r = role.toLowerCase();
  if (r.includes("manager")) return "💼";
  if (r.includes("supervisor")) return "👔";
  if (r.includes("clean")) return "🧹";
  if (r.includes("security")) return "🛡";
  if (r.includes("maint")) return "🔧";
  return "💼";
};

const AnalyticsSalary: React.FC<Props> = ({ data }) => {
  const { salary_breakdown, summary } = data;
  const total = Number(summary.total_salary_expenses) || 0;

  // Group by role
  const byRole: Record<string, { total: number; count: number }> = {};
  salary_breakdown.forEach((s) => {
    const key = s.role || "Other";
    if (!byRole[key]) byRole[key] = { total: 0, count: 0 };
    byRole[key].total += Number(s.payable_salary || 0);
    byRole[key].count += 1;
  });
  const rows = Object.entries(byRole).sort((a, b) => b[1].total - a[1].total);
  const maxTotal = Math.max(...rows.map(([, v]) => v.total), 1);

  if (rows.length === 0) {
    return (
      <div className="pt-ans-empty">
        <div className="pt-ans-empty-icon">👤</div>
        <p>No active employees for this month</p>
      </div>
    );
  }

  return (
    <div className="pt-ans">
      <div className="pt-ans-card">
        <div className="pt-ans-head">
          <h3 className="pt-ans-title">Salary Breakdown by Role</h3>
          <span className="pt-ans-total">
            Total: <strong>₹{total.toLocaleString("en-IN")}</strong>
          </span>
        </div>

        <div className="pt-ans-rows">
          {rows.map(([role, { total: roleTotal, count }]) => {
            const pct = total > 0 ? (roleTotal / total) * 100 : 0;
            return (
              <div key={role} className="pt-ans-row">
                <div className="pt-ans-row-head">
                  <div className="pt-ans-row-icon">{roleEmoji(role)}</div>
                  <div className="pt-ans-row-body">
                    <span className="pt-ans-row-role">{role}</span>
                    <span className="pt-ans-row-sub">
                      {pct.toFixed(1)}% of total salary · {count} employee
                      {count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="pt-ans-row-amount">
                    ₹{roleTotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="pt-ans-row-bar-track">
                  <div
                    className="pt-ans-row-bar-fill"
                    style={{ width: `${(roleTotal / maxTotal) * 100}%` }}
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

export default AnalyticsSalary;