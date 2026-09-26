
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { partnerAuthApi } from "../../../api/partner/auth";
import { usePartnerAuth } from "../../../context/PartnerAuthContext";
import "./style/PartnerPhoneVerifyOtp.css";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const PartnerPhoneVerifyOtp: React.FC = () => {
  const navigate = useNavigate();

  const { state } = useLocation() as {
    state?: {
      number: string;
      is_registered: boolean;
    };
  };

  const number = state?.number || "";
  const isRegistered = state?.is_registered ?? false;

  const { setSession } = usePartnerAuth();

  const [otp, setOtp] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Redirect if the user opens this page without a phone number.
  useEffect(() => {
    if (!number) {
      navigate("/partner/phone-auth", { replace: true });
    }
  }, [number, navigate]);

  // Resend countdown.
  useEffect(() => {
    if (seconds <= 0) return;

    const timer = window.setTimeout(() => {
      setSeconds((previous) => previous - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [seconds]);

  // Update a single OTP digit.
  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const updatedOtp = [...otp];
    updatedOtp[index] = digit;

    setOtp(updatedOtp);
    setError("");

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Handle keyboard navigation.
  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputsRef.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (
      event.key === "ArrowRight" &&
      index < OTP_LENGTH - 1
    ) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  // Support pasting the complete OTP.
  const handlePaste = (
    event: React.ClipboardEvent<HTMLInputElement>
  ) => {
    event.preventDefault();

    const pastedCode = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pastedCode) return;

    const digits = Array(OTP_LENGTH).fill("");

    pastedCode.split("").forEach((digit, index) => {
      digits[index] = digit;
    });

    setOtp(digits);
    setError("");

    const nextIndex = Math.min(
      pastedCode.length,
      OTP_LENGTH - 1
    );

    inputsRef.current[nextIndex]?.focus();
  };

  // Verify OTP and establish the partner session.
  const handleVerify = async () => {
    const code = otp.join("");

    if (code.length !== OTP_LENGTH) {
      setError("Please enter the complete 6-digit OTP.");

      const firstEmptyIndex = otp.findIndex(
        (digit) => !digit
      );

      inputsRef.current[
        firstEmptyIndex === -1 ? 0 : firstEmptyIndex
      ]?.focus();

      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await partnerAuthApi.phoneVerifyOtp({
        number,
        otp: code,
      });

      const { access, partner } = res.data;

      await setSession(access, partner);

      navigate("/partner/dashboard", {
        replace: true,
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Invalid OTP. Please check the code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Request a new OTP.
  const handleResend = async () => {
    if (seconds > 0 || resending) return;

    setError("");
    setResending(true);

    try {
      await partnerAuthApi.phoneSendOtp({ number });

      setOtp(Array(OTP_LENGTH).fill(""));
      setSeconds(RESEND_SECONDS);

      inputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to resend OTP. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== "");

  const formatTime = (value: number) => {
    const minutes = Math.floor(value / 60);
    const remainingSeconds = value % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  return (
    <main className="pvo-page">
      {/* Decorative sports background */}
      <div className="pvo-bg-orb pvo-bg-orb-one" />
      <div className="pvo-bg-orb pvo-bg-orb-two" />

      <button
        type="button"
        className="pvo-back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        <span aria-hidden="true">←</span>
        <span>Back</span>
      </button>

      <div className="pvo-layout">
        {/* Left introduction panel */}
        <section className="pvo-intro">
          {/* <div className="pvo-eyebrow">
            <span className="pvo-status-dot" />
            BOOK YOUR GAME. OWN YOUR ARENA.
          </div> */}

          <div className="pvo-brand">
            {/* Update this URL if your logo is stored elsewhere. */}
            <img
              src="/src/asset/cp.jpeg"
              alt="BookYourTurf"
              className="pvo-logo"
            />
          </div>

          <div className="pvo-section-label">
            <span />
            PARTNER VERIFICATION
          </div>

          <h1>
            One step
            <br />
            closer to
            <br />
            <span>game time.</span>
          </h1>

          <p className="pvo-intro-description">
            Verify your mobile number and get ready to manage
            your turf business with BookYourTurf.
          </p>

          <div className="pvo-benefits">
            <div className="pvo-benefit">
              <div className="pvo-benefit-icon">
                <span aria-hidden="true">✓</span>
              </div>

              <div>
                <h3>Quick verification</h3>
                <p>Securely verify your number using OTP.</p>
              </div>
            </div>

            <div className="pvo-benefit">
              <div className="pvo-benefit-icon">
                <span aria-hidden="true">⚡</span>
              </div>

              <div>
                <h3>Get match-ready</h3>
                <p>Continue towards your partner dashboard.</p>
              </div>
            </div>
          </div>

          <div className="pvo-tagline">
            <span />
            PLAY MORE. GROW MORE.
          </div>
        </section>

        {/* OTP verification card */}
        <section className="pvo-card">
          <div className="pvo-card-top-line" />

          <div className="pvo-card-content">
            <div className="pvo-heading-icon" aria-hidden="true">
              <span>✉</span>
            </div>

            <div className="pvo-card-eyebrow">
              <span className="pvo-status-dot" />
              SECURE ACCOUNT VERIFICATION
            </div>

            <h2>Verify OTP</h2>

            <p className="pvo-card-description">
              Enter the 6-digit verification code sent to
              your mobile number.
            </p>

            <div className="pvo-number-display">
              <span className="pvo-phone-icon" aria-hidden="true">
                ☎
              </span>

              <span>{number}</span>

              <button
                type="button"
                className="pvo-edit-number"
                onClick={() => navigate(-1)}
              >
                Change
              </button>
            </div>

            {/* OTP input fields */}
            <div className="pvo-otp-section">
              <label className="pvo-field-label">
                Enter verification code
              </label>

              <div
                className="pvo-otp-inputs"
                role="group"
                aria-label="Six-digit verification code"
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => {
                      inputsRef.current[index] = element;
                    }}
                    className={`pvo-otp-input ${
                      digit ? "pvo-otp-filled" : ""
                    }`}
                    type="text"
                    inputMode="numeric"
                    autoComplete={
                      index === 0 ? "one-time-code" : "off"
                    }
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    aria-label={`OTP digit ${index + 1}`}
                    onChange={(event) =>
                      handleChange(index, event.target.value)
                    }
                    onKeyDown={(event) =>
                      handleKeyDown(index, event)
                    }
                    onPaste={handlePaste}
                    disabled={loading}
                  />
                ))}
              </div>

              <div className="pvo-otp-helper">
                <span>
                  {isOtpComplete
                    ? "All 6 digits entered"
                    : `${otp.filter(Boolean).length} of 6 digits entered`}
                </span>

                <span className="pvo-otp-counter">
                  {otp.filter(Boolean).length}/6
                </span>
              </div>
            </div>

            {/* Resend OTP */}
            <div className="pvo-resend-row">
              {seconds > 0 ? (
                <p>
                  Didn't receive the code?
                  <span className="pvo-resend-countdown">
                    {" "}
                    Resend in {formatTime(seconds)}
                  </span>
                </p>
              ) : (
                <p>
                  Didn't receive the code?
                  <button
                    type="button"
                    className="pvo-resend-button"
                    onClick={handleResend}
                    disabled={resending || loading}
                  >
                    {resending ? "Sending..." : "Resend OTP"}
                  </button>
                </p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="pvo-error" role="alert">
                <span aria-hidden="true">!</span>
                {error}
              </div>
            )}

            {/* Verify button */}
            <button
              type="button"
              className="pvo-verify-button"
              onClick={handleVerify}
              disabled={loading || !isOtpComplete}
            >
              {loading ? (
                <>
                  <span className="pvo-spinner" />
                  Verifying...
                </>
              ) : (
                <>
                  {isRegistered
                    ? "Verify & Login"
                    : "Verify & Continue"}

                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>

            {/* Security note */}
            <div className="pvo-security-note">
              <div className="pvo-security-icon" aria-hidden="true">
                ✓
              </div>

              <p>
                Your mobile number is used for account
                verification and secure access.
              </p>
            </div>

            <div className="pvo-card-divider" />

            <footer className="pvo-card-footer">
              <span>OWNED BY</span>

              <strong> Nottam Infotech Private Limited </strong>

              <p>© 2026 BookYourTurf. All rights reserved.</p>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
};

export default PartnerPhoneVerifyOtp;