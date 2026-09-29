// src/router/partner.routes.tsx
import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import PartnerProtectedRoute from "../components/partner/ProtectedRoute";
import PartnerLayout from "../components/partner/layout/PartnerLayout";
import RequireCompleteProfile from "../components/partner/RequireCompleteProfile";

// ─── Lazy pages ──────────────────────────────────────────────────────────
const PartnerLoginPage = lazy(
  () => import("../pages/partner/auth/PartnerLogin"),
);
const PartnerRegisterPage = lazy(
  () => import("../pages/partner/auth/PartnerRegister"),
);
const PartnerVerifyOtpPage = lazy(
  () => import("../pages/partner/auth/PartnerVerifyOtp"),
);
const PartnerForgotPasswordPage = lazy(
  () => import("../pages/partner/auth/PartnerForgotPassword"),
);
const PartnerResetPasswordPage = lazy(
  () => import("../pages/partner/auth/PartnerResetPassword"),
);
const PartnerDashboardPage = lazy(
  () => import("../pages/partner/PartnerDashboardPage"),
);

const PartnerAuthLanding = lazy(
  () => import("../pages/partner/auth/PartnerAuthLanding"),
);
const PartnerPhoneAuth = lazy(
  () => import("../pages/partner/auth/PartnerPhoneAuth"),
);
const PartnerPhoneVerifyOtp = lazy(
  () => import("../pages/partner/auth/PartnerPhoneVerifyOtp"),
);
const PartnerVenuesPage = lazy(
  () => import("../pages/partner/venues/PartnerVenuesPage"),
);
const AddVenuePage = lazy(() => import("../pages/partner/venues/AddVenuePage"));
const PartnerVenueDetailPage = lazy(
  () => import("../pages/partner/venues/PartnerVenueDetailPage"),
);
const SlotManagementPage = lazy(
  () => import("../pages/partner/slots/SlotManagementPage"),
);
const BookingSummaryPage = lazy(
  () => import("../pages/partner/slots/BookingSummaryPage"),
);
const BookingsListPage = lazy(
  () => import("../pages/partner/slots/BookingsListPage"),
);
const PartnerProfilePage = lazy(
  () => import("../pages/partner/PartnerProfilePage"),
);
const PartnerAnalyticsPage = lazy(() => import("../pages/partner/management/PartnerAnalyticsPage"));
const PartnerStaffPage = lazy(() => import("../pages/partner/management/PartnerStaffPage"));
const PartnerExpensesPage = lazy(() => import("../pages/partner/management/PartnerExpensesPage"));
const PartnerEditProfilePage = lazy(() => import("../pages/partner/settings/PartnerEditProfilePage"));
const PartnerCustomerCarePage = lazy(
  () => import("../pages/partner/settings/PartnerCustomerCarePage"),
);
const PartnerAccountPreferencesPage = lazy(
  () => import("../pages/partner/settings/PartnerAccountPreferencesPage"),
);
const PartnerRemoveAccountPage = lazy(
  () => import("../pages/partner/settings/PartnerRemoveAccountPage"),
);
const PartnerDevicesPage = lazy(
  () => import("../pages/partner/PartnerDevicesPage"),
);
const PartnerNotificationsPage = lazy(
  () => import("../pages/partner/PartnerNotificationsPage"),
);

export const partnerRoutes: RouteObject[] = [
  // ─── Public Auth Routes ────────────────────────────────────────────
  {
    element: (
      <PartnerProtectedRoute
        requireAuth={false}
        redirectTo="/partner/dashboard"
      />
    ),
    children: [
      { path: "/partner/login", element: <PartnerLoginPage /> },
      { path: "/partner/register", element: <PartnerRegisterPage /> },
      { path: "/partner/verify-otp", element: <PartnerVerifyOtpPage /> },
      {
        path: "/partner/forgot-password",
        element: <PartnerForgotPasswordPage />,
      },
      {
        path: "/partner/reset-password",
        element: <PartnerResetPasswordPage />,
      },
      { path: "/partner/auth", element: <PartnerAuthLanding /> },
      { path: "/partner/phone-auth", element: <PartnerPhoneAuth /> },
      { path: "/partner/phone-verify", element: <PartnerPhoneVerifyOtp /> },
    ],
  },

  // ─── Protected Routes ──────────────────────────────────────────────
  {
    element: (
      <PartnerProtectedRoute requireAuth={true} redirectTo="/partner/login" />
    ),
    children: [
      {
        element: <PartnerLayout />,
        children: [
          // ─── Guest-browsable ────────────────────────────────
          { path: "/partner/dashboard", element: <PartnerDashboardPage /> },
          { path: "/partner/venues", element: <PartnerVenuesPage /> },

          // ─── WRITE routes — declared FIRST ──────────────────
          // Static "/new" must be evaluated before the dynamic "/:id"
          // at the same nesting level so React Router picks the exact
          // match instead of treating "new" as an :id param.
          {
            element: <RequireCompleteProfile />,
            children: [
              { path: "/partner/venues/new", element: <AddVenuePage /> },
              { path: "/partner/venues/:id/edit", element: <AddVenuePage /> },
              // Slot-Management
              { path: "/partner/slots", element: <SlotManagementPage /> },
              {
                path: "/partner/slots/summary",
                element: <BookingSummaryPage />,
              },
              { path: "/partner/bookings", element: <BookingsListPage /> },
              { path: "/partner/profile", element: <PartnerProfilePage /> },
              { path: "/partner/analytics", element: <PartnerAnalyticsPage /> },
              { path: "/partner/staff", element: <PartnerStaffPage /> },
              { path: "/partner/expenses", element: <PartnerExpensesPage /> },

              // // Settings subpages
              { path: "/partner/settings/edit-profile", element: <PartnerEditProfilePage /> },
              {
                path: "/partner/settings/customer-care",
                element: <PartnerCustomerCarePage />,
              },
              {
                path: "/partner/settings/account-preferences",
                element: <PartnerAccountPreferencesPage />,
              },
              { path: "/partner/settings/remove-account", element: <PartnerRemoveAccountPage /> },
              { path: "/partner/devices", element: <PartnerDevicesPage /> },
              { path: "/partner/notifications", element: <PartnerNotificationsPage /> },
            ],
          },

          // ─── READ-only detail route — declared LAST ─────────
          { path: "/partner/venues/:id", element: <PartnerVenueDetailPage /> },
        ],
      },
    ],
  },
];
