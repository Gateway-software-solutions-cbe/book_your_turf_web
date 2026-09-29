// src/router/common.routes.tsx
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

const LandingPage = lazy(() => import('../components/common/Landing'));

export const commonRoutes: RouteObject[] = [
  {
    path: '/',
    element: <LandingPage />,
  },
];