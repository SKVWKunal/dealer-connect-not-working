import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { UserRole, ModuleKey } from '@/types';
import FeatureUnavailable from '@/pages/FeatureUnavailable';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
  moduleKey?: ModuleKey;
}

export function ProtectedRoute({ children, roles, moduleKey }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isModuleEnabled } = useFeatureFlags();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check module flag
  if (moduleKey && !isModuleEnabled(moduleKey)) {
    // Super admin sees the unavailable page with management link
    // Other users are redirected to not found
    if (user?.role === 'super_admin') {
      return <FeatureUnavailable />;
    }
    return <Navigate to="/not-found" replace />;
  }

  // Check role
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
