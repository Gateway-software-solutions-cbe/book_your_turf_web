// src/components/user/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useUserAuth } from '../../context/UserAuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated } = useUserAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
