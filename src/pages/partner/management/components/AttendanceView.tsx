import React, { useEffect, useMemo, useState } from "react";
import { partnerManagementApi } from "../../../../api/partner/management";
import type {
  Employee,
  AttendanceStatus,
  AttendanceRecord,
} from "../../../../types/partner/management";
import GuardAction from "../../../../components/partner/GuardAction";
import "./AttendanceView.css";

interface Props {
  employees: Employee[];
}

const todayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const AttendanceView: React.FC<Props> = ({ employees }) => {
  const [date, setDate] = useState(todayIso());
  const [records, setRecords] = useState<Record<number, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeStatusTab, setActiveStatusTab] =
    useState<AttendanceStatus>("present");

  // Load existing attendance for the date
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await partnerManagementApi.getAttendance(date);
        const byEmp: Record<number, AttendanceStatus> = {};
        (res.data || []).forEach((r: AttendanceRecord) => {
          if (r.employee_id != null) {
            byEmp[r.employee_id] = r.status;
          }
        });
        setRecords(byEmp);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load attendance");
      } finally {
        setLoading(false);
      }
    })();
  }, [date]);

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.is_active),
    [employees],
  );

  const setStatus = (id: number, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [id]: status }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const next: Record<number, AttendanceStatus> = {};
    activeEmployees.forEach((e) => {
      next[e.id] = status;
    });
    setRecords(next);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    const payload = activeEmployees
      .filter((e) => records[e.id] != null)
      .map((e) => ({ id: e.id, status: records[e.id] }));
    if (payload.length === 0) {
      setError("Mark at least one employee before saving.");
      return;
    }
    setSaving(true);
    try {
      await partnerManagementApi.markBulkAttendance({ date, records: payload });
      setSuccess("Attendance marked");
      setTimeout(() => setSuccess(""), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to mark attendance");
    } finally {
      setSaving(false);
    }
  };

  // Summary counts
  const summary = useMemo(() => {
    let present = 0;
    let half = 0;
    let absent = 0;
    activeEmployees.forEach((e) => {
      const s = records[e.id];
      if (s === "present") present++;
      else if (s === "half_day") half++;
      else if (s === "absent") absent++;
    });
    return { present, half, absent };
  }, [records, activeEmployees]);

  // Filter by active status tab
  const filteredEmployees = useMemo(() => {
    return activeEmployees.filter((e) => {
      const s = records[e.id];
      if (activeStatusTab === "present") return s === "present";
      if (activeStatusTab === "half_day") return s === "half_day";
      return s === "absent";
    });
  }, [activeEmployees, records, activeStatusTab]);

  return (
    <div className="pt-av">
      {/* Today header */}
      <div className="pt-av-head">
        <div className="pt-av-head-icon">📅</div>
        <div className="pt-av-head-body">
          <span className="pt-av-head-label">Today's Attendance</span>
          <span className="pt-av-head-date">
            {new Date(date).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <GuardAction onAllowed={() => handleMarkAll("present")}>
          {(onClick) => (
            <button className="pt-av-head-btn" onClick={onClick}>
              ✎ Mark Today
            </button>
          )}
        </GuardAction>
      </div>

      {/* Date picker */}
      <div className="pt-av-date-picker">
        <label>
          <span>📅</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      {/* Summary cards */}
      <div className="pt-av-summary">
        <div className="pt-av-summary-card">
          <div className="pt-av-summary-icon pt-av-summary-present">✓</div>
          <div className="pt-av-summary-value">{summary.present}</div>
          <div className="pt-av-summary-label">Present</div>
        </div>
        <div className="pt-av-summary-card">
          <div className="pt-av-summary-icon pt-av-summary-half">⏰</div>
          <div className="pt-av-summary-value">{summary.half}</div>
          <div className="pt-av-summary-label">Half Day</div>
        </div>
        <div className="pt-av-summary-card">
          <div className="pt-av-summary-icon pt-av-summary-absent">✕</div>
          <div className="pt-av-summary-value">{summary.absent}</div>
          <div className="pt-av-summary-label">Absent</div>
        </div>
      </div>

      {/* Total + bulk actions */}
      <div className="pt-av-total">
        <span>Total Active Employees</span>
        <span className="pt-av-total-count">{activeEmployees.length}</span>
      </div>

      <div className="pt-av-bulk-row">
        <GuardAction onAllowed={() => handleMarkAll("present")}>
          {(onClick) => (
            <button className="pt-av-bulk-btn" onClick={onClick}>
              ✓ All Present
            </button>
          )}
        </GuardAction>
        <GuardAction onAllowed={() => handleMarkAll("absent")}>
          {(onClick) => (
            <button
              className="pt-av-bulk-btn pt-av-bulk-absent"
              onClick={onClick}
            >
              ✕ All Absent
            </button>
          )}
        </GuardAction>
      </div>

      {/* Status filter tabs */}
      <div className="pt-av-status-tabs">
        <button
          className={`pt-av-status-tab ${
            activeStatusTab === "present" ? "pt-active" : ""
          }`}
          onClick={() => setActiveStatusTab("present")}
        >
          Present
        </button>
        <button
          className={`pt-av-status-tab ${
            activeStatusTab === "half_day" ? "pt-active" : ""
          }`}
          onClick={() => setActiveStatusTab("half_day")}
        >
          Half Day
        </button>
        <button
          className={`pt-av-status-tab ${
            activeStatusTab === "absent" ? "pt-active" : ""
          }`}
          onClick={() => setActiveStatusTab("absent")}
        >
          Absent
        </button>
      </div>

      {/* Employee list */}
      {error && <div className="pt-auth-error">{error}</div>}
      {success && <div className="pt-success-banner">{success}</div>}

      {loading ? (
        <div className="pt-av-loading">Loading...</div>
      ) : filteredEmployees.length === 0 ? (
        <div className="pt-av-empty">
          <div className="pt-av-empty-icon">✓</div>
          <p>No {activeStatusTab.replace("_", " ")} employees</p>
        </div>
      ) : (
        <div className="pt-av-list">
          {filteredEmployees.map((e) => (
            <div key={e.id} className="pt-av-row">
              <div className="pt-av-row-body">
                <span className="pt-av-row-name">{e.name}</span>
                <span className="pt-av-row-role">{e.role}</span>
              </div>
              <div className="pt-av-row-actions">
                <button
                  className={`pt-av-pill ${
                    records[e.id] === "present" ? "pt-av-pill-present" : ""
                  }`}
                  onClick={() => setStatus(e.id, "present")}
                  title="Present"
                >
                  ✓
                </button>
                <button
                  className={`pt-av-pill ${
                    records[e.id] === "half_day" ? "pt-av-pill-half" : ""
                  }`}
                  onClick={() => setStatus(e.id, "half_day")}
                  title="Half Day"
                >
                  ⏰
                </button>
                <button
                  className={`pt-av-pill ${
                    records[e.id] === "absent" ? "pt-av-pill-absent" : ""
                  }`}
                  onClick={() => setStatus(e.id, "absent")}
                  title="Absent"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sticky save */}
      {activeEmployees.length > 0 && (
        <div className="pt-av-actions">
          <button
            className="pt-av-save"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Mark Bulk Attendance"}
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;