// src/router/types.ts
import { ReactNode } from 'react';

export interface RouteConfig {
  path: string;
  element: ReactNode;
  children?: RouteConfig[];
  index?: boolean;
}

export const ROUTES = {
  // Public
  HOME: '/',
  LANDING: '/',
  
  // Admin
  ADMIN: {
    LOGIN: '/admin/login',
    DASHBOARD: '/admin',
    BOOKINGS: '/admin/bookings',
    BOOKING_DETAIL: '/admin/bookings/:id',
    TRANSACTIONS: '/admin/transactions',
    PARTNERS: '/admin/partners',
    PARTNER_NEW: '/admin/partners/new',
    PARTNER_DETAIL: '/admin/partners/:id',
    PARTNER_EDIT: '/admin/partners/:id/edit',
    TURFS: '/admin/turfs',
    TURF_NEW: '/admin/turfs/new',
    TURF_DETAIL: '/admin/turfs/:id',
    TURF_EDIT: '/admin/turfs/:id/edit',
    MOCK_TURFS: '/admin/mock-turfs',
    MOCK_TURF_NEW: '/admin/mock-turfs/new',
    MOCK_TURF_EDIT: '/admin/mock-turfs/:id/edit',
    USERS: '/admin/users',
    USER_NEW: '/admin/users/new',
    USER_DETAIL: '/admin/users/:id',
    USER_EDIT: '/admin/users/:id/edit',
    USER_REFERRALS: '/admin/users/referrals',
    COUNTS_SUMMARY: '/admin/counts-summary',
    DISCOUNTS: '/admin/discounts',
    DISCOUNT_NEW: '/admin/discounts/new',
    DISCOUNT_DETAIL: '/admin/discounts/:id',
    DISCOUNT_EDIT: '/admin/discounts/:id/edit',
    NOTIFICATIONS: '/admin/notifications',
    APP_VERSION: '/admin/appversion',
    SETTINGS: '/admin/settings',
    ANALYTICS: '/admin/analytics',
    DELETED_SUMMARY: '/admin/deleted-summary',
    REPORTS: '/admin/reports',
  },
  
  // User
  USER: {
    LOGIN: '/login',
    REGISTER: '/register',
    VERIFY_OTP: '/verify-otp',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    DASHBOARD: '/dashboard',
    TURFS: '/turfs',
    TURF_DETAIL: '/turfs/:id',
    BOOKINGS: '/bookings',
    BOOKING_DETAIL: '/bookings/:id',
    WALLET: '/wallet',
    PROFILE: '/profile',
    SETTINGS: '/settings',
    NOTIFICATIONS: '/notifications',
  },
  
  // Partner (for future)
  PARTNER: {
    LOGIN: '/partner/login',
    DASHBOARD: '/partner',
    TURFS: '/partner/turfs',
    TURF_NEW: '/partner/turfs/new',
    TURF_EDIT: '/partner/turfs/:id/edit',
    BOOKINGS: '/partner/bookings',
    BOOKING_DETAIL: '/partner/bookings/:id',
    PROFILE: '/partner/profile',
    SETTINGS: '/partner/settings',
  },
} as const;

export type AdminRoute = typeof ROUTES.ADMIN[keyof typeof ROUTES.ADMIN];
export type UserRoute = typeof ROUTES.USER[keyof typeof ROUTES.USER];
export type PartnerRoute = typeof ROUTES.PARTNER[keyof typeof ROUTES.PARTNER];