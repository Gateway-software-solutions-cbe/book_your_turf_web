import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { partnerManagementApi } from "../../../api/partner/management";
import type { ExpenseDashboardData } from "../../../types/partner/management";
import AnalyticsOverview from "./components/AnalyticsOverview";
import AnalyticsExpenses from "./components/AnalyticsExpenses";
import AnalyticsSalary from "./components/AnalyticsSalary";
import AnalyticsCharts from "./components/AnalyticsCharts";
import "./PartnerAnalyticsPage.css";

type TabKey = "overview" | "expenses" | "salary" | "charts";

const MONTHS = [
  ["01", "Jan"], ["02", "Feb"], ["03", "Mar"],
  ["04", "Apr"], ["05", "May"], ["06", "Jun"],
  ["07", "Jul"], ["08", "Aug"], ["09", "Sep"],
  ["10", "Oct"], ["11", "Nov"], ["12", "Dec"],
];

const now = new Date();

const PartnerAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  const [month, setMonth] = useState<string>(
    String(now.getMonth() + 1).padStart(2, "0"),
  );
  const [year, setYear] = useState<number>(now.getFullYear());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const [data, setData] = useState<ExpenseDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<TabKey>("overview");

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  // ─── Load dashboard ─────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await partnerManagementApi.getExpenseDashboard(
        Number(month),
        year,
      );
      setData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const monthLabel = `${MONTHS.find(([v]) => v === month)?.[1] ?? ""} ${year}`;

  return (
    <div className="pt-an-page">
      {/* Header */}
      <header className="pt-an-header">
        <button
          className="pt-an-back"
          onClick={() => navigate("/partner/dashboard")}
          aria-label="Back"
        >
          ‹
        </button>
        <h1>Analytics</h1>
        <div className="pt-an-header-actions">
          <div className="pt-an-month-picker">
            <button
              className="pt-an-month-btn"
              onClick={() => setMonthPickerOpen((v) => !v)}
            >
              <span>{monthLabel}</span>
              <span className="pt-an-caret">▾</span>
            </button>
            {monthPickerOpen && (
              <div className="pt-an-month-menu">
                <div className="pt-an-month-menu-row">
                  {MONTHS.map(([v, l]) => (
                    <button
                      key={v}
                      className={`pt-an-month-chip ${
                        v === month ? "pt-active" : ""
                      }`}
                      onClick={() => {
                        setMonth(v);
                        setMonthPickerOpen(false);
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div className="pt-an-year-row">
                  {years.map((y) => (
                    <button
                      key={y}
                      className={`pt-an-year-chip ${
                        y === year ? "pt-active" : ""
                      }`}
                      onClick={() => {
                        setYear(y);
                        setMonthPickerOpen(false);
                      }}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            className="pt-an-refresh"
            onClick={loadDashboard}
            title="Refresh"
          >
            ⟳
          </button>
        </div>
      </header>

      {error && <div className="pt-auth-error">{error}</div>}

      {/* Loading state */}
      {loading && !data && (
        <div className="pt-an-loading">Loading analytics...</div>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <section className="pt-an-summary">
            <div className="pt-an-card pt-an-card-green">
              <div className="pt-an-card-icon">₹</div>
              <div className="pt-an-card-value">
                ₹{formatNum(data.summary.revenue)}
              </div>
              <div className="pt-an-card-label">Revenue</div>
              <div className="pt-an-card-sub pt-an-sub-green">
                {data.summary.revenue !== "0.00"
                  ? "+100% vs last month"
                  : "No revenue yet"}
              </div>
            </div>

            <div className="pt-an-card pt-an-card-red">
              <div className="pt-an-card-icon">🧾</div>
              <div className="pt-an-card-value">
                ₹{formatNum(data.summary.grand_total_expenses)}
              </div>
              <div className="pt-an-card-label">Expenses</div>
              <div className="pt-an-card-sub pt-an-sub-red">
                {data.summary.revenue !== "0.00"
                  ? `${pct(
                      data.summary.grand_total_expenses,
                      data.summary.revenue,
                    )}% of revenue`
                  : "No revenue to compare"}
              </div>
            </div>

            <div className="pt-an-card pt-an-card-blue">
              <div className="pt-an-card-icon">📈</div>
              <div
                className={`pt-an-card-value ${
                  Number(data.summary.net_profit) < 0
                    ? "pt-an-value-neg"
                    : "pt-an-value-pos"
                }`}
              >
                ₹{formatNum(data.summary.net_profit)}
              </div>
              <div className="pt-an-card-label">Net Profit</div>
              <div className="pt-an-card-sub pt-an-sub-blue">
                {data.summary.revenue !== "0.00"
                  ? `${pct(
                      data.summary.net_profit,
                      data.summary.revenue,
                    )}% margin`
                  : "No margin"}
              </div>
            </div>

            <div className="pt-an-card pt-an-card-orange">
              <div className="pt-an-card-icon">👥</div>
              <div className="pt-an-card-value">
                ₹{formatNum(data.summary.total_salary_expenses)}
              </div>
              <div className="pt-an-card-label">Salary</div>
              <div className="pt-an-card-sub pt-an-sub-orange">
                {pct(
                  data.summary.total_salary_expenses,
                  data.summary.grand_total_expenses,
                )}
                % of expenses
              </div>
            </div>

            <div className="pt-an-card pt-an-card-purple">
              <div className="pt-an-card-icon">•••</div>
              <div className="pt-an-card-value">
                {data.expense_breakdown.length}
              </div>
              <div className="pt-an-card-label">Custom</div>
              <div className="pt-an-card-sub pt-an-sub-purple">
                {data.expense_breakdown.length} record
                {data.expense_breakdown.length === 1 ? "" : "s"}
              </div>
            </div>
          </section>

          {/* Tabs */}
          <div className="pt-an-tabs">
            <button
              className={`pt-an-tab ${
                tab === "overview" ? "pt-active" : ""
              }`}
              onClick={() => setTab("overview")}
            >
              📊 Overview
            </button>
            <button
              className={`pt-an-tab ${
                tab === "expenses" ? "pt-active" : ""
              }`}
              onClick={() => setTab("expenses")}
            >
              💰 Expenses
            </button>
            <button
              className={`pt-an-tab ${tab === "salary" ? "pt-active" : ""}`}
              onClick={() => setTab("salary")}
            >
              👤 Salary
            </button>
            <button
              className={`pt-an-tab ${tab === "charts" ? "pt-active" : ""}`}
              onClick={() => setTab("charts")}
            >
              📈 Charts
            </button>
          </div>

          {/* Tab content */}
          <section className="pt-an-content">
            {tab === "overview" && <AnalyticsOverview data={data} />}
            {tab === "expenses" && <AnalyticsExpenses data={data} />}
            {tab === "salary" && <AnalyticsSalary data={data} />}
            {tab === "charts" && <AnalyticsCharts data={data} />}
          </section>
        </>
      )}

      {!loading && !data && !error && (
        <div className="pt-an-empty">
          <p>No data available for this month.</p>
        </div>
      )}
    </div>
  );
};

// ─── Helpers ───────────────────────────────────────────────
const formatNum = (v: string | number): string => {
  const n = Number(v) || 0;
  const sign = n < 0 ? "-" : "";
  return (
    sign +
    Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })
  );
};

const pct = (part: string | number, whole: string | number): string => {
  const p = Number(part) || 0;
  const w = Number(whole) || 0;
  if (w === 0) return "0";
  return ((p / w) * 100).toFixed(1);
};

export default PartnerAnalyticsPage;