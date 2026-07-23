// src/pages/user/auth/Register.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { registerSchema, type RegisterFormValues } from '../../../validations/auth.schema';
import { sendOtp } from '../../../api/userAuth';
import { useApiState } from '../../../hooks/useApiState';
import type { VerificationMethod } from '../../../types/userAuth';

const Register = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<VerificationMethod>('email');
  const { run: sendOtpRun, loading, error } = useApiState(sendOtp);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { verification_method: 'email' } as RegisterFormValues,
  });

  const onMethodChange = (value: VerificationMethod) => {
    setMethod(value);
    reset({ verification_method: value } as RegisterFormValues);
  };

  const onSubmit = async (values: RegisterFormValues) => {
    await sendOtpRun(values);
    const identifier = values.verification_method === 'email' ? values.email : values.number;
    navigate('/verify-otp', {
      state: { identifier, verification_method: values.verification_method, flow: 'register' },
    });
  };

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h2 className="mb-4 text-center">Create Account</h2>

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

        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input className="form-control" {...register('name')} />
          {errors.name && <div className="text-danger small">{errors.name.message}</div>}
        </div>

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

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input type="password" className="form-control" {...register('password')} />
          {errors.password && <div className="text-danger small">{errors.password.message}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Referral Code (optional)</label>
          <input className="form-control" {...register('referral_code')} />
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </form>
    </div>
  );
};

export default Register;
