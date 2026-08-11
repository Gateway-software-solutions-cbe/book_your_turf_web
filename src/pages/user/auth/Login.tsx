// src/pages/user/auth/Login.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormValues } from '../../../validations/auth.schema';
import { login } from '../../../api/user/userAuth';
import { useApiState } from '../../../hooks/useApiState';
import { useUserAuth } from '../../../context/UserAuthContext';
import './auth.css';

// ─── Sub-components ─────────────────────────────────────────────────────

// Background Scene
const BackgroundScene = () => (
  <div className="login-bg">
    <div className="stadium-lights">
      <div className="light left" />
      <div className="light right" />
      <div className="light center" />
    </div>
    <div className="goalpost left" />
    <div className="goalpost right" />
    <div className="field-lines" />
    <div className="turf-texture" />
    <div className="field-circle" />
  </div>
);

// Logo Section
const LogoSection = () => (
  <div className="text-center mb-3">
    <div className="logo-icon">
      <i className="bi bi-trophy-fill" />
    </div>
    <h1 className="login-title">BookYourTurf</h1>
    <p className="login-subtitle">Book your turf in seconds</p>
  </div>
);

// Alert Messages
const AlertMessages = ({ 
  justRegistered, 
  passwordReset, 
  error 
}: { 
  justRegistered?: boolean; 
  passwordReset?: boolean; 
  error?: string | null;
}) => (
  <>
    {justRegistered && (
      <div className="alert alert-success">
        <i className="bi bi-check-circle-fill me-1" />
        Account created! Please log in.
      </div>
    )}
    {passwordReset && (
      <div className="alert alert-success">
        <i className="bi bi-check-circle-fill me-1" />
        Password reset successful! Please log in.
      </div>
    )}
    {error && (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle-fill me-1" />
        {error}
      </div>
    )}
  </>
);

// Floating Input Field
const FloatingInput = ({ 
  label, 
  icon, 
  register, 
  error, 
  type = 'text',
  placeholder,
  ...props 
}: {
  label: string;
  icon: string;
  register: any;
  error?: any;
  type?: string;
  placeholder: string;
  [key: string]: any;
}) => (
  <div className="form-floating mb-3">
    <input
      type={type}
      className={`form-control ${error ? 'is-invalid' : ''}`}
      {...register}
      placeholder={placeholder}
      {...props}
    />
    <label>
      <i className={`bi bi-${icon} me-2`} />
      {label}
    </label>
    {error && <div className="invalid-feedback">{error.message}</div>}
  </div>
);

// ─── Login Form ────────────────────────────────────────────────────────

const LoginForm = ({ 
  onSubmit, 
  register, 
  errors, 
  loading, 
  onForgotClick 
}: {
  onSubmit: (e: React.FormEvent) => void;
  register: any;
  errors: any;
  loading: boolean;
  onForgotClick: () => void;
}) => (
  <form onSubmit={onSubmit} noValidate className="fade-in">
    <FloatingInput
      label="Email or Mobile Number"
      icon="envelope-at"
      register={register('login_id')}
      error={errors.login_id}
      placeholder="Email or Mobile Number"
    />

    <FloatingInput
      label="Password"
      icon="lock"
      type="password"
      register={register('password')}
      error={errors.password}
      placeholder="Password"
    />

    <div className="d-flex justify-content-end mb-3">
      <button type="button" className="forgot-link" onClick={onForgotClick}>
        Forgot Password?
      </button>
    </div>

    <button type="submit" className="btn btn-primary w-100 login-btn" disabled={loading}>
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" />
          Signing in...
        </>
      ) : (
        <>
          <i className="bi bi-arrow-right-circle me-2" />
          Sign In
        </>
      )}
    </button>

    <div className="text-center mt-3 switch-text">
      <span>Don't have an account? </span>
      <Link to="/register" className="switch-link">
        Register
      </Link>
    </div>
  </form>
);

// ─── Success Screen ─────────────────────────────────────────────────────

const SuccessScreen = ({ message }: { message: string }) => (
  <div className="success-container">
    <div className="success-content">
      <div className="success-icon-wrapper">
        <div className="success-circle">
          <i className="bi bi-check-lg" />
        </div>
      </div>
      <div className="success-text">
        <h3>{message}</h3>
        <p>Redirecting...</p>
      </div>
    </div>
  </div>
);

// ─── Footer ────────────────────────────────────────────────────────────

const Footer = () => (
  <div className="login-footer">
    <p>
      <i className="bi bi-shield-check me-1" />
      Secure &nbsp;·&nbsp; <i className="bi bi-clock me-1" /> 24/7 Booking
    </p>
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginSuccess, isAuthenticated } = useUserAuth();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ─── Redirect if already authenticated ──────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/turfs', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const justRegistered = (location.state as { registered?: boolean })?.registered;
  const passwordReset = (location.state as { passwordReset?: boolean })?.passwordReset;

  const { run: loginRun, loading, error } = useApiState(login);

  // Login Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  // ─── Handlers ──────────────────────────────────────────────────────────

  const handleLoginSubmit = async (values: LoginFormValues) => {
    try {
      const response = await loginRun(values);
      loginSuccess(response.data.data!);
      setSuccessMessage('Welcome Back!');
      setShowSuccess(true);
      setTimeout(() => navigate('/turfs', { replace: true }), 2000);
    } catch {
      // Error handled by useApiState
    }
  };

  const handleForgotClick = () => navigate('/forgot-password');

  return (
    <div className="login-container">
      <BackgroundScene />

      <div className="login-card-wrapper">
        <div className="login-card glass-card">
          <LogoSection />

          {showSuccess ? (
            <SuccessScreen message={successMessage} />
          ) : (
            <>
              <AlertMessages 
                justRegistered={justRegistered}
                passwordReset={passwordReset}
                error={error}
              />

              <LoginForm
                onSubmit={handleSubmit(handleLoginSubmit)}
                register={register}
                errors={errors}
                loading={loading}
                onForgotClick={handleForgotClick}
              />
            </>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Login;