// src/router/index.tsx

import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { UserAuthProvider } from "../context/UserAuthContext";
import ProtectedRoute from "../components/admin/ProtectedRoute";
import UserProtectedRoute from "../components/user/ProtectedRoute";
import AdminLayout from "../components/admin/layout/AdminLayout";

// ─── Lazy pages (admin) ─────────────────────────────────────────────────────
const LoginPage = lazy(() => import("../pages/admin/LoginPage"));
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
const BookingsPage       = lazy(() => import('../pages/admin/BookingsPage'));
const BookingDetailPage  = lazy(() => import('../pages/admin/BookingDetailPage'));
const TransactionsPage = lazy(() => import("../pages/admin/TransactionsPage"));
const PartnersPage = lazy(() => import("../pages/admin/PartnersPage"));
const PartnerDetailPage = lazy(() => import("../pages/admin/PartnerDetailPage"));
const PartnerFormPage = lazy(() => import("../pages/admin/PartnerFormPage"));

const TurfsPage = lazy(() => import("../pages/admin/TurfsPage"));
const TurfDetailPage = lazy(() => import("../pages/admin/TurfDetailPage"));
const TurfFormPage = lazy(() => import("../pages/admin/TurfFormPage"));
const MockTurfsPage = lazy(() => import("../pages/admin/MockTurfsPage"));
const MockTurfFormPage = lazy(() => import("../pages/admin/MockTurfFormPage"));
const UsersPage       = lazy(() => import('../pages/admin/UsersPage'));
const UserDetailPage  = lazy(() => import('../pages/admin/UserDetailPage'));
const UserFormPage    = lazy(() => import('../pages/admin/UserFormPage'));
const CountsSummaryPage = lazy(() => import('../pages/admin/CountsSummaryPage'));
const SettingsPage = lazy(() => import("../pages/admin/SettingsPage"));
const NotificationsPage = lazy(() => import("../pages/admin/NotificationsPage"));
const DiscountsPage = lazy(() => import("../pages/admin/DiscountsPage"));
const DiscountFormPage = lazy(() => import("../pages/admin/DiscountFormPage"));
const DiscountDetailPage = lazy(() => import("../pages/admin/DiscountDetailPage"));
const AppVersion = lazy(() => import("../pages/admin/AppVersion"));

// ─── Lazy pages (user) ──────────────────────────────────────────────────────
const UserRegisterPage = lazy(() => import("../pages/user/auth/Register"));
const UserVerifyOtpPage = lazy(() => import("../pages/user/auth/VerifyOtp"));
const UserLoginPage = lazy(() => import("../pages/user/auth/Login"));
const UserForgotPasswordPage = lazy(() => import("../pages/user/auth/ForgotPassword"));
const UserResetPasswordPage = lazy(() => import("../pages/user/auth/ResetPassword"));

const LandingPage = lazy(() => import("../pages/Landing"));

const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <div className="page">
    <div className="page__header">
      <h1 className="page__title">{title}</h1>
    </div>
    <div className="page__empty">
      <p>This module is coming soon.</p>
    </div>
  </div>
);

const PageLoader = () => (
  <div className="auth-loading">
    <div className="auth-loading__spinner" />
  </div>
);

// ─── Router ────────────────────────────────────────────────────────────────────
const AppRouter: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <UserAuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Admin — Public */}
            <Route path="/admin/login" element={<LoginPage />} />
            {/* Admin — Protected */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route
                  path="/admin"
                  element={<DashboardPage />}
                />

                {/* Channel Partners */}
                <Route path="/admin/partners" element={<PartnersPage />} />
                <Route
                  path="/admin/partners/new"
                  element={<PartnerFormPage />}
                />
                <Route
                  path="/admin/partners/:id"
                  element={<PartnerDetailPage />}
                />
                <Route
                  path="/admin/partners/:id/edit"
                  element={<PartnerFormPage />}
                />

                {/* Turfs */}
                <Route path="/admin/turfs" element={<TurfsPage />} />
                <Route path="/admin/turfs/new" element={<TurfFormPage />} />
                <Route path="/admin/turfs/:id" element={<TurfDetailPage />} />
                <Route
                  path="/admin/turfs/:id/edit"
                  element={<TurfFormPage />}
                />

                {/* Mock Turfs */}
                <Route path="/admin/mock-turfs" element={<MockTurfsPage />} />
                <Route
                  path="/admin/mock-turfs/new"
                  element={<MockTurfFormPage />}
                />
                <Route
                  path="/admin/mock-turfs/:id/edit"
                  element={<MockTurfFormPage />}
                />

                 {/* Users — static paths MUST come before /:id to avoid conflicts */}
              <Route path="/admin/users"                  element={<UsersPage />} />
              <Route path="/admin/users/new"              element={<UserFormPage />} />
              <Route path="/admin/users/referrals"        element={<ComingSoon title="User Referrals" />} />
              <Route path="/admin/users/:id"              element={<UserDetailPage />} />
              <Route path="/admin/users/:id/edit"         element={<UserFormPage />} />

               {/* Counts Summary */}
              <Route path="/admin/counts-summary"         element={<CountsSummaryPage />} />
                
                {/* Discounts */}
              <Route path="/admin/discounts" element={<DiscountsPage />} />
<Route path="/admin/discounts/new" element={<DiscountFormPage />} />
<Route path="/admin/discounts/:id" element={<DiscountDetailPage />} />
<Route path="/admin/discounts/:id/edit" element={<DiscountFormPage />} />

                {/* Other */}
                <Route path="/admin/bookings"               element={<BookingsPage />} />
              <Route path="/admin/bookings/:id"           element={<BookingDetailPage />} />
              <Route path="/admin/transactions" element={<TransactionsPage />} />
                <Route
                  path="/admin/analytics"
                  element={<ComingSoon title="Analytics" />}
                />
                <Route
                  path="/admin/deleted-summary"
                  element={<ComingSoon title="Deleted Summary" />}
                />
                <Route
                  path="/admin/counts-summary"
                  element={<ComingSoon title="Counts Summary" />}
                />
                <Route
                  path="/admin/reports"
                  element={<ComingSoon title="Reports Export" />}
                />
                <Route
                  path="/admin/notifications"
                  element={<NotificationsPage />}
                />
                <Route
                  path="/admin/appversion"
                  element={<AppVersion  />}
                />
                <Route path="/admin/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            {/* User — Public */}
            {/* Landing — role selector */}
            <Route path="/" element={<LandingPage />} />
            {/* User — Public */}
            <Route path="/register" element={<UserRegisterPage />} />
            ...
            {/* fallback: unmatched paths go to landing, not /admin */}
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/verify-otp" element={<UserVerifyOtpPage />} />
            <Route path="/login" element={<UserLoginPage />} />
            <Route
              path="/forgot-password"
              element={<UserForgotPasswordPage />}
            />
            <Route path="/reset-password" element={<UserResetPasswordPage />} />
            {/* User — Protected (add Bookings, Wallet, Profile, etc. here as they're built) */}
            <Route element={<UserProtectedRoute />}>
              {/* future user routes go here */}
            </Route>
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Suspense>
      </UserAuthProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default AppRouter;
