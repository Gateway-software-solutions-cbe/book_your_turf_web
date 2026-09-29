import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { partnerAuthApi } from "../../../api/partner/auth";
import { usePartnerAuth } from "../../../context/PartnerAuthContext";
import "./PartnerRemoveAccountPage.css";

type Step = "reason" | "understand" | "confirm";

const REASONS = [
  "Poor customer support",
  "High commission rates",
  "Technical issues with the app",
  "Low business volume",
  "Switching to another platform",
  "Temporary closure of business",
  "Business permanently closed",
  "Other",
];

const CONFIRM_PHRASE = "DEACTIVATE MY ACCOUNT";

const PartnerRemoveAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = usePartnerAuth();

  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const finalReason = reason === "Other" ? otherReason.trim() : reason;

  // ─── Step navigation ────────────────────────────────────
  const goBack = () => {
    if (step === "reason") navigate(-1);
    else if (step === "understand") setStep("reason");
    else setStep("understand");
  };

  const goNext = () => {
    setError("");
    if (step === "reason") {
      if (!reason) return setError("Please select a reason to continue.");
      if (reason === "Other" && !otherReason.trim())
        return setError("Please describe your reason.");
      setStep("understand");
      return;
    }
    if (step === "understand") {
      if (!understood)
        return setError("Please confirm you understand the consequences.");
      setStep("confirm");
      return;
    }
    if (step === "confirm") {
      if (confirmText !== CONFIRM_PHRASE)
        return setError(`Type exactly: ${CONFIRM_PHRASE}`);
      handleDeactivate();
    }
  };

  const handleDeactivate = async () => {
    setSubmitting(true);
    try {
      await partnerAuthApi.deactivateAccount(finalReason);
      setSuccessMsg("Your account has been deactivated.");
      // give the user a moment to read the success state
      setTimeout(() => {
        logout();
        navigate("/partner/auth");
      }, 2000);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to deactivate account.",
      );
      setSubmitting(false);
    }
  };

  // ─── Progress bar ───────────────────────────────────────
  const progressWidth =
    step === "reason" ? "33%" : step === "understand" ? "66%" : "100%";

  // ─── Success screen ─────────────────────────────────────
  if (successMsg) {
    return (
      <div className="pt-ra-page">
        <div className="pt-ra-success">
          <div className="pt-ra-success-icon">✓</div>
          <h2>Account Deactivated</h2>
          <p>
            Your account has been deactivated and your turfs are now hidden.
            You will be redirected to the login page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-ra-page">
      <header className="pt-ra-header">
        <button
          className="pt-ra-back"
          onClick={goBack}
          aria-label="Back"
        >
          ‹
        </button>
        <h1>Remove Account</h1>
      </header>

      {/* Progress bar */}
      <div className="pt-ra-progress">
        <div className="pt-ra-progress-track">
          <div
            className="pt-ra-progress-fill"
            style={{ width: progressWidth }}
          />
        </div>
        <div className="pt-ra-steps">
          <span className={`pt-ra-step ${step === "reason" ? "pt-active" : ""}`}>
            REASON
          </span>
          <span
            className={`pt-ra-step ${
              step === "understand" ? "pt-active" : ""
            }`}
          >
            UNDERSTAND
          </span>
          <span
            className={`pt-ra-step ${step === "confirm" ? "pt-active" : ""}`}
          >
            CONFIRM
          </span>
        </div>
      </div>

      {error && <div className="pt-auth-error">{error}</div>}

      {/* ─── STEP 1: REASON ─────────────────────────────── */}
      {step === "reason" && (
        <>
          <div className="pt-ra-banner">
            <span className="pt-ra-banner-icon">⚠️</span>
            <span>Please tell us why you're leaving</span>
          </div>

          <h3 className="pt-ra-section-title">Reason for Removal</h3>

          <div className="pt-ra-reasons">
            {REASONS.map((r) => (
              <label key={r} className="pt-ra-reason">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          {reason === "Other" && (
            <div className="pt-ra-other">
              <label className="pt-ra-label">Please specify</label>
              <textarea
                className="pt-ra-textarea"
                placeholder="Tell us more about your reason..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                rows={3}
                maxLength={300}
              />
            </div>
          )}
        </>
      )}

      {/* ─── STEP 2: UNDERSTAND ─────────────────────────── */}
      {step === "understand" && (
        <>
          <div className="pt-ra-warning-card">
            <div className="pt-ra-warning-icon">⚠️</div>
            <h3 className="pt-ra-warning-title">IRREVERSIBLE ACTION</h3>
            <p className="pt-ra-warning-sub">
              Removing your account will result in:
            </p>
            <ul className="pt-ra-consequences">
              <li>
                <span className="pt-ra-x">✕</span>
                Account becomes permanently inactive
              </li>
              <li>
                <span className="pt-ra-emoji">🏟</span>
                All turfs become hidden from users
              </li>
              <li>
                <span className="pt-ra-emoji">📅</span>
                No new bookings can be made
              </li>
              <li>
                <span className="pt-ra-emoji">🚫</span>
                You will lose access to your account
              </li>
              <li>
                <span className="pt-ra-emoji">💰</span>
                Pending payments may be affected
              </li>
              <li>
                <span className="pt-ra-emoji">📊</span>
                All your data will be archived
              </li>
            </ul>
            <div className="pt-ra-warning-note">
              To reactivate, you MUST contact support
            </div>
          </div>

          <label className="pt-ra-ack">
            <input
              type="checkbox"
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
            />
            <span>
              I understand that this action is irreversible and I will lose
              access to my account
            </span>
          </label>
        </>
      )}

      {/* ─── STEP 3: CONFIRM ────────────────────────────── */}
      {step === "confirm" && (
        <>
          <div className="pt-ra-final-banner">
            <div className="pt-ra-final-icon">🛡</div>
            <h3 className="pt-ra-final-title">Final Confirmation Required</h3>
            <p className="pt-ra-final-sub">
              Type "{CONFIRM_PHRASE}" to confirm
            </p>
          </div>

          <div className="pt-ra-confirm-input">
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter confirmation text here"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <p className="pt-ra-confirm-hint">
            ⚠️ Type exactly: <strong>{CONFIRM_PHRASE}</strong>
          </p>

          <div className="pt-ra-summary">
            <h4 className="pt-ra-summary-title">📋 Removal Summary</h4>
            <p>
              <span>· Reason:</span> {finalReason || "—"}
            </p>
            <p>
              <span>· Consequences understood:</span>{" "}
              {understood ? "Yes" : "No"}
            </p>
            <p>
              <span>· Final confirmation:</span>{" "}
              {confirmText === CONFIRM_PHRASE ? "Ready" : "Pending"}
            </p>
          </div>
        </>
      )}

      {/* ─── Actions ────────────────────────────────────── */}
      <div className="pt-ra-actions">
        <button
          className="pt-ra-btn pt-ra-btn-back"
          onClick={goBack}
          disabled={submitting}
        >
          {step === "reason" ? "Cancel" : "Back"}
        </button>
        <button
          className="pt-ra-btn pt-ra-btn-next"
          onClick={goNext}
          disabled={
            submitting ||
            (step === "reason" && !reason) ||
            (step === "understand" && !understood) ||
            (step === "confirm" && confirmText !== CONFIRM_PHRASE)
          }
        >
          {submitting
            ? "Deactivating..."
            : step === "confirm"
              ? "DEACTIVATE NOW"
              : "Continue"}
        </button>
      </div>
    </div>
  );
};

export default PartnerRemoveAccountPage;