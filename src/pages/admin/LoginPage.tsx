import React, { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { LoginRequest } from '../../types/auth';

// ─── LoginPage ─────────────────────────────────────────────────────────────────

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState<LoginRequest>({ login_id: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Already logged in — redirect to where they came from or admin home
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/admin';
  if (!isLoading && isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.login_id.trim() || !form.password.trim()) {
      setError('Email/phone and password are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string; detail?: string } } })
          ?.response?.data?.message
          ?? (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          ?? 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* ─── Import Animation Libraries ────────────────────────────────────── */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" 
      />
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/hover.css/2.3.1/css/hover-min.css" 
      />
      <link 
        rel="stylesheet" 
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" 
      />

      <div className="min-vh-100 d-flex align-items-center justify-content-center position-relative overflow-hidden bg-light">
        
        {/* ─── Background Decorative Elements ────────────────────────────────── */}
        <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ pointerEvents: 'none' }}>
          <div className="position-absolute rounded-circle bg-success bg-opacity-10" 
               style={{ top: '-10%', right: '-5%', width: '400px', height: '400px' }}></div>
          <div className="position-absolute rounded-circle bg-success bg-opacity-10" 
               style={{ bottom: '-10%', left: '-5%', width: '300px', height: '300px' }}></div>
          <div className="position-absolute rounded-circle bg-success bg-opacity-10" 
               style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px' }}></div>
        </div>

        {/* ─── Login Card ──────────────────────────────────────────────────────── */}
        <div className="card shadow-lg border-0 w-100 animate__animated animate__fadeInUp" 
             style={{ 
               maxWidth: '440px', 
               borderRadius: '24px',
               position: 'relative',
               zIndex: 1,
               backgroundColor: 'rgba(255, 255, 255, 0.98)',
               boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), 0 4px 20px rgba(0, 0, 0, 0.05)',
             }}>
          
          <div className="card-body p-4 p-md-5">
            {/* ── Logo / Icon ────────────────────────────────────────────────── */}
            <div className="text-center mb-4">
              <div className="position-relative d-inline-block">
                <div className="bg-success bg-opacity-10 rounded-4 p-3 d-inline-block mb-2 hvr-grow">
                  <div className="bg-success rounded-circle d-flex align-items-center justify-content-center"
                       style={{ width: '64px', height: '64px' }}>
                    <i className="bi bi-building fs-1 text-white"></i>
                  </div>
                </div>
              </div>
              <h1 className="h3 fw-bold mt-2 mb-1 text-dark">Turf Admin</h1>
              <p className="text-secondary mb-0 small">Sign in to your admin account</p>
            </div>

            {/* ── Form ────────────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Email/Phone Field */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small" htmlFor="login_id">
                  <i className="bi bi-envelope me-1 text-success"></i>Email or Phone
                </label>
                <div className="position-relative">
                  <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                    <i className="bi bi-person"></i>
                  </div>
                  <input
                    id="login_id"
                    name="login_id"
                    type="text"
                    autoComplete="username"
                    className={`form-control form-control-lg ps-5 rounded-3 ${error ? 'is-invalid' : ''}`}
                    placeholder="you@example.com or 9876543210"
                    value={form.login_id}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    style={{ 
                      borderColor: error ? '#dc3545' : '#e2e8f0',
                      background: 'white',
                      fontSize: '0.95rem'
                    }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small" htmlFor="password">
                  <i className="bi bi-lock me-1 text-success"></i>Password
                </label>
                <div className="position-relative">
                  <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary">
                    <i className="bi bi-shield-lock"></i>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`form-control form-control-lg ps-5 pe-5 rounded-3 ${error ? 'is-invalid' : ''}`}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    style={{ 
                      borderColor: error ? '#dc3545' : '#e2e8f0',
                      background: 'white',
                      fontSize: '0.95rem'
                    }}
                  />
                  <button
                    type="button"
                    className="position-absolute top-50 end-0 translate-middle-y btn btn-link text-secondary p-0 border-0"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{ 
                      textDecoration: 'none', 
                      fontSize: '1.2rem',
                      zIndex: 2,
                      background: 'transparent',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
                {error && (
                  <div className="text-danger small mt-1">
                    <i className="bi bi-exclamation-circle me-1"></i>
                    {error}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-success w-100 py-3 rounded-3 fw-semibold shadow-sm position-relative hvr-grow"
                disabled={isSubmitting}
                style={{ 
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #198754 0%, #157347 100%)',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(25, 135, 84, 0.2)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign in
                  </>
                )}
              </button>
            </form>

            {/* ── Footer Links ────────────────────────────────────────────────── */}
            <div className="d-flex justify-content-between align-items-center mt-4 pt-2 border-top">
              <span className="small text-secondary">
                <i className="bi bi-shield-check me-1 text-success"></i>
                Secure login
              </span>
              <a href="/admin/forgot-password" className="text-success small text-decoration-none fw-semibold hvr-underline-from-left">
                <i className="bi bi-question-circle me-1"></i>
                Forgot password?
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Inline Bootstrap Override Styles (Required for animations) ──────── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .form-control:focus {
          border-color: #198754 !important;
          box-shadow: 0 0 0 4px rgba(25, 135, 84, 0.1) !important;
        }
        
        .form-control.is-invalid:focus {
          border-color: #dc3545 !important;
          box-shadow: 0 0 0 4px rgba(220, 53, 69, 0.1) !important;
        }
        
        .form-control {
          transition: border-color 0.3s ease, box-shadow 0.3s ease !important;
        }
        
        .form-control:hover {
          border-color: #198754 !important;
        }
        
        .form-control.is-invalid:hover {
          border-color: #dc3545 !important;
        }
        
        .btn-success:active {
          transform: scale(0.98) !important;
        }
        
        /* Hover.css - Underline From Left */
        .hvr-underline-from-left {
          display: inline-block;
          vertical-align: middle;
          -webkit-transform: perspective(1px) translateZ(0);
          transform: perspective(1px) translateZ(0);
          box-shadow: 0 0 1px rgba(0, 0, 0, 0);
          position: relative;
          overflow: hidden;
        }
        .hvr-underline-from-left:before {
          content: "";
          position: absolute;
          z-index: -1;
          left: 0;
          right: 100%;
          bottom: 0;
          background: #198754;
          height: 2px;
          -webkit-transition-property: right;
          transition-property: right;
          -webkit-transition-duration: 0.3s;
          transition-duration: 0.3s;
          -webkit-transition-timing-function: ease-out;
          transition-timing-function: ease-out;
        }
        .hvr-underline-from-left:hover:before, .hvr-underline-from-left:focus:before, .hvr-underline-from-left:active:before {
          right: 0;
        }
        
        /* Hover.css - Grow */
        .hvr-grow {
          display: inline-block;
          vertical-align: middle;
          -webkit-transform: perspective(1px) translateZ(0);
          transform: perspective(1px) translateZ(0);
          box-shadow: 0 0 1px rgba(0, 0, 0, 0);
          -webkit-transition-duration: 0.3s;
          transition-duration: 0.3s;
          -webkit-transition-property: transform;
          transition-property: transform;
        }
        .hvr-grow:hover, .hvr-grow:focus, .hvr-grow:active {
          -webkit-transform: scale(1.1);
          transform: scale(1.1);
        }
        
        /* Animate.css - ShakeX override */
        .animate__shakeX {
          animation-name: shakeX;
          animation-duration: 0.5s;
        }
        
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}} />
    </>
  );
};

export default LoginPage;