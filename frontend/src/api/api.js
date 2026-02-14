import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * REQUEST INTERCEPTOR
 * We use a "fresh" get from localStorage every time to avoid stale tokens.
 */
api.interceptors.request.use(
  (config) => {
    // IMPORTANT: This must match exactly what you use in Login.jsx
    const token = localStorage.getItem('access_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Log for your debugging (Remove in production)
      // console.log("Request sent with token:", token.substring(0, 10) + "...");
    } else {
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
    // 401 = Token expired/Invalid
    // 403 = Authenticated but lacks permissions (Role issue)
    if (error.response && (error.response.status === 401)) {
      console.error("Session expired. Redirecting...");
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- ENDPOINTS ---

export const login = (credentials) => api.post('/accounts/auth/login/', credentials);

// Staff Management
export const addStaff = (data) => api.post('/accounts/admin/staff/', data);

// If your Django view requires a trailing slash and POST, keep it like this
export const listStaff = () => api.get('/accounts/admin/staff/'); 

export const deleteStaff = (id) => api.post(`/accounts/admin/staff/${id}/`);

export default api;