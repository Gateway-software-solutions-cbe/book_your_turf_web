import React, { useState } from "react";
import { partnerManagementApi } from "../../../../api/partner/management";
import "./AddExpenseModal.css";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

const PURPOSE_OPTIONS = [
  { value: "Electricity Bill", emoji: "⚡" },
  { value: "Water Bill", emoji: "💧" },
  { value: "Rent", emoji: "🏠" },
  { value: "Maintenance", emoji: "🔧" },
  { value: "Equipment Purchase", emoji: "🏏" },
  { value: "Miscellaneous", emoji: "📝" },
  { value: "Cleaning", emoji: "🧹" },
  { value: "Marketing", emoji: "📢" },
];

const todayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const AddExpenseModal: React.FC<Props> = ({ onClose, onSaved }) => {
  const [purpose, setPurpose] = useState(PURPOSE_OPTIONS[0].value);
  const [purposeOpen, setPurposeOpen] = useState(false);
  const [customPurpose, setCustomPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isOther = purpose === "Other";
  const finalPurpose = isOther ? customPurpose.trim() : purpose;

  const selectedEmoji =
    PURPOSE_OPTIONS.find((p) => p.value === purpose)?.emoji ?? "🧾";

  const validate = (): string | null => {
    if (!finalPurpose) return "Purpose is required";
    if (!amount || Number.isNaN(Number(amount)))
      return "Enter a valid amount";
    if (Number(amount) <= 0) return "Amount must be greater than 0";
    if (!date) return "Date is required";
    return null;
  };

  const handleSave = async () => {
    setError("");
    const v = validate();
    if (v) return setError(v);

    setSaving(true);
    try {
      await partnerManagementApi.addExpense({
        purpose: finalPurpose,
        amount: String(Number(amount)),
        date,
        notes: notes.trim(),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to add expense");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-aex-overlay" onClick={() => !saving && onClose()}>
      <div className="pt-aex-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="pt-aex-title">Add Expense</h2>

        {error && <div className="pt-auth-error">{error}</div>}

        {/* Purpose */}
        <div className="pt-aex-field pt-aex-field-select">
          <span className="pt-aex-emoji">{selectedEmoji}</span>
          <button
            type="button"
            className="pt-aex-select-trigger"
            onClick={() => setPurposeOpen((v) => !v)}
            disabled={saving}
          >
            <span>{purpose}</span>
            <span className="pt-aex-caret">▾</span>
          </button>

          {purposeOpen && (
            <ul className="pt-aex-menu">
              {PURPOSE_OPTIONS.map((p) => (
                <li key={p.value}>
                  <button
                    className={`pt-aex-menu-item ${
                      p.value === purpose ? "pt-active" : ""
                    }`}
                    onClick={() => {
                      setPurpose(p.value);
                      setPurposeOpen(false);
                    }}
                  >
                    <span className="pt-aex-menu-emoji">{p.emoji}</span>
                    <span>{p.value}</span>
                    {p.value === purpose && (
                      <span className="pt-aex-check">✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Custom purpose when "Other" */}
        {isOther && (
          <div className="pt-aex-field">
            <span className="pt-aex-emoji">✎</span>
            <input
              className="pt-aex-input"
              type="text"
              placeholder="Describe the purpose"
              value={customPurpose}
              onChange={(e) => setCustomPurpose(e.target.value)}
              disabled={saving}
              maxLength={80}
            />
          </div>
        )}

        {/* Amount */}
        <div className="pt-aex-field">
          <span className="pt-aex-emoji">₹</span>
          <input
            className="pt-aex-input"
            type="number"
            min={0}
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={saving}
          />
        </div>

        {/* Date */}
        <div className="pt-aex-field">
          <span className="pt-aex-emoji">📅</span>
          <input
            className="pt-aex-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={saving}
          />
        </div>

        {/* Notes */}
        <div className="pt-aex-field pt-aex-field-notes">
          <textarea
            className="pt-aex-textarea"
            placeholder="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={200}
            rows={3}
            disabled={saving}
          />
        </div>

        {/* Actions */}
        <div className="pt-aex-actions">
          <button
            className="pt-aex-btn pt-aex-btn-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="pt-aex-btn pt-aex-btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;