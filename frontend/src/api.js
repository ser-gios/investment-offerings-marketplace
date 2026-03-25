import axios from 'axios';

// API configuration
// In development: use local proxy
// In production: use Render backend URL
let baseURL;

if (import.meta.env.DEV) {
  // Development: use local proxy
  baseURL = '/api';
} else {
  // Production: hardcode Render backend URL
  baseURL = 'https://investment-marketplace-api.onrender.com/api';
}

console.log('🔗 API baseURL:', baseURL);
console.log('🔗 Environment - PROD:', import.meta.env.PROD, 'DEV:', import.meta.env.DEV);

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
