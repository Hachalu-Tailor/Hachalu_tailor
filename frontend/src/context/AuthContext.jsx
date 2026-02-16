import React, { createContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin } from '../api/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('access_token');
        const role = localStorage.getItem('user_role');
        const userId = localStorage.getItem('user_id');
        const userName = localStorage.getItem('user_name');
        const userEmail = localStorage.getItem('user_email');

        if (token && role) {
          setUser({
            id: userId,
            name: userName,
            email: userEmail,
            role: role.toLowerCase(),
            token,
          });
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiLogin(credentials);
      const { access, refresh, role, user_id, name, email } = response.data;

      if (!access) {
        throw new Error('No access token received from server');
      }

      // Store in localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_role', role?.toLowerCase() || 'receptionist');
      localStorage.setItem('user_id', user_id || '');
      localStorage.setItem('user_name', name || '');
      localStorage.setItem('user_email', email || credentials.email);

      // Update state
      const userData = {
        id: user_id,
        name: name,
        email: email || credentials.email,
        role: role?.toLowerCase() || 'receptionist',
        token: access,
      };

      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    setUser(null);
  }, []);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!user && !!localStorage.getItem('access_token');
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback((allowedRoles) => {
    return user && allowedRoles.includes(user.role);
  }, [user]);

  // Update user profile in context
  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
    if (updates.name) localStorage.setItem('user_name', updates.name);
    if (updates.email) localStorage.setItem('user_email', updates.email);
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    hasRole,
    updateUser,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
