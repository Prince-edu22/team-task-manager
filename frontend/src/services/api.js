// import axios from 'axios';

// const getBaseURL = () => {
//   // In development (localhost), use relative URL (Vite proxy handles it)
//   if (import.meta.env.DEV) {
//     return '/api';
//   }
//   // In production, use your Render backend URL
//   return 'https://team-task-managers-dwmw.onrender.com/';
// };

// const api = axios.create({
//   baseURL: 'https://team-task-managers-dwmw.onrender.com/',
//   headers: { 'Content-Type': 'application/json' },
//   withCredentials: true  
// });

// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;
import axios from 'axios';

// Direct URL - no complexity
const API_URL = 'https://team-task-managers-dwmw.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`Making request to: ${config.baseURL}${config.url}`); // Debug
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;