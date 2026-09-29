// src/components/partner/ProtectedRoute.tsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { usePartnerAuth } from "../../context/PartnerAuthContext";

interface PartnerProtectedRouteProps {
  requireAuth: boolean;
  redirectTo: string;
}

const PartnerProtectedRoute: React.FC<PartnerProtectedRouteProps> = ({
  requireAuth,
  redirectTo,
}) => {
  const { isAuthenticated, loading } = usePartnerAuth();

  if (loading) return <div className="loader">Loading...</div>;

  // Authenticated users shouldn't see login/register pages
  if (!requireAuth && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Unauthenticated users shouldn't see protected pages
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default PartnerProtectedRoute;