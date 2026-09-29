/**
 * src/hooks/useMetaPageView.ts
 * ─────────────────────────────
 * Fires a Meta PageView on every React Router navigation.
 *
 * Why the guards:
 *  - index.html fires the base PageView once on initial load. We must NOT
 *    double-count it, so we skip the very first effect run.
 *  - React 18 StrictMode double-invokes effects in dev. Without a ref guard,
 *    every route change logs PageView twice with different event IDs.
 *  - Suspense + lazy-loaded routes can remount the entire tree, wiping
 *    component-level refs. A module-level timestamp guard survives that.
 *  - Partner routes carry partner context (not user context), so they
 *    route through a partner-specific PageView helper.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  metaPageView,
  metaPageViewPartner,
  metaDeeplinkLanded,
} from '../lib/metaPixel';

// Module-level guard — survives component remounts from Suspense/lazy load.
// Cleared only when the actual navigation target changes.
let lastFiredPath: string | null = null;
let lastFiredAt = 0;

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
  '/phone-auth':            'User Phone Auth',

  // ── User / Player journey ─────────────────────────────────────────
  '/turfs':                 'Turf List (Home)',
  '/bookings':              'My Bookings',
  '/favorites':             'Favorite Turfs',
  '/wallet':                'Wallet',
  '/wallet/transactions':   'Wallet Transactions',
  '/coins':                 'Coin History',
  '/coins/history':         'Coin History',
  '/profile':               'User Profile',
  '/notifications':         'Notifications',
  '/devices':               'Manage Devices',
  '/payment-summary':       'Payment Summary',
  '/booking-success':       'Booking Success',
  '/razorpay-payment':      'Razorpay Payment',
  '/razorpay-balance':      'Razorpay Balance Payment',
  '/razorpay-wallet-recharge': 'Razorpay Wallet Recharge',

  // ── Partner journey ───────────────────────────────────────────────
  '/partner/auth':          'Partner Login',
  '/partner/login':         'Partner Login',
  '/partner/phone-auth':    'Partner Phone Auth',
  '/partner/phone-verify':  'Partner Phone Verify',
  '/partner/dashboard':     'Partner Dashboard',
  '/partner/venues':        'Partner Venues',
  '/partner/slots':         'Partner Slot Management',
  '/partner/bookings':      'Partner Bookings',
  '/partner/profile':       'Partner Profile',
  '/partner/analytics':     'Partner Analytics',
  '/partner/staff':         'Partner Staff',
  '/partner/expenses':      'Partner Expenses',
  '/partner/devices':       'Partner Devices',
  '/partner/notifications': 'Partner Notifications',
  '/partner/settings':      'Partner Settings',
  '/partner/settings/edit-profile':         'Partner Edit Profile',
  '/partner/settings/customer-care':        'Partner Customer Care',
  '/partner/settings/account-preferences':  'Partner Account Preferences',
};

function getPageName(pathname: string): string {
  if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname];

  // Dynamic routes
  if (/^\/turfs\/\d+\/book/.test(pathname))             return 'Booking Page';
  if (/^\/booking\/\d+/.test(pathname))                  return 'Booking Page';
  if (/^\/turfs\/\d+/.test(pathname))                    return 'Turf Detail';
  if (/^\/partner\/venues\/\d+\/edit/.test(pathname))    return 'Partner Venue Edit';
  if (/^\/partner\/venues\/\d+/.test(pathname))          return 'Partner Venue Detail';
  if (/^\/partner\/slots\/summary/.test(pathname))       return 'Partner Booking Summary';
  if (/^\/partner\/bookings\/\d+/.test(pathname))        return 'Partner Booking Detail';
  if (/^\/bookings\/\d+/.test(pathname))                 return 'User Booking Detail';

  return pathname;
}

export function useMetaPageView() {
  const location = useLocation();
  const isFirstMountRef = useRef(true);

  useEffect(() => {
    // The base pixel in index.html already fired PageView once on the
    // very first page load of the session. Skip the first effect run
    // only for the initial mount — subsequent navigations fire normally.
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      lastFiredPath = location.pathname;
      lastFiredAt = Date.now();
      return;
    }

    const now = Date.now();

    // Same-path + same-500ms-window guard. Module-level state survives
    // StrictMode remounts AND Suspense-driven remounts. The 500ms window
    // is far shorter than any legitimate navigation.
    if (
      lastFiredPath === location.pathname &&
      now - lastFiredAt < 500
    ) {
      return;
    }

    lastFiredPath = location.pathname;
    lastFiredAt = now;

    const pageName = getPageName(location.pathname);
    const isPartnerRoute = location.pathname.startsWith('/partner');

    if (isPartnerRoute) {
      metaPageViewPartner(pageName);
    } else {
      metaPageView(pageName);
    }

    if (import.meta.env.DEV) {
      console.log(
        `[Meta Pixel] PageView (${isPartnerRoute ? 'partner' : 'user'}) → ${pageName} (${location.pathname})`,
      );
    }

    // Deeplink landing detection is user-side only
    if (!isPartnerRoute) {
      metaDeeplinkLanded();
    }
  }, [location.pathname]);
}