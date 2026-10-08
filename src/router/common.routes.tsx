// src/router/common.routes.tsx
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const LandingPage = lazy(() => import('../components/common/Landing'));
const PrivacyPolicy = lazy(() => import('../components/common/PrivacyPolicy'));
const TermsAndConditions = lazy(()=> import('../components/common/TermsAndConditions'))

export const commonRoutes: RouteObject[] = [
  {
    path: '/',
    element: <LandingPage />,
  },
  {
  path: '/privacy',
  element: <PrivacyPolicy />,
},
{
  path: '/terms',
  element: <TermsAndConditions />,
},
];