import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * AUTH INTERCEPTOR
 * This runs before every single request. It grabs the 'access_token' 
 * from storage and injects it into the headers.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Django SimpleJWT expects 'Bearer <token>'
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- AUTH ---
export const login = (credentials) => {
  return api.post('/accounts/auth/login/', credentials);
};

// --- STAFF MANAGEMENT (Requires Admin Token) ---
export const addStaff = (data) => api.post('/accounts/admin/staff/', data);

// Note: Ensure your backend view handles POST for listing
export const listStaff = () => api.post('/accounts/admin/staff/'); 

// Note: Ensure your backend view handles POST for deletion
export const deleteStaff = (id) => api.post(`/accounts/admin/staff/${id}/`);

export default api;