import React, { useState } from "react";
import { partnerManagementApi, EMPLOYEE_ROLES } from "../../../../api/partner/management";
import type { Employee } from "../../../../types/partner/management";
import "./AddEmployeeModal.css";

interface Props {
  employee: Employee | null; // null = create, else edit
  onClose: () => void;
  onSaved: () => void;
}

const todayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const AddEmployeeModal: React.FC<Props> = ({ employee, onClose, onSaved }) => {
  const isEdit = !!employee;

  const [name, setName] = useState(employee?.name ?? "");
  const [role, setRole] = useState(employee?.role ?? "Manager");
  const [customRole, setCustomRole] = useState("");
  const [useCustomRole, setUseCustomRole] = useState(
    employee ? !EMPLOYEE_ROLES.includes(employee.role) : false,
  );
  const [monthlySalary, setMonthlySalary] = useState(
    employee?.monthly_salary ?? "",
  );
  const [joiningDate, setJoiningDate] = useState(
    employee?.joining_date ?? todayIso(),
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const finalRole = useCustomRole ? customRole.trim() : role;

  const validate = (): string | null => {
    if (!name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!finalRole) return "Role is required";
    if (!monthlySalary || Number.isNaN(Number(monthlySalary)))
      return "Enter a valid monthly salary";
    if (Number(monthlySalary) < 0) return "Salary cannot be negative";
    if (!joiningDate) return "Joining date is required";
    return null;
  };

  const handleSave = async () => {
    setError("");
    const v = validate();
    if (v) return setError(v);

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        role: finalRole,
        monthly_salary: String(Number(monthlySalary)),
        joining_date: joiningDate,
        is_active: true,
      };
      if (isEdit && employee) {
        await partnerManagementApi.updateEmployee(employee.id, payload);
      } else {
        await partnerManagementApi.addEmployee(payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-aem-overlay" onClick={() => !saving && onClose()}>
      <div className="pt-aem-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="pt-aem-title">
          {isEdit ? "Edit Employee" : "Add New Employee"}
        </h2>

        {error && <div className="pt-auth-error">{error}</div>}

        {/* Name */}
        <div className="pt-aem-field">
          <span className="pt-aem-icon">👤</span>
          <input
            className="pt-aem-input"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        </div>

        {/* Role — modifier class drives caret vs toggle button */}
        <div
          className={`pt-aem-field ${
            useCustomRole ? "pt-aem-field-custom" : "pt-aem-field-select"
          }`}
        >
          <span className="pt-aem-icon">💼</span>
          {useCustomRole ? (
            <input
              className="pt-aem-input"
              type="text"
              placeholder="Custom role"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              disabled={saving}
            />
          ) : (
            <select
              className="pt-aem-input pt-aem-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={saving}
            >
              {EMPLOYEE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className="pt-aem-role-toggle"
            onClick={() => setUseCustomRole((v) => !v)}
            disabled={saving}
            title={useCustomRole ? "Pick from list" : "Type custom role"}
          >
            {useCustomRole ? "≡" : "✎"}
          </button>
        </div>

        {/* Salary */}
        <div className="pt-aem-field">
          <span className="pt-aem-icon">₹</span>
          <input
            className="pt-aem-input"
            type="number"
            min={0}
            step="0.01"
            placeholder="Monthly Salary"
            value={monthlySalary}
            onChange={(e) => setMonthlySalary(e.target.value)}
            disabled={saving}
          />
        </div>

        {/* Joining date */}
        <div className="pt-aem-field">
          <span className="pt-aem-icon">📅</span>
          <input
            className="pt-aem-input"
            type="date"
            value={joiningDate}
            onChange={(e) => setJoiningDate(e.target.value)}
            disabled={saving}
          />
        </div>

        {/* Actions */}
        <div className="pt-aem-actions">
          <button
            className="pt-aem-btn pt-aem-btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="pt-aem-btn pt-aem-btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : isEdit ? "Update" : "Add Employee"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeeModal;