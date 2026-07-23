// src/pages/user/auth/Login.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormValues } from '../../../validations/auth.schema';
import { login } from '../../../api/userAuth';
import { useApiState } from '../../../hooks/useApiState';
import { useUserAuth } from '../../../context/UserAuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginSuccess } = useUserAuth();

  const justRegistered = (location.state as { registered?: boolean })?.registered;
  const passwordReset = (location.state as { passwordReset?: boolean })?.passwordReset;

  const { run: loginRun, loading, error } = useApiState(login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    const response = await loginRun(values);
    loginSuccess(response.data.data!); // data is guaranteed present on success
    navigate('/dashboard'); // adjust to your actual post-login route
  };

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <h2 className="mb-4 text-center">Login</h2>

      {justRegistered && (
        <div className="alert alert-success">Account created! Please log in.</div>
      )}
      {passwordReset && (
        <div className="alert alert-success">Password reset successful! Please log in.</div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <label className="form-label">Email or Mobile Number</label>
          <input className="form-control" {...register('login_id')} />
          {errors.login_id && <div className="text-danger small">{errors.login_id.message}</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input type="password" className="form-control" {...register('password')} />
          {errors.password && <div className="text-danger small">{errors.password.message}</div>}
        </div>

        <button type="submit" className="btn btn-primary w-100 mb-2" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="text-center">
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>
        <div className="text-center mt-2">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
