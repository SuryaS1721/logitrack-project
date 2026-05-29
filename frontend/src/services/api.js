import axios from 'axios';

// Configure standard API instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Request interceptor to automatically insert JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to intercept session failures
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if error is 401 Unauthorized (invalid/expired JWT)
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized! Removing credentials...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Force trigger state reload if auth context needs it
      window.dispatchEvent(new Event('auth-logout'));
    }
    
    // Normalize error messages for simplified UI consumption
    const normalizedError = 
      error.response?.data?.message || 
      error.message || 
      'A connection issue occurred. Please check your network and try again.';
      
    return Promise.reject(new Error(normalizedError));
  }
);

// Authentication Endpoint Actions
export const authAPI = {
  register: async (userData) => {
    const res = await API.post('/api/auth/register', userData);
    return res.data;
  },
  login: async (credentials) => {
    const res = await API.post('/api/auth/login', credentials);
    return res.data;
  },
  getMe: async () => {
    const res = await API.get('/auth/me');
    return res.data;
  }
};

// Delivery Order Endpoint Actions
export const orderAPI = {
  create: async (orderData) => {
    const res = await API.post('/orders', orderData);
    return res.data;
  },
  getMyOrders: async (params = {}) => {
    const res = await API.get('/orders', { params });
    return res.data;
  },
  getAllOrders: async (params = {}) => {
    const res = await API.get('/orders/all', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await API.get(`/orders/${id}`);
    return res.data;
  },
  cancel: async (id) => {
    const res = await API.delete(`/orders/${id}`);
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await API.patch(`/orders/${id}/status`, { status });
    return res.data;
  }
};

export default API;
