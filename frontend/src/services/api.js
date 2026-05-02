import axios from 'axios';

const getBaseURL = () => {
  // In development (localhost), use relative URL (Vite proxy handles it)
  if (import.meta.env.DEV) {
    return '/api';
  }
  // In production, use your Render backend URL
  return 'https://team-task-managers-dwmw.onrender.com/';
};

const api = axios.create({
  baseURL: 'https://team-task-managers-dwmw.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true  
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;