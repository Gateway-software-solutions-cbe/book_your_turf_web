// src/pages/user/auth/ForgotPassword.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../../../validations/auth.schema';
import { forgotPasswordOtp } from '../../../api/userAuth';
import { useApiState } from '../../../hooks/useApiState';
import type { VerificationMethod } from '../../../types/userAuth';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<VerificationMethod>('email');
  const { run, loading, error } = useApiState(forgotPasswordOtp);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { verification_method: 'email' } as ForgotPasswordFormValues,
  });

  const onMethodChange = (value: VerificationMethod) => {
    setMethod(value);
    reset({ verification_method: value } as ForgotPasswordFormValues);
  };

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    await run(values);
    const identifier = values.verification_method === 'email' ? values.email : values.number;
    navigate('/reset-password', {
      state: { identifier, verification_method: values.verification_method },
    });
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h2 className="mb-3 text-center">Forgot Password</h2>
      <p className="text-center text-muted">
        Enter your registered email or mobile number to receive an OTP.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="btn-group w-100 mb-3" role="group">
        <button
          type="button"
          className={`btn ${method === 'email' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => onMethodChange('email')}
        >
          Email
        </button>
        <button
          type="button"
          className={`btn ${method === 'phone' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => onMethodChange('phone')}
        >
          Mobile
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <input type="hidden" value={method} {...register('verification_method')} />

        {method === 'email' ? (
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" {...register('email')} />
            {'email' in errors && (
              <div className="text-danger small">{(errors as any).email?.message}</div>
            )}
          </div>
        ) : (
          <div className="mb-3">
            <label className="form-label">Mobile Number</label>
            <input type="tel" className="form-control" {...register('number')} />
            {'number' in errors && (
              <div className="text-danger small">{(errors as any).number?.message}</div>
            )}
          </div>
        )}

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
