import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

/**
 * Wrap any Route with this component to require authentication.
 * If not logged in → redirects to /login
 * If requireAdmin=true and user is Operator → redirects to /
 */
export const ProtectedRoute: React.FC<Props> = ({ children, requireAdmin = false }) => {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token || !user) {
    // Not logged in — send to login, preserve where they were going
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== 'Admin') {
    // Logged in but not an admin
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
