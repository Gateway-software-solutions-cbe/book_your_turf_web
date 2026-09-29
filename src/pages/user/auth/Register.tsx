// src/pages/user/auth/Register.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterFormValues } from '../../../validations/auth.schema';
import { sendRegistrationOtp } from '../../../api/user/userAuth';
import { useApiState } from '../../../hooks/useApiState';
import type { VerificationMethod } from '../../../types/user/userAuth';
import './auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<VerificationMethod>('email');
  const { run: sendOtpRun, loading, error } = useApiState(sendRegistrationOtp);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      number: '',
      password: '',
      referral_code: '',
      verification_method: 'email',
    },
  });

  const onMethodChange = (value: VerificationMethod) => {
    setMethod(value);
    setValue('verification_method', value);
    // Reset only the fields that might have validation issues
    reset({
      name: '',
      email: '',
      number: '',
      password: '',
      referral_code: '',
      verification_method: value,
    });
  };

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      // Build payload - send BOTH email and number (API requires both)
      const payload: any = {
        name: values.name,
        email: values.email,
        number: values.number,
        password: values.password,
        verification_method: values.verification_method,
      };

      // Add referral code if provided
      if (values.referral_code && values.referral_code.trim() !== '') {
        payload.referral_code = values.referral_code;
      }

      console.log('📤 Sending registration payload:', payload);
      
      await sendOtpRun(payload);
      
      // Store the identifier for OTP verification
      const identifier = values.verification_method === 'email' 
        ? values.email 
        : values.number;
      
      navigate('/verify-otp', {
        state: { 
          identifier: identifier,
          verification_method: values.verification_method,
          flow: 'register' 
        },
      });
    } catch (err: any) {
      console.error('❌ Registration error:', err);
    }
  };

  return (
    <div className="login-container">
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

      <div className="login-card-wrapper">
        <div className="login-card glass-card">
          <div className="text-center mb-3">
            <div className="logo-icon">
              <i className="bi bi-person-plus-fill" />
            </div>
            <h1 className="login-title">Create Account</h1>
            <p className="login-subtitle">Join BookYourTurf today</p>
          </div>

          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle-fill me-1" />
              {error}
            </div>
          )}

          <div className="method-toggle">
            <button
              type="button"
              className={`method-btn ${method === 'email' ? 'active' : ''}`}
              onClick={() => onMethodChange('email')}
            >
              <i className="bi bi-envelope" /> Email
            </button>
            <button
              type="button"
              className={`method-btn ${method === 'phone' ? 'active' : ''}`}
              onClick={() => onMethodChange('phone')}
            >
              <i className="bi bi-phone" /> Phone
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <input type="hidden" {...register('verification_method')} />

            <div className="form-floating mb-3">
              <input
                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                {...register('name')}
                placeholder="Full Name"
              />
              <label>
                <i className="bi bi-person me-2" />
                Full Name
              </label>
              {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
            </div>

            {/* Email field - always required */}
            <div className="form-floating mb-3">
              <input
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                {...register('email')}
                placeholder="Email"
              />
              <label>
                <i className="bi bi-envelope me-2" />
                Email Address
              </label>
              {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
            </div>

            {/* Phone field - always required */}
            <div className="form-floating mb-3">
              <input
                type="tel"
                className={`form-control ${errors.number ? 'is-invalid' : ''}`}
                {...register('number')}
                placeholder="Mobile Number"
              />
              <label>
                <i className="bi bi-phone me-2" />
                Mobile Number
              </label>
              {errors.number && <div className="invalid-feedback">{errors.number.message}</div>}
            </div>

            <div className="form-floating mb-3">
              <input
                type="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                {...register('password')}
                placeholder="Password"
              />
              <label>
                <i className="bi bi-lock me-2" />
                Password
              </label>
              {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
            </div>

            <div className="form-floating mb-3">
              <input
                className="form-control"
                {...register('referral_code')}
                placeholder="Referral Code (optional)"
              />
              <label>
                <i className="bi bi-gift me-2" />
                Referral Code (optional)
              </label>
            </div>

            <button type="submit" className="btn btn-success w-100 login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2" />
                  Send OTP
                </>
              )}
            </button>

            <div className="text-center mt-3 switch-text">
              <span>Already have an account? </span>
              <Link to="/login" className="switch-link">
                Sign In
              </Link>
            </div>
          </form>
        </div>

        <div className="login-footer">
          <p>
            <i className="bi bi-shield-check me-1" />
            Secure &nbsp;·&nbsp; <i className="bi bi-clock me-1" /> 24/7 Booking
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;