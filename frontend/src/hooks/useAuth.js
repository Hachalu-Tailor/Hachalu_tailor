import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth as useAuthContext } from '../context/AuthContext';
import { ROUTES } from '../utils/routes';

/**
 * Base hook that wraps the AuthContext
 * This is the primary hook for authentication
 */
export const useAuth = () => {
  return useAuthContext();
};

/**
 * Check if user is authenticated
 */
export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated;
};

/**
 * Get user role
 */
export const useUserRole = () => {
  const { user } = useAuthContext();
  return user?.role || null;
};

/**
 * Check if user has a specific role
 */
export const useHasRole = (roles) => {
  const { user } = useAuthContext();
  if (!user) return false;
  if (Array.isArray(roles)) {
    return roles.includes(user.role);
  }
  return user.role === roles;
};

/**
 * Check if user is admin
 */
export const useIsAdmin = () => {
  const { user } = useAuthContext();
  return user?.role === 'ADMIN';
};

/**
 * Check if user is receptionist
 */
export const useIsReceptionist = () => {
  const { user } = useAuthContext();
  return user?.role === 'RECEPTIONIST';
};

/**
 * Enhanced authentication hook with additional functionality
 * Builds on top of the base useAuth context
 */
export const useAuthHook = () => {
  const auth = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Login with redirect
  const loginWithRedirect = useCallback(async (credentials, redirectTo = null) => {
    setLoading(true);
    try {
      const result = await auth.login(credentials);

      if (result.success) {
        // Determine redirect path based on user role
        const defaultRedirect = getDefaultRedirectPath(result.user.role);
        navigate(redirectTo || defaultRedirect, { replace: true });
      }

      return result;
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  }, [auth, navigate]);

  // Logout with redirect
  const logoutWithRedirect = useCallback(async (redirectTo = '/login') => {
    setLoading(true);
    try {
      await auth.logout();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  }, [auth, navigate]);

  // Get default redirect path based on role
  const getDefaultRedirectPath = (role) => {
    switch (role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'RECEPTIONIST':
        return '/reception/dashboard';
      case 'TAILOR':
        return '/tailor/dashboard';
      default:
        return '/';
    }
  };

  // Check if user can access admin features
  const canAccessAdmin = useCallback(() => {
    return auth.isAdmin();
  }, [auth]);

  // Check if user can access reception features
  const canAccessReception = useCallback(() => {
    return auth.hasAnyRole(['ADMIN', 'RECEPTIONIST']);
  }, [auth]);

  // Check if user can manage orders
  const canManageOrders = useCallback(() => {
    return auth.hasAnyRole(['ADMIN', 'RECEPTIONIST']);
  }, [auth]);

  // Check if user can manage inventory
  const canManageInventory = useCallback(() => {
    return auth.hasAnyRole(['ADMIN', 'RECEPTIONIST']);
  }, [auth]);

  // Check if user can view all users
  const canViewAllUsers = useCallback(() => {
    return auth.isAdmin();
  }, [auth]);

  // Check if user can manage staff
  const canManageStaff = useCallback(() => {
    return auth.isAdmin();
  }, [auth]);

  // Check if user can process payments
  const canProcessPayments = useCallback(() => {
    return auth.hasAnyRole(['ADMIN', 'RECEPTIONIST']);
  }, [auth]);

  // Check if user can view analytics
  const canViewAnalytics = useCallback(() => {
    return auth.isAdmin();
  }, [auth]);

  return {
    ...auth,
    loading: loading || auth.loading,
    loginWithRedirect,
    logoutWithRedirect,
    canAccessAdmin,
    canAccessReception,
    canManageOrders,
    canManageInventory,
    canViewAllUsers,
    canManageStaff,
    canProcessPayments,
    canViewAnalytics
  };
};

// Export both named and default
export default useAuth;
