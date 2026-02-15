import axios from 'axios';

// Use relative URL for Vite proxy (development) or environment variable (production)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * REQUEST INTERCEPTOR
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!config.url?.includes('/auth/login')) {
      console.warn("No access_token found in localStorage!");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE INTERCEPTOR
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401)) {
      console.error("Session expired. Redirecting...");
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH ENDPOINTS
// ============================================
export const login = (credentials) => api.post('/accounts/auth/login/', credentials);
export const changePassword = (data) => api.post('/accounts/user/change-password/', data);
export const getCurrentUser = () => api.get('/accounts/admin/staff/'); // Get staff list and find current user by email

// ============================================
// STAFF MANAGEMENT ENDPOINTS (Admin)
// ============================================
export const getStaffList = () => api.get('/accounts/admin/staff/');
export const listStaff = getStaffList; // Alias for backward compatibility
export const createStaff = (data) => api.post('/accounts/admin/staff/', data);
export const addStaff = createStaff; // Alias for backward compatibility
export const deleteStaff = (id) => api.delete(`/accounts/admin/staff/${id}/`);
export const updateUserProfile = (id, data) => api.patch(`/accounts/admin/users/${id}/update-profile/`, data);
export const resetUserPassword = (id) => api.post(`/accounts/admin/users/${id}/reset-password/`);

// ============================================
// AUDIT LOG ENDPOINTS (Admin)
// ============================================
export const getAuditLogs = (params) => api.get('/accounts/admin/audit-logs/', { params });
export const getAuditLogDetail = (id) => api.get(`/accounts/admin/audit-logs/${id}/`);

// ============================================
// NOTIFICATION ENDPOINTS
// ============================================
export const getNotifications = () => api.get('/accounts/user/notifications/');

// ============================================
// ORDER ENDPOINTS
// ============================================
export const getOrders = (params) => api.get('/orders/list/', { params });
export const createOrder = (data) => api.post('/orders/', data);
export const updateOrder = (id, data) => api.patch(`/orders/${id}/`, data);
export const receiveOrder = (id, totalPrice, dueDate) =>
  api.post(`/orders/${id}/process/`, {
    action: 'receive',
    total_price: totalPrice,
    due_date: dueDate
  });
export const recordPayment = (id, paymentData) =>
  api.post(`/orders/${id}/payment/`, paymentData);
export const approveOrder = (id) =>
  api.post(`/orders/${id}/process/`, { action: 'approve' });
export const rejectOrder = (id, reason) =>
  api.post(`/orders/${id}/process/`, { action: 'reject', reason });

// ============================================
// INVENTORY ENDPOINTS
// ============================================
export const getMaterials = () => api.get('/materials/');
export const createMaterial = (data) => api.post('/materials/', data);
export const updateMaterial = (pk, data) => api.patch(`/materials/${pk}/`, data);
export const adjustStock = (pk, data) => api.post(`/materials/${pk}/stock/`, data);

export default api;
