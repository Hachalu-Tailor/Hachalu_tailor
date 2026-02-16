import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to access authentication context
 * @returns {Object} Auth context value containing user, loading, error, login, logout, etc.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * Hook to check if user is authenticated
 * @returns {boolean}
 */
export const useIsAuthenticated = () => {
  const { user } = useAuth();
  return !!user;
};

/**
 * Hook to get current user role
 * @returns {string|null}
 */
export const useUserRole = () => {
  const { user } = useAuth();
  return user?.role || null;
};

/**
 * Hook to check if user has specific role(s)
 * @param {string[]} allowedRoles - Array of allowed roles
 * @returns {boolean}
 */
export const useHasRole = (allowedRoles) => {
  const { user } = useAuth();
  return user && allowedRoles.includes(user.role);
};

/**
 * Hook to check if user is admin
 * @returns {boolean}
 */
export const useIsAdmin = () => {
  const { user } = useAuth();
  return user?.role === 'admin';
};

/**
 * Hook to check if user is receptionist
 * @returns {boolean}
 */
export const useIsReceptionist = () => {
  const { user } = useAuth();
  return user?.role === 'receptionist';
};

export default useAuth;
