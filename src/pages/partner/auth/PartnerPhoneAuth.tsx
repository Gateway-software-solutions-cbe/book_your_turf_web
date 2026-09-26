
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { partnerAuthApi } from "../../../api/partner/auth";
import "./style/PartnerPhoneAuth.css";

const PartnerPhoneAuth: React.FC = () => {
  const navigate = useNavigate();

  const [number, setNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{10}$/.test(number)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    try {
      const res = await partnerAuthApi.phoneSendOtp({ number });
      const data = res.data;

      navigate("/partner/phone-verify", {
        state: {
          number: data.number,
          is_registered: data.is_registered,
        },
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-phone-page">
      {/* Decorative sports background */}
      <div className="pt-phone-atmosphere" aria-hidden="true">
        <div className="pt-phone-orb pt-phone-orb-one" />
        <div className="pt-phone-orb pt-phone-orb-two" />
        <div className="pt-phone-field-lines" />
        <div className="pt-phone-field-circle" />
      </div>

      {/* Back navigation */}
      <button
        type="button"
        className="pt-phone-back"
        onClick={() => navigate("/partner/auth")}
        aria-label="Go back to partner authentication"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m15 18-6-6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Back</span>
      </button>

      <div className="pt-phone-layout">
        {/* Left branding section */}
        <section className="pt-phone-brand">
          {/* <div className="pt-phone-brand-top">
            <span className="pt-phone-live-dot" />
            <span>BOOK YOUR GAME. OWN YOUR ARENA.</span>
          </div> */}

          <div className="pt-phone-brand-logo">
            <img
              src="/src/asset/cp.jpeg"
              alt="BookYourTurf logo"
            />
          </div>

          <div className="pt-phone-brand-copy">
            <span className="pt-phone-eyebrow">
              <span className="pt-phone-eyebrow-line" />
              PARTNER REGISTRATION
            </span>

            <h1>
              Your next
              <br />
              game starts
              <br />
              <span>with you.</span>
            </h1>

            <p>
              Get started with BookYourTurf. Verify your mobile
              number and take the first step towards managing
              your turf business.
            </p>
          </div>

          <div className="pt-phone-benefits">
            <div className="pt-phone-benefit">
              <span className="pt-phone-benefit-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect
                    x="6"
                    y="3"
                    width="12"
                    height="18"
                    rx="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M9 7h6M9 17h6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <span>
                <strong>Quick verification</strong>
                <small>Verify your number securely using OTP.</small>
              </span>
            </div>

            <div className="pt-phone-benefit">
              <span className="pt-phone-benefit-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 3 4.5 6v5.5c0 4.6 3.2 7.7 7.5 9.5
                    4.3-1.8 7.5-4.9 7.5-9.5V6L12 3Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m9 12 2 2 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <span>
                <strong>Secure onboarding</strong>
                <small>A dedicated platform for turf partners.</small>
              </span>
            </div>
          </div>

          <div className="pt-phone-brand-bottom">
            <span />
            <small>PLAY MORE. GROW MORE.</small>
          </div>
        </section>

        {/* Registration form */}
        <section className="pt-phone-form-section">
          <div className="pt-phone-card">
            <div className="pt-phone-mobile-logo">
              <img
                src="/src/asset/cp.jpeg"
                alt="BookYourTurf logo"
              />
            </div>

            <div className="pt-phone-heading">
              <span className="pt-phone-kicker">
                <span className="pt-phone-status-dot" />
                NEW PARTNER REGISTRATION
              </span>

              <h2>Enter your details</h2>

              <p>
                Let's get you on the field. Enter your mobile
                number and we'll send you an OTP to verify it.
              </p>
            </div>

            {/* Registration progress */}
            <div className="pt-phone-progress">
              <div className="pt-phone-progress-step active">
                <span className="pt-phone-step-number">01</span>
                <span className="pt-phone-step-copy">
                  <strong>Mobile number</strong>
                  <small>Current step</small>
                </span>
              </div>

              <span className="pt-phone-progress-line" />

              <div className="pt-phone-progress-step">
                <span className="pt-phone-step-number">02</span>
                <span className="pt-phone-step-copy">
                  <strong>Verify OTP</strong>
                  <small>Next step</small>
                </span>
              </div>
            </div>

            <form
              className="pt-phone-form"
              onSubmit={handleSendOtp}
            >
              <label
                htmlFor="partner-mobile"
                className="pt-phone-label"
              >
                Mobile number
              </label>

              <div
                className={`pt-phone-input-wrap ${
                  error ? "has-error" : ""
                }`}
              >
                <span className="pt-phone-country-code">+91</span>

                <span className="pt-phone-input-divider" />

                <input
                  id="partner-mobile"
                  className="pt-phone-input"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  value={number}
                  onChange={(e) => {
                    setNumber(
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    );
                    if (error) setError("");
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={
                    error ? "partner-mobile-error" : "partner-mobile-hint"
                  }
                  required
                />
              </div>

              <div className="pt-phone-input-meta">
                <span id="partner-mobile-hint">
                  Enter your active mobile number
                </span>
                <span className="pt-phone-counter">
                  {number.length}/10
                </span>
              </div>

              {error && (
                <div
                  id="partner-mobile-error"
                  className="pt-phone-error"
                  role="alert"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M12 8v5m0 3h.01"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="pt-phone-submit"
                disabled={loading || number.length !== 10}
              >
                <span>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </span>

                {loading ? (
                  <span className="pt-phone-spinner" aria-hidden="true" />
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M5 12h14m-6-6 6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </form>

            <div className="pt-phone-security">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="11"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M8 10V7a4 4 0 0 1 8 0v3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="15" r="1.3" fill="currentColor" />
              </svg>

              <span>
                Your number is used for account verification
                and secure access.
              </span>
            </div>

            <p className="pt-phone-signin">
              Already have an account?{" "}
              <Link to="/partner/login">Sign in</Link>
            </p>

            <footer className="pt-phone-footer">
              <span>OWNED BY</span>
              <strong>Nottam Infotech Private Limited</strong>
              <small>
                © {new Date().getFullYear()} BookYourTurf. All rights reserved.
              </small>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PartnerPhoneAuth;