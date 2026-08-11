// src/router/admin.routes.tsx
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import ProtectedRoute from '../components/admin/ProtectedRoute';
import AdminLayout from '../components/admin/layout/AdminLayout';

// ─── Lazy pages ──────────────────────────────────────────────────────────
const LoginPage = lazy(() => import('../pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage'));
const BookingsPage = lazy(() => import('../pages/admin/BookingsPage'));
const BookingDetailPage = lazy(() => import('../pages/admin/BookingDetailPage'));
const TransactionsPage = lazy(() => import('../pages/admin/TransactionsPage'));
const PartnersPage = lazy(() => import('../pages/admin/PartnersPage'));
const PartnerDetailPage = lazy(() => import('../pages/admin/PartnerDetailPage'));
const PartnerFormPage = lazy(() => import('../pages/admin/PartnerFormPage'));
const TurfsPage = lazy(() => import('../pages/admin/TurfsPage'));
const TurfDetailPage = lazy(() => import('../pages/admin/TurfDetailPage'));
const TurfFormPage = lazy(() => import('../pages/admin/TurfFormPage'));
const MockTurfsPage = lazy(() => import('../pages/admin/MockTurfsPage'));
const MockTurfFormPage = lazy(() => import('../pages/admin/MockTurfFormPage'));
const UsersPage = lazy(() => import('../pages/admin/UsersPage'));
const UserDetailPage = lazy(() => import('../pages/admin/UserDetailPage'));
const UserFormPage = lazy(() => import('../pages/admin/UserFormPage'));
const CountsSummaryPage = lazy(() => import('../pages/admin/CountsSummaryPage'));
const SettingsPage = lazy(() => import('../pages/admin/SettingsPage'));
const NotificationsPage = lazy(() => import('../pages/admin/NotificationsPage'));
const DiscountsPage = lazy(() => import('../pages/admin/DiscountsPage'));
const DiscountFormPage = lazy(() => import('../pages/admin/DiscountFormPage'));
const DiscountDetailPage = lazy(() => import('../pages/admin/DiscountDetailPage'));
const AppVersion = lazy(() => import('../pages/admin/AppVersion'));

// ─── Coming Soon Component ──────────────────────────────────────────────
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

// ─── Admin Routes ──────────────────────────────────────────────────────
export const adminRoutes: RouteObject[] = [
  // ─── Public Admin Auth Routes ──────────────────────────────────────
  // If admin is already authenticated, they'll be redirected to /admin
  {
    element: <ProtectedRoute requireAuth={false} redirectTo="/admin" />,
    children: [
      { path: '/admin/login', element: <LoginPage /> },
    ],
  },
  
  // ─── Protected Admin Routes ────────────────────────────────────────
  // If admin is not authenticated, they'll be redirected to /admin/login
  {
    element: <ProtectedRoute requireAuth={true} redirectTo="/admin/login" />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <DashboardPage /> },
          
          // Channel Partners
          { path: '/admin/partners', element: <PartnersPage /> },
          { path: '/admin/partners/new', element: <PartnerFormPage /> },
          { path: '/admin/partners/:id', element: <PartnerDetailPage /> },
          { path: '/admin/partners/:id/edit', element: <PartnerFormPage /> },
          
          // Turfs
          { path: '/admin/turfs', element: <TurfsPage /> },
          { path: '/admin/turfs/new', element: <TurfFormPage /> },
          { path: '/admin/turfs/:id', element: <TurfDetailPage /> },
          { path: '/admin/turfs/:id/edit', element: <TurfFormPage /> },
          
          // Mock Turfs
          { path: '/admin/mock-turfs', element: <MockTurfsPage /> },
          { path: '/admin/mock-turfs/new', element: <MockTurfFormPage /> },
          { path: '/admin/mock-turfs/:id/edit', element: <MockTurfFormPage /> },
          
          // Users
          { path: '/admin/users', element: <UsersPage /> },
          { path: '/admin/users/new', element: <UserFormPage /> },
          { path: '/admin/users/referrals', element: <ComingSoon title="User Referrals" /> },
          { path: '/admin/users/:id', element: <UserDetailPage /> },
          { path: '/admin/users/:id/edit', element: <UserFormPage /> },
          
          // Counts Summary
          { path: '/admin/counts-summary', element: <CountsSummaryPage /> },
          
          // Discounts
          { path: '/admin/discounts', element: <DiscountsPage /> },
          { path: '/admin/discounts/new', element: <DiscountFormPage /> },
          { path: '/admin/discounts/:id', element: <DiscountDetailPage /> },
          { path: '/admin/discounts/:id/edit', element: <DiscountFormPage /> },
          
          // Other
          { path: '/admin/bookings', element: <BookingsPage /> },
          { path: '/admin/bookings/:id', element: <BookingDetailPage /> },
          { path: '/admin/transactions', element: <TransactionsPage /> },
          { path: '/admin/analytics', element: <ComingSoon title="Analytics" /> },
          { path: '/admin/deleted-summary', element: <ComingSoon title="Deleted Summary" /> },
          { path: '/admin/reports', element: <ComingSoon title="Reports Export" /> },
          { path: '/admin/notifications', element: <NotificationsPage /> },
          { path: '/admin/appversion', element: <AppVersion /> },
          { path: '/admin/settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
];