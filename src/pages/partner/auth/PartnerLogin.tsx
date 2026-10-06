import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePartnerAuth } from '../../../context/PartnerAuthContext';
import {
  metaPartnerLoginStarted,
  metaPartnerLoginSuccess,
} from "../../../lib/metaPixel";
import './style/PartnerLogin.css'; // reuse styles if compatible

const PartnerLogin: React.FC = () => {
  const { login } = usePartnerAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const loginStartedFiredRef = useRef(false);

  useEffect(() => {
    if (loginStartedFiredRef.current) return;
    loginStartedFiredRef.current = true;
    metaPartnerLoginStarted({ method: 'email' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(loginId, password);

      // Read from auth context after login (context updates synchronously
      // for `setSession`, but the state setter is async; the partner will
      // be available on the next tick, so this reads from localStorage).
      let partnerId = loginId;
      try {
        const raw = localStorage.getItem('partner_profile');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.id) partnerId = parsed.id;
        }
      } catch { /* silent */ }

      metaPartnerLoginSuccess({ partner_id: partnerId });
      navigate("/partner/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-auth-container pt-login-container">
      <button
        className="pt-back-arrow"
        onClick={() => navigate("/partner/auth")}
        aria-label="Back"
      >
        ‹
      </button>

      <div className="pt-login-shell">
        <div className="pt-login-header">
          <h1 className="pt-login-title">Welcome back</h1>
          <p className="pt-login-subtitle">Sign in to continue</p>
        </div>

        <div className="pt-login-card">
          {error && <div className="pt-auth-error">{error}</div>}

          <form className="pt-login-form" onSubmit={handleSubmit}>
            <label className="pt-login-label">Email Or Number</label>
            <input
              className="pt-input"
              type="text"
              placeholder="Enter your Mail or Number"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />

            <label className="pt-login-label">Password</label>
            <div className="pt-input-wrap">
              <input
                className="pt-input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
                            <button
                type="button"
                className="pt-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  // Eye with slash — "currently visible, click to hide"
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  // Plain eye — "currently hidden, click to show"
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="pt-login-row">
              <label className="pt-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link to="/partner/forgot-password" className="pt-forgot-link">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="pt-btn-primary"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="pt-or-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="pt-btn-outline-otp"
              onClick={() => navigate("/partner/phone-auth")}
            >
              <span className="pt-otp-icon-inline">💬</span>
              Sign in with OTP
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartnerLogin;