// src/router/user.routes.tsx
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import ProtectedRoute from '../components/user/ProtectedRoute';
import UserLayout from '../components/user/layout/UserLayout';

// ─── Lazy pages ──────────────────────────────────────────────────────────
const UserLoginPage = lazy(() => import('../pages/user/auth/Login'));
const UserRegisterPage = lazy(() => import('../pages/user/auth/Register'));
const UserVerifyOtpPage = lazy(() => import('../pages/user/auth/VerifyOtp'));
const UserForgotPasswordPage = lazy(() => import('../pages/user/auth/ForgotPassword'));
const UserResetPasswordPage = lazy(() => import('../pages/user/auth/ResetPassword'));
const TurfsPage = lazy(() => import('../pages/user/TurfsPage'));
const TurfDetailPage = lazy(() => import('../pages/user/TurfDetailPage'));
const DashboardPage = lazy(() => import('../pages/user/DashboardPage'));
const BookingsPage = lazy(() => import('../pages/user/BookingPage'));
// const WalletPage = lazy(() => import('../pages/user/WalletPage'));
// const ProfilePage = lazy(() => import('../pages/user/ProfilePage'));

export const userRoutes: RouteObject[] = [
  // ─── Public Auth Routes (requireAuth = false) ──────────────────────
  // If user is already authenticated, they'll be redirected to /turfs
  {
    element: <ProtectedRoute requireAuth={false} redirectTo="/turfs" />,
    children: [
      { path: '/login', element: <UserLoginPage /> },
      { path: '/register', element: <UserRegisterPage /> },
      { path: '/verify-otp', element: <UserVerifyOtpPage /> },
      { path: '/forgot-password', element: <UserForgotPasswordPage /> },
      { path: '/reset-password', element: <UserResetPasswordPage /> },
    ],
  },
  
  // ─── Protected Routes (requireAuth = true) ─────────────────────────
  {
    element: <ProtectedRoute requireAuth={true} redirectTo="/login" />,
    children: [
      {
        element: <UserLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/turfs', element: <TurfsPage /> },
          { path: '/turfs/:id', element: <TurfDetailPage /> },
          { path: '/booking/:id', element: <BookingsPage /> },
          // { path: '/wallet', element: <WalletPage /> },
          // { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
];