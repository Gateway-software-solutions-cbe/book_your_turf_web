import React from "react";
import "./CustomerDetailsForm.css";

export interface CustomerDetails {
  name: string;
  mobile: string;
  paidAmount: string;
}

interface Props {
  value: CustomerDetails;
  onChange: (patch: Partial<CustomerDetails>) => void;
  totalAmount: number;
}

const CustomerDetailsForm: React.FC<Props> = ({
  value,
  onChange,
  totalAmount,
}) => {
  const paid = Number(value.paidAmount) || 0;
  const balance = Math.max(0, totalAmount - paid);
  const overpaid = paid > totalAmount;

  return (
    <section className="pt-form-section pt-cdf-section">
      <header className="pt-form-section-header">
        <span className="pt-form-section-icon">👤</span>
        <div>
          <h3>Customer Details</h3>
          <p>Enter the walk-in customer details</p>
        </div>
      </header>

      <div className="pt-cdf-fields">
        <label className="pt-cdf-field">
          <span className="pt-cdf-icon">👤</span>
          <input
            className="pt-cdf-input"
            type="text"
            placeholder="Customer Name *"
            value={value.name}
            onChange={(e) => onChange({ name: e.target.value })}
            maxLength={80}
          />
        </label>

        <label className="pt-cdf-field">
          <span className="pt-cdf-icon">📞</span>
          <input
            className="pt-cdf-input"
            type="tel"
            inputMode="numeric"
            placeholder="Phone Number *"
            value={value.mobile}
            onChange={(e) =>
              onChange({
                mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
              })
            }
            maxLength={10}
          />
        </label>

        <label className="pt-cdf-field">
          <span className="pt-cdf-icon">₹</span>
          <input
            className="pt-cdf-input"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="Paid Amount (₹) *"
            value={value.paidAmount}
            onChange={(e) => onChange({ paidAmount: e.target.value })}
          />
        </label>
      </div>

      {totalAmount > 0 && (
        <div className="pt-cdf-balance">
          <span className="pt-cdf-balance-label">
            {overpaid ? "Overpaid" : "Balance"}
          </span>
          <span
            className={`pt-cdf-balance-value ${
              overpaid
                ? "pt-cdf-overpaid"
                : balance > 0
                  ? "pt-cdf-due"
                  : "pt-cdf-paid"
            }`}
          >
            ₹
            {overpaid
              ? (paid - totalAmount).toFixed(2)
              : balance.toFixed(2)}
          </span>
        </div>
      )}
    </section>
  );
};

export default CustomerDetailsForm;