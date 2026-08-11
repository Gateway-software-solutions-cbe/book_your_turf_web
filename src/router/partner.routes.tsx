// src/router/partner.routes.tsx
// import { lazy } from 'react';
// import { RouteObject } from 'react-router-dom';
// import PartnerProtectedRoute from '../components/partner/ProtectedRoute';
// import PartnerLayout from '../components/partner/layout/PartnerLayout';

// ─── Lazy pages ──────────────────────────────────────────────────────────
// const PartnerLoginPage = lazy(() => import('../pages/partner/auth/Login'));
// const PartnerDashboardPage = lazy(() => import('../pages/partner/DashboardPage'));
// const PartnerTurfsPage = lazy(() => import('../pages/partner/TurfsPage'));
// const PartnerTurfFormPage = lazy(() => import('../pages/partner/TurfFormPage'));
// const PartnerBookingsPage = lazy(() => import('../pages/partner/BookingsPage'));
// const PartnerBookingDetailPage = lazy(() => import('../pages/partner/BookingDetailPage'));
// const PartnerProfilePage = lazy(() => import('../pages/partner/ProfilePage'));
// const PartnerSettingsPage = lazy(() => import('../pages/partner/SettingsPage'));

// ─── Partner Routes ────────────────────────────────────────────────────
// export const partnerRoutes: RouteObject[] = [
  // Public
//   { path: '/partner/login', element: <PartnerLoginPage /> },
  
  // Protected
//   {
//     element: <PartnerProtectedRoute />,
//     children: [
//       {
//         element: <PartnerLayout />,
//         children: [
//           { path: '/partner', element: <PartnerDashboardPage /> },
//           { path: '/partner/turfs', element: <PartnerTurfsPage /> },
//           { path: '/partner/turfs/new', element: <PartnerTurfFormPage /> },
//           { path: '/partner/turfs/:id/edit', element: <PartnerTurfFormPage /> },
//           { path: '/partner/bookings', element: <PartnerBookingsPage /> },
//           { path: '/partner/bookings/:id', element: <PartnerBookingDetailPage /> },
//           { path: '/partner/profile', element: <PartnerProfilePage /> },
//           { path: '/partner/settings', element: <PartnerSettingsPage /> },
//         ],
//       },
//     ],
//   },
// ];