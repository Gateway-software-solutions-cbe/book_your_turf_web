// src/router/user.routes.tsx
import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import ProtectedRoute from "../components/user/ProtectedRoute";
import UserLayout from "../components/user/layout/UserLayout";

// ─── Lazy pages ──────────────────────────────────────────────────────────
// const UserLoginPage = lazy(() => import('../pages/user/auth/Login'));
// const UserRegisterPage = lazy(() => import('../pages/user/auth/Register'));
const UserVerifyOtpPage = lazy(() => import("../pages/user/auth/VerifyOtp"));
const UserForgotPasswordPage = lazy(
  () => import("../pages/user/auth/ForgotPassword"),
);
const UserResetPasswordPage = lazy(
  () => import("../pages/user/auth/ResetPassword"),
);
const TurfsPage = lazy(() => import("../pages/user/TurfsPage"));
const TurfDetailPage = lazy(() => import("../pages/user/TurfDetailPage"));
const DashboardPage = lazy(() => import("../pages/user/DashboardPage"));
const BookingPage = lazy(() => import("../pages/user/BookingPage"));
const BookingsPage = lazy(() => import("../pages/user/BookingsListPage"));
const PhoneAuthPage = lazy(() => import("../pages/user/auth/PhoneAuth"));
const PaymentSummary = lazy(() => import("../pages/user/PaymentSummary"));
const CompleteProfilePage = lazy(
  () => import("../pages/user/auth/CompleteProfile"),
);
const BookingSuccess = lazy(() => import("../pages/user/BookingSuccess"));
const RazorpayPayment = lazy(() => import("../pages/user/RazorpayPayment"));
const RazorpayBalancePayment = lazy(
  () => import("../pages/user/RazorpayBalancePayment"),
);
const ProfilePage = lazy(() => import("../pages/user/ProfilePage"));
const WalletPage = lazy(() => import("../pages/user/WalletPage"));
const WalletTransactionsPage = lazy(
  () => import("../pages/user/WalletTransactionsPage"),
);
const RazorpayWalletRecharge = lazy(
  () => import("../pages/user/RazorpayWalletRecharge"),
);
const CoinHistoryPage = lazy(() => import('../pages/user/CoinHistoryPage'));
const ManageDevicesPage = lazy(() => import('../pages/user/ManageDevicesPage'));
const FavoritesPage = lazy(()=> import('../pages/user/FavoritesPage'));
const NotificationsPage = lazy(() => import('../pages/user/NotificationsPage'));

export const userRoutes: RouteObject[] = [
  // ─── Public Auth Routes (requireAuth = false) ──────────────────────
  // If user is already authenticated, they'll be redirected to /turfs
  {
    element: <ProtectedRoute requireAuth={false} redirectTo="/turfs" />,
    children: [
      { path: "/phone-auth", element: <PhoneAuthPage /> },
      // { path: '/login', element: <UserLoginPage /> },
      // { path: '/register', element: <UserRegisterPage /> },
      { path: "/verify-otp", element: <UserVerifyOtpPage /> },
      { path: "/forgot-password", element: <UserForgotPasswordPage /> },
      { path: "/reset-password", element: <UserResetPasswordPage /> },
    ],
  },

  // ─── Protected Routes (requireAuth = true) ─────────────────────────
  {
    element: <ProtectedRoute requireAuth={true} redirectTo="/login" />,
    children: [
      {
        element: <UserLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/turfs", element: <TurfsPage /> },
          { path: "/turfs/:id", element: <TurfDetailPage /> },
          { path: "/booking/:id", element: <BookingPage /> },
          { path: "/bookings", element: <BookingsPage /> },
          { path: "/payment-summary", element: <PaymentSummary /> },
          { path: "/complete-profile", element: <CompleteProfilePage /> },
          { path: "/booking-success", element: <BookingSuccess /> },
          { path: "/razorpay-payment", element: <RazorpayPayment /> },
          { path: "/razorpay-balance", element: <RazorpayBalancePayment /> },
          { path: "/profile", element: <ProfilePage /> },
          { path: "/wallet", element: <WalletPage /> },
          { path: "/wallet/transactions", element: <WalletTransactionsPage /> },
          { path: "/razorpay-wallet-recharge", element: <RazorpayWalletRecharge />},
          { path: '/coins/history', element: <CoinHistoryPage /> },
          { path: '/devices', element: <ManageDevicesPage /> },
          { path: '/favorites', element: <FavoritesPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
        ],
      },
    ],
  },
];
