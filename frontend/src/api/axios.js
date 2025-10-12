import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if:
    // 1. Status is 401
    // 2. NOT a login/register request (to allow showing error messages)
    // 3. User has a token (meaning they were logged in before)
    const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                          error.config?.url?.includes('/auth/register');
    
    if (error.response?.status === 401 && !isAuthRequest && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      // Use setTimeout to allow error messages to show first
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
    
    return Promise.reject(error);
  }
);

export default api;
