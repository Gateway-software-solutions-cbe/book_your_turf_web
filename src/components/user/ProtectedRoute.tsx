// src/components/user/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';

interface ProtectedRouteProps {
  requireAuth?: boolean; // If true, user must be authenticated
  redirectTo?: string;   // Where to redirect if condition fails
}

const ProtectedRoute = ({ 
  requireAuth = true, 
  redirectTo = '/' 
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useUserAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If user needs to be authenticated but isn't
  if (requireAuth && !isAuthenticated) {
    // Save the location they tried to access for redirect after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If user is authenticated but trying to access login/register pages
  if (!requireAuth && isAuthenticated) {
    // Redirect to turfs page (or dashboard)
    return <Navigate to="/turfs" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;