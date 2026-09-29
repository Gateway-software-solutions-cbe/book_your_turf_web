import React from "react";
import type { Expense } from "../../../../types/partner/management";
import "./ExpenseCard.css";

interface Props {
  expense: Expense;
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

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ExpenseCard: React.FC<Props> = ({ expense }) => {
  return (
    <div className="pt-exc-card">
      <div className="pt-exc-icon">{purposeEmoji(expense.purpose)}</div>
      <div className="pt-exc-body">
        <div className="pt-exc-top">
          <h3 className="pt-exc-purpose">{expense.purpose}</h3>
          <span className="pt-exc-amount">
            ₹
            {Number(expense.amount).toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="pt-exc-meta">
          <span className="pt-exc-date">📅 {formatDate(expense.date)}</span>
          {expense.notes && (
            <span className="pt-exc-notes" title={expense.notes}>
              📝 {expense.notes}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseCard;