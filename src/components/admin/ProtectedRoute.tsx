import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── ProtectedRoute ────────────────────────────────────────────────────────────

/**
 * Wraps any route that requires an authenticated admin session.
 * - While auth state is hydrating from localStorage, renders a full-page loader.
 * - Once hydrated: unauthenticated → redirect to /admin/login (preserving `from`)
 * - Authenticated → renders child routes via <Outlet />
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="d-flex min-vh-100 align-items-center justify-content-center">
        <div className="spinner-border text-success" role="status" aria-label="Loading" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
