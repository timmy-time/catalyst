import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import LoadingSpinner from '../shared/LoadingSpinner';

type Props = {
  children: ReactNode;
};

function ProtectedRoute({ children }: Props) {
  const location = useLocation();
  const { isAuthenticated, isReady } = useAuthStore();

  if (!isReady) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
