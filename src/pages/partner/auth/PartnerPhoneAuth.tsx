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
      // Store context for verify page
      navigate("/partner/phone-verify", {
        state: {
          number: data.number,
          is_registered: data.is_registered,
        },
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-auth-container pt-phone-container">
      <button
        className="pt-back-arrow"
        onClick={() => navigate("/partner/auth")}
        aria-label="Back"
      >
        ‹
      </button>

      <div className="pt-phone-card">
        <div className="pt-phone-icon">
          <span>📱</span>
        </div>

        <h2 className="pt-phone-title">Enter Your Details</h2>
        <p className="pt-phone-subtitle">
          We'll send an OTP to verify your number
        </p>

        {error && <div className="pt-auth-error">{error}</div>}

        <form className="pt-phone-form" onSubmit={handleSendOtp}>
          <div className="pt-phone-input-wrap">
            <span className="pt-phone-input-icon">📱</span>
            <input
              className="pt-phone-input"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Phone Number"
              value={number}
              onChange={(e) =>
                setNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              required
            />
          </div>

          <button
            type="submit"
            className="pt-phone-submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send OTP  →"}
          </button>
        </form>

        <p className="pt-auth-footer">
          Already have an account?{" "}
          <Link to="/partner/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default PartnerPhoneAuth;