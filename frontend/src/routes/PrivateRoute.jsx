import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/contexts/AuthContext';

export default function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet : <Navigate to="/login" replace />;
}
