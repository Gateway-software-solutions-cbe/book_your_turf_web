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
  redirectTo = '/admin/login' 
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

  // If authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If authentication is not required (login page) and user is authenticated
  if (!requireAuth && isAuthenticated) {
    // Redirect to welcome page
    return <Navigate to="/welcome" replace />;
  }

  // Check if current path is accessible
  const isPathAccessible = (path: string): boolean => {
    // Always allow welcome page and dashboard
    if (path === '/welcome' || path === '/admin') {
      return true;
    }
    
    return sideNav.some(item => {
      return path === item.path || path.startsWith(item.path + '/');
    });
  };

  // If authenticated but trying to access a path not in sidebar
  if (requireAuth && isAuthenticated && sideNav.length > 0) {
    const currentPath = location.pathname;
    if (!isPathAccessible(currentPath)) {
      // Redirect to welcome page
      return <Navigate to="/welcome" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;