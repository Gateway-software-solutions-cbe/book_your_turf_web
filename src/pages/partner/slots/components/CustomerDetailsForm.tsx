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

const MAX_PAID = 1000000;      // 10,00,000
const MAX_INT_DIGITS = 7;      // hard input cap — 8th digit rejected

const CustomerDetailsForm: React.FC<Props> = ({
  value,
  onChange,
  totalAmount,
}) => {
  const paid = Number(value.paidAmount) || 0;
  const balance = Math.max(0, totalAmount - paid);
  const overpaid = paid > totalAmount;

  // Error shown below the input for the >10,00,000 case.
  const paidAmountError =
    value.paidAmount !== "" && !Number.isNaN(paid) && paid > MAX_PAID
      ? `Maximum ${MAX_PAID.toLocaleString("en-IN")} only`
      : "";

  const handlePaidChange = (raw: string) => {
    // Strip everything except digits and one decimal point.
    let cleaned = raw.replace(/[^\d.]/g, "");

    const firstDot = cleaned.indexOf(".");
    if (firstDot !== -1) {
      cleaned =
        cleaned.slice(0, firstDot + 1) +
        cleaned.slice(firstDot + 1).replace(/\./g, "");
    }

    const [intPart = "", decPart] = cleaned.split(".");

    // HARD cap: 7 integer digits. 8th digit is dropped, full stop.
    const intCapped = intPart.slice(0, MAX_INT_DIGITS);
    const decCapped =
      decPart !== undefined ? decPart.slice(0, 2) : undefined;

    const next =
      decCapped !== undefined ? `${intCapped}.${decCapped}` : intCapped;

    onChange({ paidAmount: next });
  };

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

        <label
          className={`pt-cdf-field ${
            paidAmountError ? "pt-cdf-field--error" : ""
          }`}
        >
          <span className="pt-cdf-icon">₹</span>
          <input
            className="pt-cdf-input"
            type="text"
            inputMode="decimal"
            placeholder="Paid Amount (₹) *"
            value={value.paidAmount}
            onChange={(e) => handlePaidChange(e.target.value)}
            maxLength={10} // 7 int + dot + 2 dec
            aria-invalid={!!paidAmountError}
            aria-describedby={
              paidAmountError ? "pt-cdf-paid-error" : undefined
            }
          />
        </label>

        {paidAmountError && (
          <p id="pt-cdf-paid-error" className="pt-cdf-error" role="alert">
            {paidAmountError}
          </p>
        )}
      </div>

      {totalAmount > 0 && !paidAmountError && (
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