import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_CORE_API || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if it's not a network error and we have a token
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      // If we have a token but got 401, it might be expired - redirect to login
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    // For network errors (no response), don't redirect - just log
    if (!error.response && error.code === 'ERR_NETWORK') {
      console.error('Network error - backend may not be running:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;

