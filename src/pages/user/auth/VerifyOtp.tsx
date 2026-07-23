// src/pages/user/auth/VerifyOtp.tsx
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { otpSchema, type OtpFormValues } from '../../../validations/auth.schema';
import { verifyRegister, resendOtp } from '../../../api/userAuth';
import { useApiState } from '../../../hooks/useApiState';
import { buildIdentifierPayload } from '../../../utils/identifierPayload';
import type { VerificationMethod } from '../../../types/userAuth';

const RESEND_COOLDOWN_SECONDS = 30; // no cooldown specified by backend — 30s default

interface LocationState {
  identifier: string;
  verification_method: VerificationMethod;
  flow: 'register' | 'forgot-password';
}

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  const { run: verifyRun, loading: verifying, error: verifyError } = useApiState(verifyRegister);
  const { run: resendRun, loading: resending, error: resendError } = useApiState(resendOtp);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema) });

  useEffect(() => {
    if (!state?.identifier) navigate('/register', { replace: true });
  }, [state, navigate]);

  useEffect(() => {
    if (cooldown === 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!state?.identifier) return null;

  const onSubmit = async (values: OtpFormValues) => {
    const payload = buildIdentifierPayload(state.verification_method, state.identifier, {
      otp: values.otp,
    });
    await verifyRun(payload);
    navigate('/login', { state: { registered: true } });
  };

  const handleResend = async () => {
    const payload = buildIdentifierPayload(state.verification_method, state.identifier, {});
    await resendRun(payload);
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h2 className="mb-3 text-center">Verify OTP</h2>
      <p className="text-center text-muted">
        Enter the OTP sent to <strong>{state.identifier}</strong>
      </p>

      {verifyError && <div className="alert alert-danger">{verifyError}</div>}
      {resendError && <div className="alert alert-danger">{resendError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <input
            className="form-control text-center"
            maxLength={6}
            placeholder="Enter OTP"
            {...register('otp')}
          />
          {errors.otp && <div className="text-danger small">{errors.otp.message}</div>}
        </div>

        <button type="submit" className="btn btn-primary w-100 mb-3" disabled={verifying}>
          {verifying ? 'Verifying...' : 'Verify & Continue'}
        </button>
      </form>

      <div className="text-center">
        {cooldown > 0 ? (
          <span className="text-muted">Resend OTP in {cooldown}s</span>
        ) : (
          <button className="btn btn-link p-0" onClick={handleResend} disabled={resending}>
            {resending ? 'Resending...' : 'Resend OTP'}
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyOtp;
