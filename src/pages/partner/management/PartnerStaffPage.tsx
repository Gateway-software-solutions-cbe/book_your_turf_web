import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { partnerManagementApi } from "../../../api/partner/management";
import type { Employee } from "../../../types/partner/management";
import GuardAction from "../../../components/partner/GuardAction";
import AddEmployeeModal from "./components/AddEmployeeModal";
import EmployeeCard from "./components/EmployeeCard";
import AttendanceView from "./components/AttendanceView";
import SalaryReportView from "./components/SalaryReportView";
import "./PartnerStaffPage.css";

type TabKey = "employees" | "attendance";
type EmployeeFilter = "active" | "inactive";

const PartnerStaffPage: React.FC = () => {
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabKey>("employees");
  const [empFilter, setEmpFilter] = useState<EmployeeFilter>("active");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [salaryOpen, setSalaryOpen] = useState(false);

  // ─── Load employees ─────────────────────────────────────
  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await partnerManagementApi.listEmployees(
        empFilter === "active",
      );
      setEmployees(res.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [empFilter]);

  useEffect(() => {
    if (tab === "employees") loadEmployees();
  }, [tab, loadEmployees]);

  // ─── Filtered list ──────────────────────────────────────
  const filtered = useMemo(() => {
    let list = employees;
    if (roleFilter !== "all") {
      list = list.filter(
        (e) => e.role.toLowerCase() === roleFilter.toLowerCase(),
      );
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(s) ||
          e.role.toLowerCase().includes(s),
      );
    }
    return list;
  }, [employees, roleFilter, search]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    employees.forEach((e) => e.role && roles.add(e.role));
    return Array.from(roles).sort();
  }, [employees]);

  // ─── Delete ─────────────────────────────────────────────
  const handleDelete = async (emp: Employee) => {
    if (
      !window.confirm(
        `Deactivate ${emp.name}? They will no longer appear as active staff.`,
      )
    )
      return;
    try {
      await partnerManagementApi.deleteEmployee(emp.id);
      await loadEmployees();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to deactivate");
    }
  };

  return (
    <div className="pt-staff-page">
      {/* Header */}
      <header className="pt-staff-header">
        <button
          className="pt-staff-back"
          onClick={() => navigate("/partner/dashboard")}
          aria-label="Back"
        >
          ‹
        </button>
        <h1>Staff Management</h1>
        <div className="pt-staff-header-actions">
          <GuardAction
            onAllowed={() => {
              setEditing(null);
              setAddModalOpen(true);
            }}
          >
            {(onClick) => (
              <button
                type="button"
                className="pt-staff-add"
                onClick={onClick}
                title="Add Employee"
              >
                +
              </button>
            )}
          </GuardAction>
          <button
            type="button"
            className="pt-staff-refresh"
            onClick={loadEmployees}
            aria-label="Refresh"
          >
            ⟳
          </button>
        </div>
      </header>

      {error && <div className="pt-auth-error">{error}</div>}

      {/* Tabs */}
      <div className="pt-staff-tabs">
        <button
          className={`pt-staff-tab ${tab === "employees" ? "pt-active" : ""}`}
          onClick={() => setTab("employees")}
        >
          👥 Employees
        </button>
        <button
          className={`pt-staff-tab ${tab === "attendance" ? "pt-active" : ""}`}
          onClick={() => setTab("attendance")}
        >
          📅 Attendance
        </button>
      </div>

      {/* Employees tab */}
      {tab === "employees" && (
        <>
          {/* Search + Role filter */}
          <div className="pt-staff-filter-row">
            <div className="pt-staff-search">
              <span className="pt-staff-search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search.."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="pt-staff-role-select">
              <button
                className="pt-staff-role-btn"
                onClick={() => setRoleMenuOpen((v) => !v)}
              >
                <span className="pt-staff-role-icon">≡</span>
                <span>
                  {roleFilter === "all"
                    ? "All Roles"
                    : roleFilter}
                </span>
                <span className="pt-staff-caret">▾</span>
              </button>

              {roleMenuOpen && (
                <ul className="pt-staff-role-menu">
                  <li>
                    <button
                      className={`pt-staff-role-item ${
                        roleFilter === "all" ? "pt-active" : ""
                      }`}
                      onClick={() => {
                        setRoleFilter("all");
                        setRoleMenuOpen(false);
                      }}
                    >
                      ≡ All Roles
                    </button>
                  </li>
                  {uniqueRoles.map((r) => (
                    <li key={r}>
                      <button
                        className={`pt-staff-role-item ${
                          roleFilter === r ? "pt-active" : ""
                        }`}
                        onClick={() => {
                          setRoleFilter(r);
                          setRoleMenuOpen(false);
                        }}
                      >
                        💼 {r}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Active / Inactive pills */}
          <div className="pt-staff-active-row">
            <button
              className={`pt-staff-active-btn ${
                empFilter === "active" ? "pt-active" : ""
              }`}
              onClick={() => setEmpFilter("active")}
            >
              Active Employees
            </button>
            <button
              className={`pt-staff-active-btn ${
                empFilter === "inactive" ? "pt-active" : ""
              }`}
              onClick={() => setEmpFilter("inactive")}
            >
              Inactive Employees
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="pt-staff-loading">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="pt-staff-empty">
              <div className="pt-staff-empty-icon">👥</div>
              <p>No employees found</p>
            </div>
          ) : (
            <div className="pt-staff-list">
              {filtered.map((e) => (
                <EmployeeCard
                  key={e.id}
                  employee={e}
                  onEdit={() => {
                    setEditing(e);
                    setAddModalOpen(true);
                  }}
                  onDelete={() => handleDelete(e)}
                  onViewSalary={() => setSalaryOpen(true)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Attendance tab */}
      {tab === "attendance" && <AttendanceView employees={employees} />}

      {/* Add / Edit employee modal */}
      {addModalOpen && (
        <AddEmployeeModal
          employee={editing}
          onClose={() => {
            setAddModalOpen(false);
            setEditing(null);
          }}
          onSaved={() => {
            setAddModalOpen(false);
            setEditing(null);
            loadEmployees();
          }}
        />
      )}

      {/* Salary modal */}
      {salaryOpen && (
        <SalaryReportView onClose={() => setSalaryOpen(false)} />
      )}
    </div>
  );
};

export default PartnerStaffPage;