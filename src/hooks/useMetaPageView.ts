/**
 * src/hooks/useMetaPageView.ts
 * ─────────────────────────────
 * Fires a Meta PageView on every React Router navigation.
 * The base PageView in index.html only fires once on the first load.
 * Since BYT is a Single-Page App (SPA), you need to call fbq('track','PageView')
 * again on every route change — otherwise Meta only sees one page visit
 * per session, not the real journey through the funnel.
 *
 * HOW TO USE:
 *   Add ONE line to src/router/index.tsx inside the <AppRoutes> component:
 *
 *     import { useMetaPageView } from '../hooks/useMetaPageView';
 *     const AppRoutes: React.FC = () => {
 *       useMetaPageView();          // ← add this line
 *       return useRoutes(allRoutes);
 *     };
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { metaPageView } from '../lib/metaPixel';

// Maps URL path → human readable page name shown in Meta Events Manager
const PAGE_NAMES: Record<string, string> = {
  // ── Landing & Auth ────────────────────────────────────────────────
  '/':                      'Landing',
  '/login':                 'User Login',
  '/verify-otp':            'User OTP Verify',
  '/register':              'User Register',
  '/forgot-password':       'User Forgot Password',
  '/reset-password':        'User Reset Password',
  '/complete-profile':      'User Complete Profile',

  // ── User / Player journey ─────────────────────────────────────────
  '/turfs':                 'Turf List (Home)',
  '/bookings':              'My Bookings',
  '/favorites':             'Favorite Turfs',
  '/wallet':                'Wallet',
  '/wallet/transactions':   'Wallet Transactions',
  '/coins':                 'Coin History',
  '/profile':               'User Profile',
  '/notifications':         'Notifications',
  '/devices':               'Manage Devices',
  '/payment-summary':       'Payment Summary',
  '/booking-success':       'Booking Success',

  // ── Partner journey ───────────────────────────────────────────────
  '/partner/auth':          'Partner Login',
  '/partner/dashboard':     'Partner Dashboard',
  '/partner/venues':        'Partner Venues',
  '/partner/slots':         'Partner Slot Management',
  '/partner/bookings':      'Partner Bookings',
  '/partner/profile':       'Partner Profile',
  '/partner/analytics':     'Partner Analytics',
  '/partner/staff':         'Partner Staff',
  '/partner/expenses':      'Partner Expenses',
  '/partner/settings':      'Partner Settings',
  '/partner/settings/edit-profile':      'Partner Edit Profile',
  '/partner/settings/customer-care':     'Partner Customer Care',
  '/partner/settings/account-preferences': 'Partner Account Preferences',
};

function getPageName(pathname: string): string {
  if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname];
  // Dynamic routes like /turfs/42 or /partner/venues/7/edit
  if (/^\/turfs\/\d+\/book/.test(pathname))     return 'Booking Page';
  if (/^\/turfs\/\d+/.test(pathname))            return 'Turf Detail';
  if (/^\/partner\/venues\/\d+/.test(pathname))  return 'Partner Venue Detail';
  if (/^\/partner\/bookings\/\d+/.test(pathname)) return 'Partner Booking Detail';
  if (/^\/bookings\/\d+/.test(pathname))         return 'User Booking Detail';
  return pathname; // fallback — shows raw path in Meta dashboard
}

export function useMetaPageView() {
  const location = useLocation();

  useEffect(() => {
    const pageName = getPageName(location.pathname);
    metaPageView(pageName);

    // Optional: log to console in development so you can verify events
    if (import.meta.env.DEV) {
      console.log(`[Meta Pixel] PageView → ${pageName} (${location.pathname})`);
    }
  }, [location.pathname]);
}