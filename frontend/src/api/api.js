import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';
import { getHexColor, setBackendColors } from '../utils/colors';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ============================================
// TOKEN MANAGEMENT FUNCTIONS
// ============================================

/**
 * Set tokens in localStorage
 */
export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = () => {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = () => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

/**
 * Clear all tokens from localStorage
 */
export const clearTokens = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
};

/**
 * REQUEST INTERCEPTOR
 * We use a "fresh" get from localStorage every time to avoid stale tokens.
 */
api.interceptors.request.use(
  (config) => {
    // IMPORTANT: This must match exactly what you use in Login.jsx
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("No access_token found in localStorage!");
    }

    // Don't set Content-Type for FormData - let axios set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 * Handles 401 errors - redirect to login
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 = Token expired/Invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear tokens and redirect to login
      clearTokens();
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }

    // 403 = Authenticated but lacks permissions (Role issue)
    if (error.response?.status === 403) {
      console.error("Permission denied:", error.response.data);
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTH ENDPOINTS
// ============================================

export const login = (credentials) => api.post('/accounts/auth/login/', credentials);

export const logout = () => {
  clearTokens();
  window.location.href = '/login';
};

// ============================================
// STAFF MANAGEMENT ENDPOINTS
// ============================================

export const addStaff = (data) => api.post('/accounts/admin/staff/', data);

export const listStaff = () => api.get('/accounts/admin/staff/');

export const getStaffDetail = (id) => api.get(`/accounts/admin/staff/${id}/`);

export const getStaffByRole = (role) => api.get(`/accounts/admin/staff/`, { params: { role } });

export const getGarmentStaff = () => api.get('/accounts/admin/staff/', { params: { role: 'GARMENT' } });

export const getReceptionStaff = () => api.get('/accounts/admin/staff/', { params: { role: 'RECEPTIONIST' } });

export const updateStaff = (id, data) => api.patch(`/accounts/admin/staff/${id}/`, data);

export const deleteStaff = (id) => api.delete(`/accounts/admin/staff/${id}/`);

export const resetPassword = (id) => api.post(`/accounts/admin/users/${id}/reset-password/`);

export const updateProfile = (id, data) => api.patch(`/accounts/admin/users/${id}/update-profile/`, data);

export const changePassword = (data) => api.post('/accounts/user/change-password/', data);

// ============================================
// AUDIT LOGS ENDPOINTS
// ============================================

export const getAuditLogs = (params) => api.get('/accounts/admin/audit-logs/', { params });

export const getAuditLogDetail = (id) => api.get(`/accounts/admin/audit-logs/${id}/`);

// ============================================
// NOTIFICATIONS ENDPOINTS
// ============================================

export const getNotifications = (params) => api.get('/accounts/user/notifications/', { params });

export const markNotificationRead = (id) => api.patch(`/accounts/user/notifications/${id}/`, { read: true });

export const markAllNotificationsRead = () => api.post('/accounts/user/notifications/mark-all-read/');

// Mark notification read endpoint doesn't exist in backend - create a helper to update locally
export const getNotificationsSummary = (notifications) => {
  const unread = notifications.filter(n => !n.read).length;
  return {
    total: notifications.length,
    unread,
    read: notifications.length - unread
  };
};

// ============================================
// INVENTORY ENDPOINTS
// ============================================

export const getMaterials = async (params) => {
  const response = await api.get('/invetory/materials/list/', { params });
  const payload = response?.data;
  const materials = Array.isArray(payload) ? payload : payload?.results || [];
  getColorsFromMaterials(materials);
  return response;
};

export const createMaterial = (data) => api.post('/invetory/materials/create/', data);

// Create a new color (collection) in inventory
export const createColor = (data) => api.post('/invetory/colors/', data);
export const getColors = async (params) => {
  const response = await api.get('/invetory/colors/', { params });
  const payload = response?.data;
  const colorList = Array.isArray(payload) ? payload : payload?.results || [];
  setBackendColors(colorList);
  return response;
};

export const getMaterialDetail = (id) => api.get(`/invetory/materials/${id}/`);

export const updateMaterial = (id, data) => api.patch(`/invetory/materials/${id}/`, data);

export const deleteMaterial = (id) => api.delete(`/invetory/materials/${id}/`);

export const adjustStock = (id, data) => api.post(`/invetory/materials/${id}/stock/`, data);

export const getColorsFromMaterials = (materials) => {
  // Extract unique colors from materials list
  const colorsMap = new Map();
  materials.forEach(material => {
    if (material.colors && Array.isArray(material.colors)) {
      material.colors.forEach(color => {
        if (color.id && color.name && !colorsMap.has(color.id)) {
          // Use hex_color from backend if available, otherwise use our utility
          const hexColor = color.hex_color || getHexColor(color.name);
          colorsMap.set(color.id, { id: color.id, name: color.name, hex_color: hexColor });
        }
      });
    }
  });
  const result = Array.from(colorsMap.values());
  setBackendColors(result);
  return result;
};

// ============================================
// ORDERS ENDPOINTS
// ============================================

export const createOrder = (data) => api.post('/orders/', data);

export const getOrders = (params) => api.get('/orders/list/', { params });

export const getOrderDetail = (id) => api.get(`/orders/${id}/`);

export const updateOrder = (id, data) => api.patch(`/orders/${id}/`, data);

export const deleteOrder = (id) => api.delete(`/orders/${id}/`);

export const processOrder = (id, data) => api.post(`/orders/${id}/process`, data);

export const updateReceptionOrderStatusByCode = (code, status) =>
  api.patch(`/orders/code/${code}/status/`, { status });

export const expireOrders = () => api.post('/orders/expire/');

export const getOrderByCode = (code) => api.get(`/orders/code/${code}/`);

// ============================================
// SUIT TYPES ENDPOINTS
// ============================================

export const getSuitTypes = (params) => api.get('/suit-types/', { params });

export const createSuitType = (data) => api.post('/suit-types/create/', data);

// ============================================
// PAYMENTS ENDPOINTS
// ============================================

export const getPayments = (params) => api.get('/payments/list/', { params });

export const createPayment = (data) => api.post('/payments/', data);

export const verifyPayment = (id, data) => api.post(`/payments/${id}/verify/`, data);

export const getPaymentByOrderId = (order_id) => api.get(`/payments/order/${order_id}/`);

// ============================================
// GARMENT ENDPOINTS
// ============================================

export const getGarmentOrdersInProgress = (params) => api.get('/garment/orders/in-progress/', { params });

export const getGarmentInProgressDetail = (code) => api.get(`/garment/orders/in-progress/detail/?code=${code}`);

export const getGarmentShippedOrders = (params) => api.get('/garment/orders/shipped/', { params });

export const getGarmentShippedDetail = (code) => api.get(`/garment/orders/shipped/detail/?code=${code}`);

export const getAllGarmentOrders = (params) => api.get('/orders/garment/', { params });

export const processGarmentOrder = (code, data) => api.post(`/garment/orders/${code}/process/`, data);

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Helper to handle API errors consistently
 */
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return data.detail || 'Invalid request data';
      case 401:
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.detail || 'An error occurred.';
    }
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred.';
  }
};

/**
 * Helper to extract error message from API response
 */
export const getErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;

    // Handle different error formats
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    if (data.error) return data.error;

    // Handle field errors
    if (typeof data === 'object') {
      const messages = [];
      Object.entries(data).forEach(([field, errors]) => {
        if (Array.isArray(errors)) {
          messages.push(`${field}: ${errors.join(', ')}`);
        } else if (typeof errors === 'string') {
          messages.push(`${field}: ${errors}`);
        }
      });
      if (messages.length > 0) return messages.join('\n');
    }
  }

  return error.message || 'An unexpected error occurred.';
};

export default api;
