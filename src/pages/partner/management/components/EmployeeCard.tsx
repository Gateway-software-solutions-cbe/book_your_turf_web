import React from "react";
import type { Employee } from "../../../../types/partner/management";
import "./EmployeeCard.css";

interface Props {
  employee: Employee;
  onEdit: () => void;
  onDelete: () => void;
  onViewSalary: () => void;
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatCurrency = (v: string) => {
  const n = Number(v) || 0;
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const EmployeeCard: React.FC<Props> = ({
  employee,
  onEdit,
  onDelete,
  onViewSalary,
}) => {
  return (
    <div className={`pt-ec-card ${!employee.is_active ? "pt-ec-inactive" : ""}`}>
      <div className="pt-ec-top">
        <div className="pt-ec-avatar">{initials(employee.name)}</div>
        <div className="pt-ec-body">
          <div className="pt-ec-name-row">
            <h3 className="pt-ec-name">{employee.name}</h3>
            <span
              className={`pt-ec-status ${
                employee.is_active ? "pt-ec-status-active" : "pt-ec-status-inactive"
              }`}
            >
              {employee.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="pt-ec-meta">
            <span className="pt-ec-role">💼 {employee.role}</span>
            <span className="pt-ec-salary">
              ₹{formatCurrency(employee.monthly_salary)}/mo
            </span>
          </div>
          <div className="pt-ec-joined">
            📅 Joined {new Date(employee.joining_date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      <div className="pt-ec-actions">
        <button className="pt-ec-btn pt-ec-btn-salary" onClick={onViewSalary}>
          📊 Salary
        </button>
        <button className="pt-ec-btn pt-ec-btn-edit" onClick={onEdit}>
          ✏ Edit
        </button>
        {employee.is_active && (
          <button className="pt-ec-btn pt-ec-btn-delete" onClick={onDelete}>
            ✕ Deactivate
          </button>
        )}
      </div>
    </div>
  );
};

export default EmployeeCard;