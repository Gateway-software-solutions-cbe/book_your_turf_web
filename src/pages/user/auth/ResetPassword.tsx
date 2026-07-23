// src/pages/user/auth/ResetPassword.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../../../validations/auth.schema';
import { resetPassword } from '../../../api/userAuth';
import { useApiState } from '../../../hooks/useApiState';
import { buildIdentifierPayload } from '../../../utils/identifierPayload';
import type { VerificationMethod } from '../../../types/userAuth';

interface LocationState {
  identifier: string;
  verification_method: VerificationMethod;
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  const { run, loading, error } = useApiState(resetPassword);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  useEffect(() => {
    if (!state?.identifier) navigate('/forgot-password', { replace: true });
  }, [state, navigate]);

  if (!state?.identifier) return null;

  const onSubmit = async (values: ResetPasswordFormValues) => {
    const payload = buildIdentifierPayload(state.verification_method, state.identifier, {
      otp: values.otp,
      new_password: values.new_password,
    });
    await run(payload);
    navigate('/login', { state: { passwordReset: true } });
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h2 className="mb-3 text-center">Reset Password</h2>
      <p className="text-center text-muted">
        Enter the OTP sent to <strong>{state.identifier}</strong> and your new password.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <label className="form-label">OTP</label>
          <input
            className="form-control text-center"
            maxLength={6}
            placeholder="Enter OTP"
            {...register('otp')}
          />
          {errors.otp && <div className="text-danger small">{errors.otp.message}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">New Password</label>
          <input type="password" className="form-control" {...register('new_password')} />
          {errors.new_password && (
            <div className="text-danger small">{errors.new_password.message}</div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Confirm Password</label>
          <input type="password" className="form-control" {...register('confirm_password')} />
          {errors.confirm_password && (
            <div className="text-danger small">{errors.confirm_password.message}</div>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
