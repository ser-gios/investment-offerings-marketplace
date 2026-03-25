import axios from 'axios';

// API configuration - uses VITE_API_URL environment variable
// In production, defaults to Render backend
const apiUrl = import.meta.env.VITE_API_URL || 'https://investment-marketplace-api.onrender.com';
const baseURL = `${apiUrl}/api`;

// Log in development to debug
if (import.meta.env.DEV) {
  console.log('API baseURL:', baseURL);
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('PROD:', import.meta.env.PROD);
}

const api = axios.create({ baseURL });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('nv_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nv_token');
      localStorage.removeItem('nv_user');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

export default api;
