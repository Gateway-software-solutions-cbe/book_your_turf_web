// src/components/admin/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  requireAuth?: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requireAuth = true,
  redirectTo = '/admin/login',
}) => {
  const { isAuthenticated, isLoading, sideNav } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <div className="spinner-border text-success" role="status" aria-label="Loading" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  const isPathAccessible = (path: string): boolean => {
    if (path === '/welcome' || path === '/admin') return true;

    return sideNav.some(
      (item) => path === item.path || path.startsWith(`${item.path}/`),
    );
  };

  if (requireAuth && isAuthenticated && sideNav.length > 0) {
    if (!isPathAccessible(location.pathname)) {
      return <Navigate to="/welcome" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
