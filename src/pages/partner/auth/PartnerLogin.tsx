import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { usePartnerAuth } from '../../../context/PartnerAuthContext';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(loginId, password);
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
                aria-label="Toggle password visibility"
              >
                {showPassword ? "🙈" : "🚫"}
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