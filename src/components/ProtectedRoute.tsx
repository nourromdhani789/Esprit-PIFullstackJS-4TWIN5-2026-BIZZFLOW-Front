import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Role, isAdminRole, isBusinessRole } from '../config/menuConfig';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
  requireAdmin?: boolean;
  requireBusiness?: boolean;
  fallback?: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * 
 * Handles role-based access control at the route level.
 * 
 * Usage:
 * 
 * 1. Allow specific roles:
 * <ProtectedRoute allowedRoles={[Role.PLATFORM_ADMIN]}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 * 
 * 2. Require admin role:
 * <ProtectedRoute requireAdmin>
 *   <AdminPage />
 * </ProtectedRoute>
 * 
 * 3. Require business role:
 * <ProtectedRoute requireBusiness>
 *   <BusinessPage />
 * </ProtectedRoute>
 * 
 * 4. Custom fallback:
 * <ProtectedRoute allowedRoles={[Role.BUSINESS_OWNER]} fallback={<Unauthorized />}> 
 *   <OwnerPage />
 * </ProtectedRoute>
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAdmin = false,
  requireBusiness = false,
  fallback,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while auth is being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated - redirect to signin
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  const userRole = user.roleId as Role;

  // Check role requirements
  let hasAccess = true;

  // If specific roles are provided, check against them
  if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = allowedRoles.includes(userRole);
  }

  // If requireAdmin flag is set, check for admin role
  if (requireAdmin && !isAdminRole(userRole)) {
    hasAccess = false;
  }

  // If requireBusiness flag is set, check for business role
  if (requireBusiness && !isBusinessRole(userRole)) {
    hasAccess = false;
  }

  // If user doesn't have access
  if (!hasAccess) {
    // Return custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Redirect based on user role
    if (isAdminRole(userRole)) {
      // Admin trying to access business route -> go to admin dashboard
      return <Navigate to="/admin/dashboard" replace />;
    } else {
      // Business user trying to access admin route -> go to business dashboard
      return <Navigate to="/dashboard" replace />;
    }
  }

  // User has access - render children
  return <>{children}</>;
};

export default ProtectedRoute;

/**
 * Pre-configured route guards for common scenarios
 */

// Only PLATFORM_ADMIN
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={[Role.PLATFORM_ADMIN]}>
    {children}
  </ProtectedRoute>
);

// Business users only (Owner, Admin, Accountant, Team Member)
export const BusinessRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireBusiness>
    {children}
  </ProtectedRoute>
);

// Business Owner and Admin only
export const ManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={[Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN]}>
    {children}
  </ProtectedRoute>
);

// Owner, Admin, Accountant (no team members for financial data)
export const FinancialRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={[Role.BUSINESS_OWNER, Role.BUSINESS_ADMIN, Role.ACCOUNTANT]}>
    {children}
  </ProtectedRoute>
);
