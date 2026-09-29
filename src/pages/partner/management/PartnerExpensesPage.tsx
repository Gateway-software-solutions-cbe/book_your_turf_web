import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { partnerManagementApi } from "../../../api/partner/management";
import type { Expense } from "../../../types/partner/management";
import GuardAction from "../../../components/partner/GuardAction";
import ExpenseCard from "./components/ExpenseCard";
import AddExpenseModal from "./components/AddExpenseModal";
import "./PartnerExpensesPage.css";

type DateMode = "all" | "single" | "range";

const todayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const PartnerExpensesPage: React.FC = () => {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [addOpen, setAddOpen] = useState(false);

  // Date filtering
  const [dateMode, setDateMode] = useState<DateMode>("all");
  const [singleDate, setSingleDate] = useState<string>(todayIso());
  const [startDate, setStartDate] = useState<string>(todayIso());
  const [endDate, setEndDate] = useState<string>(todayIso());

  const [filterOpen, setFilterOpen] = useState(false);

  // ─── Load expenses ─────────────────────────────────────
  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let res;
      if (dateMode === "single") {
        res = await partnerManagementApi.listExpenses(singleDate, singleDate);
      } else if (dateMode === "range") {
        res = await partnerManagementApi.listExpenses(startDate, endDate);
      } else {
        res = await partnerManagementApi.listExpenses();
      }
      setExpenses(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [dateMode, singleDate, startDate, endDate]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // ─── Total ─────────────────────────────────────────────
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [expenses],
  );

  const dateLabel = useMemo(() => {
    if (dateMode === "all") return "All time";
    if (dateMode === "single") {
      return new Date(singleDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return `${new Date(startDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    })} – ${new Date(endDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}`;
  }, [dateMode, singleDate, startDate, endDate]);

  return (
    <div className="pt-exp-page">
      {/* Header */}
      <header className="pt-exp-header">
        <button
          className="pt-exp-back"
          onClick={() => navigate("/partner/dashboard")}
          aria-label="Back"
        >
          ‹
        </button>
        <h1>Expenses</h1>
        <div className="pt-exp-header-actions">
          <button
            className="pt-exp-icon-btn"
            onClick={() => setFilterOpen((v) => !v)}
            title="Filter by date"
          >
            ☰
          </button>
          <GuardAction
            onAllowed={() => setAddOpen(true)}
          >
            {(onClick) => (
              <button
                className="pt-exp-icon-btn"
                onClick={onClick}
                title="Add Expense"
              >
                +
              </button>
            )}
          </GuardAction>
          <button
            className="pt-exp-icon-btn"
            onClick={loadExpenses}
            title="Refresh"
          >
            ⟳
          </button>
        </div>
      </header>

      {error && <div className="pt-auth-error">{error}</div>}

      {/* Filter panel */}
      {filterOpen && (
        <div className="pt-exp-filter-panel">
          <div className="pt-exp-filter-mode">
            <button
              className={`pt-exp-mode-btn ${dateMode === "all" ? "pt-active" : ""}`}
              onClick={() => setDateMode("all")}
            >
              All Time
            </button>
            <button
              className={`pt-exp-mode-btn ${dateMode === "single" ? "pt-active" : ""}`}
              onClick={() => setDateMode("single")}
            >
              Single Day
            </button>
            <button
              className={`pt-exp-mode-btn ${dateMode === "range" ? "pt-active" : ""}`}
              onClick={() => setDateMode("range")}
            >
              Date Range
            </button>
          </div>

          {dateMode === "single" && (
            <label className="pt-exp-date-field">
              <span>📅</span>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
              />
            </label>
          )}

          {dateMode === "range" && (
            <div className="pt-exp-range-row">
              <label className="pt-exp-date-field">
                <span>📅</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label className="pt-exp-date-field">
                <span>📅</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Total expenses hero */}
      <section className="pt-exp-hero">
        <span className="pt-exp-hero-label">Total Expenses</span>
        <span className="pt-exp-hero-value">
          ₹{totalExpenses.toLocaleString("en-IN", {
            maximumFractionDigits: 2,
          })}
        </span>
        <span className="pt-exp-hero-range">{dateLabel}</span>
      </section>

      {/* List */}
      {loading ? (
        <div className="pt-exp-loading">Loading expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="pt-exp-empty">
          <div className="pt-exp-empty-icon">🧾</div>
          <h3>No expenses recorded</h3>
          <p>Tap + to add your first expense</p>
        </div>
      ) : (
        <div className="pt-exp-list">
          {expenses.map((e) => (
            <ExpenseCard key={e.id} expense={e} />
          ))}
        </div>
      )}

      {/* Add expense modal */}
      {addOpen && (
        <AddExpenseModal
          onClose={() => setAddOpen(false)}
          onSaved={() => {
            setAddOpen(false);
            loadExpenses();
          }}
        />
      )}
    </div>
  );
};

export default PartnerExpensesPage;