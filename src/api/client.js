import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Automatically attach JWT token if available in localStorage
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ocean_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract data or format error message; handle 401 token expiry
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized and a token was stored, clear invalid/expired token
      const storedToken = localStorage.getItem('ocean_admin_token');
      if (storedToken) {
        localStorage.removeItem('ocean_admin_token');
        localStorage.removeItem('ocean_admin_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    const errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error?.message ||
      error.message ||
      'An unexpected API error occurred';
    return Promise.reject(new Error(errorMsg));
  }
);

export default client;
