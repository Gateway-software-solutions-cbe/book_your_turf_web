// src/components/admin/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * Wraps any route that requires an authenticated admin session.
 * - While auth state is hydrating from localStorage, renders a full-page loader.
 * - Once hydrated: 
 *   - requireAuth=true & unauthenticated → redirect to /admin/login
 *   - requireAuth=false & authenticated → redirect to /admin
 *   - Otherwise → renders child routes via <Outlet />
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requireAuth = true, 
  redirectTo = '/admin/login' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <div className="spinner-border text-success" role="status" aria-label="Loading" />
      </div>
    );
  }

  // If user needs to be authenticated but isn't
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If user is authenticated but trying to access login page
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;