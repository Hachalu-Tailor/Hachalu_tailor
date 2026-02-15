import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, getStaffList } from '../api/api';

// Create the Auth Context
const AuthContext = createContext(null);

// Normalize role from backend (ADMIN -> admin, RECEPTIONIST -> receptionist)
const normalizeRole = (role) => {
    if (!role) return 'receptionist';
    return role.toLowerCase().trim();
};

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
                        role: normalizeRole(userRole),
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

    // Determine role by trying to access admin-only endpoint
    const determineRole = useCallback(async (email) => {
        try {
            // Try to access admin-only staff list
            const response = await getStaffList();
            const staffList = response.data || [];
            
            // If we get here, user is admin - find their profile
            const currentUser = staffList.find(staff => staff.email === email);
            return {
                role: normalizeRole(currentUser?.role || 'admin'),
                profile: currentUser
            };
        } catch (err) {
            // If 403 Forbidden, user is receptionist
            if (err.response?.status === 403) {
                return { role: 'receptionist', profile: null };
            }
            // For other errors, default to receptionist
            console.error('Error determining role:', err);
            return { role: 'receptionist', profile: null };
        }
    }, []);

    // Login function
    const login = useCallback(async (credentials) => {
        setLoading(true);
        setError(null);

        try {
            const response = await loginApi(credentials);
            const { access, refresh } = response.data;

            if (!access) {
                throw new Error('No access token received from server');
            }

            // Store tokens
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);

            // Store email temporarily
            const userData = { email: credentials.email };
            localStorage.setItem('user_data', JSON.stringify(userData));

            // Determine role by trying admin endpoint
            const { role, profile } = await determineRole(credentials.email);
            
            localStorage.setItem('user_role', role);

            // Update user data with profile info
            if (profile) {
                userData.full_name = profile.full_name;
                userData.id = profile.id;
                localStorage.setItem('user_data', JSON.stringify(userData));
            }

            setUser({
                role,
                ...userData,
            });

            return { success: true, role };
        } catch (err) {
            const errorMessage = err.response?.data?.detail ||
                err.message ||
                'Login failed. Please try again.';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    }, [determineRole]);

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
        // Normalize for comparison
        const normalizedRoles = roleArray.map(r => normalizeRole(r));
        return normalizedRoles.includes(user.role);
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
