import React, { useState } from "react";
import type {
  PartnerBooking,
  PaymentMethod,
} from "../../../../types/partner/slot";
import { PAYMENT_METHODS } from "../../../../api/partner/slots";
import "./PaymentCollectModal.css";

interface Props {
  booking: PartnerBooking;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (amount: string, method: PaymentMethod) => void;
}

const PaymentCollectModal: React.FC<Props> = ({
  booking,
  submitting,
  onCancel,
  onConfirm,
}) => {
  const [amount, setAmount] = useState<string>(booking.pending_amount);
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [methodOpen, setMethodOpen] = useState(false);

  const amt = Number(amount) || 0;
  const pending = Number(booking.pending_amount) || 0;
  const overpay = amt > pending;
  const valid = amt > 0 && !overpay;

  return (
    <div className="pt-pcm-overlay" onClick={() => !submitting && onCancel()}>
      <div className="pt-pcm-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="pt-pcm-title">Collect Payment</h2>

        {/* Breakdown */}
        <div className="pt-pcm-breakdown">
          <div className="pt-pcm-row">
            <span>Total Amount</span>
            <span className="pt-pcm-strong">₹{booking.total_amount}</span>
          </div>
          <div className="pt-pcm-row">
            <span>Already Paid</span>
            <span className="pt-pcm-paid">₹{booking.paid_amount}</span>
          </div>
          <div className="pt-pcm-row">
            <span>Balance Due</span>
            <span className="pt-pcm-balance">₹{booking.pending_amount}</span>
          </div>
        </div>

        {/* Amount input */}
        <div className="pt-pcm-field">
          <label className="pt-pcm-label">Amount to Collect</label>
          <div className="pt-pcm-input-wrap">
            <span className="pt-pcm-rupee">₹</span>
            <input
              type="number"
              min={0.01}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={submitting}
            />
          </div>
          {overpay && (
            <span className="pt-pcm-error">
              Amount cannot exceed the balance (₹{booking.pending_amount})
            </span>
          )}
        </div>

        {/* Payment method */}
        <div className="pt-pcm-field">
          <label className="pt-pcm-label">Payment Method</label>
          <button
            className="pt-pcm-select"
            onClick={() => !submitting && setMethodOpen((v) => !v)}
          >
            <span>{method}</span>
            <span className="pt-pcm-caret">▾</span>
          </button>
          {methodOpen && (
            <ul className="pt-pcm-menu">
              {PAYMENT_METHODS.map((m) => (
                <li key={m}>
                  <button
                    className={`pt-pcm-menu-item ${m === method ? "pt-active" : ""}`}
                    onClick={() => {
                      setMethod(m);
                      setMethodOpen(false);
                    }}
                  >
                    {m}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="pt-pcm-actions">
          <button
            className="pt-pcm-btn pt-pcm-btn-cancel"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="pt-pcm-btn pt-pcm-btn-confirm"
            onClick={() => valid && onConfirm(amt.toFixed(2), method)}
            disabled={!valid || submitting}
          >
            {submitting ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCollectModal;