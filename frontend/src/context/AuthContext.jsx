import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi } from '../api/api';

// Create the Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initAuth = () => {
            try {
                const accessToken = localStorage.getItem('access_token');
                const userRole = localStorage.getItem('user_role');
                const userData = localStorage.getItem('user_data');

                if (accessToken && userRole) {
                    setUser({
                        role: userRole,
                        ...(userData ? JSON.parse(userData) : {}),
                    });
                }
            } catch (err) {
                console.error('Error initializing auth:', err);
                localStorage.clear();
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // Login function
    const login = useCallback(async (credentials) => {
        setLoading(true);
        setError(null);

        try {
            const response = await loginApi(credentials);
            const { access, refresh, role } = response.data;

            if (!access) {
                throw new Error('No access token received from server');
            }

            // Store tokens and role
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);

            const normalizedRole = (role || 'receptionist').toLowerCase();
            localStorage.setItem('user_role', normalizedRole);

            // Store minimal user data
            const userData = { email: credentials.email };
            localStorage.setItem('user_data', JSON.stringify(userData));

            setUser({
                role: normalizedRole,
                ...userData,
            });

            return { success: true, role: normalizedRole };
        } catch (err) {
            const errorMessage = err.response?.data?.detail ||
                err.message ||
                'Login failed. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, []);

    // Logout function
    const logout = useCallback(() => {
        localStorage.clear();
        setUser(null);
        setError(null);
    }, []);

    // Check if user has specific role
    const hasRole = useCallback((roles) => {
        if (!user?.role) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
    }, [user]);

    // Check if user is admin
    const isAdmin = useCallback(() => {
        return user?.role === 'admin';
    }, [user]);

    // Check if user is receptionist
    const isReceptionist = useCallback(() => {
        return user?.role === 'receptionist';
    }, [user]);

    // Clear error
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Context value
    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        isAdmin,
        isReceptionist,
        clearError,
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

export default AuthContext;
