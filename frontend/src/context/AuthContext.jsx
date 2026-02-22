import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setTokens, clearTokens, getAccessToken, getRefreshToken } from '../api/api';
import { STORAGE_KEYS } from '../utils/constants';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check authentication status
  const checkAuth = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    // Get user data from localStorage (stored during login)
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    setLoading(false);
  };

  // Refresh access token (disabled - backend doesn't have this endpoint)
  const refreshAccessToken = async () => {
    // Backend doesn't have token refresh endpoint configured
    // Return false to indicate refresh is not available
    return false;
  };

  // Login function
  const login = async (credentials) => {
    try {
      const response = await api.post('/accounts/auth/login/', credentials);

      const { access, refresh, user_id, role } = response.data;

      // Store tokens
      setTokens(access, refresh);

      // Create user object from response (backend returns user_id and role separately)
      const userData = {
        id: user_id,
        role: role?.toUpperCase() // Normalize role to uppercase
      };

      // Store user data in localStorage for persistence
      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('user_role', role?.toLowerCase()); // For DashboardLayout compatibility

      // Set user data
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint if authenticated
      if (isAuthenticated) {
        await api.post('/accounts/auth/logout/').catch(() => { });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and user data
      clearTokens();
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_role');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Update user profile
  const updateProfile = async (data) => {
    try {
      const response = await api.patch(`/accounts/admin/users/${user.id}/update-profile/`, data);

      if (response.data) {
        setUser(prev => ({ ...prev, ...response.data }));
        return { success: true };
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update profile'
      };
    }
  };

  // Update user state
  const updateUser = useCallback((data) => {
    setUser(prev => ({ ...prev, ...data }));
    // Also update localStorage
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      localStorage.setItem('user_data', JSON.stringify({ ...parsedUser, ...data }));
    }
  }, []);

  // Change password
  const changePassword = async (data) => {
    try {
      await api.post('/accounts/auth/change-password/', data);
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Password change failed:', error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to change password'
      };
    }
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  // Check if user is admin
  const isAdmin = () => hasRole('ADMIN');

  // Check if user is receptionist
  const isReceptionist = () => hasRole('RECEPTIONIST');

  // Check if user is tailor
  const isTailor = () => hasRole('TAILOR');

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    updateProfile,
    changePassword,
    updateUser,
    hasRole,
    hasAnyRole,
    isAdmin,
    isReceptionist,
    isTailor,
    refreshAccessToken,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export context for direct use if needed
export default AuthContext;
