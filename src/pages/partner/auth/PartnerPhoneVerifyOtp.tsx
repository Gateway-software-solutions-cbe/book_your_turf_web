import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { partnerAuthApi } from "../../../api/partner/auth";
import { usePartnerAuth } from "../../../context/PartnerAuthContext";
import "./style/PartnerPhoneAuth.css";

const PartnerPhoneVerifyOtp: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state: { number: string; is_registered: boolean };
  };
  const number = state?.number || "";
  const isRegistered = state?.is_registered ?? false;

  // ⬇️ CHANGED: use setSession instead of updatePartner
  const { setSession } = usePartnerAuth();

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!number) navigate("/partner/phone-auth", { replace: true });
  }, [number, navigate]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputsRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
  const code = otp.join("");
  if (code.length !== 6) {
    setError("Enter the 6-digit code");
    return;
  }
  setError("");
  setLoading(true);
  try {
    const res = await partnerAuthApi.phoneVerifyOtp({ number, otp: code });
    const { access, partner } = res.data;

    // ⬇️ Now awaitable because setSession is async
    await setSession(access, partner);

    // Always go to dashboard — dashboard handles the guest flow
    navigate("/partner/dashboard", { replace: true });
  } catch (err: any) {
    setError(err?.response?.data?.message || "Invalid OTP");
  } finally {
    setLoading(false);
  }
};

  const handleResend = async () => {
    try {
      await partnerAuthApi.phoneSendOtp({ number });
      setSeconds(60);
      setOtp(Array(6).fill(""));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="pt-auth-container pt-phone-container">
      <button
        className="pt-back-arrow"
        onClick={() => navigate(-1)}
        aria-label="Back"
      >
        ‹
      </button>

      <div className="pt-phone-card pt-otp-card">
        <div className="pt-phone-icon pt-otp-icon">
          <span>💬</span>
        </div>

        <h2 className="pt-phone-title">Verify OTP</h2>
        <p className="pt-phone-subtitle">Enter the 6-digit code sent to</p>
        <p className="pt-otp-identifier">{number}</p>

        {error && <div className="pt-auth-error">{error}</div>}

        <div className="pt-otp-inputs">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputsRef.current[idx] = el)}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              maxLength={1}
              inputMode="numeric"
            />
          ))}
        </div>

        <p className="pt-otp-resend">
          {seconds > 0 ? (
            <>Resend code in {seconds} seconds</>
          ) : (
            <button className="pt-resend-btn" onClick={handleResend}>
              Resend OTP
            </button>
          )}
        </p>

        <button
          className="pt-phone-submit"
          onClick={handleVerify}
          disabled={loading}
        >
          {loading
            ? "Verifying..."
            : isRegistered
              ? "Verify & Login"
              : "Verify & Continue"}
        </button>

        <p className="pt-otp-note">Note: OTP is valid for 5 minutes</p>
      </div>
    </div>
  );
};

export default PartnerPhoneVerifyOtp;