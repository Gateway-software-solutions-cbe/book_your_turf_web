import React, { useEffect, useState } from "react";
import { partnerManagementApi } from "../../../../api/partner/management";
import type { SalaryReportRow } from "../../../../types/partner/management";
import "./SalaryReportView.css";

interface Props {
  onClose: () => void;
}

const now = new Date();

const SalaryReportView: React.FC<Props> = ({ onClose }) => {
  const [month, setMonth] = useState<string>(
    String(now.getMonth() + 1).padStart(2, "0"),
  );
  const [year, setYear] = useState<number>(now.getFullYear());
  const [rows, setRows] = useState<SalaryReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await partnerManagementApi.getSalaryReport(
          Number(month),
          year,
        );
        setRows(res.data || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load salary");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [month, year]);

  const totalPayable = rows.reduce(
    (sum, r) => sum + Number(r.payable_salary || 0),
    0,
  );

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="pt-sr-overlay" onClick={onClose}>
      <div className="pt-sr-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pt-sr-header">
          <h2>Monthly Salary Report</h2>
          <button className="pt-sr-close" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="pt-sr-filters">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="pt-sr-select"
          >
            {[
              ["01", "January"], ["02", "February"], ["03", "March"],
              ["04", "April"], ["05", "May"], ["06", "June"],
              ["07", "July"], ["08", "August"], ["09", "September"],
              ["10", "October"], ["11", "November"], ["12", "December"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="pt-sr-select"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="pt-auth-error">{error}</div>}

        {loading ? (
          <div className="pt-sr-loading">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="pt-sr-empty">
            <p>No salary data for this month.</p>
          </div>
        ) : (
          <>
            <div className="pt-sr-table">
              <div className="pt-sr-row pt-sr-row-head">
                <span>Employee</span>
                <span>Present</span>
                <span>Half</span>
                <span>Absent</span>
                <span>Payable</span>
              </div>
              {rows.map((r) => (
                <div key={r.employee_id} className="pt-sr-row">
                  <span className="pt-sr-cell-name">
                    <strong>{r.employee_name}</strong>
                    <small>{r.role}</small>
                  </span>
                  <span className="pt-sr-cell pt-sr-present">
                    {r.days_present}
                  </span>
                  <span className="pt-sr-cell pt-sr-half">
                    {r.days_half}
                  </span>
                  <span className="pt-sr-cell pt-sr-absent">
                    {r.days_absent}
                  </span>
                  <span className="pt-sr-cell pt-sr-payable">
                    ₹{Number(r.payable_salary).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-sr-total">
              <span>Total Payable</span>
              <span className="pt-sr-total-value">
                ₹{totalPayable.toLocaleString("en-IN")}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalaryReportView;