import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Interceptor to add JWT token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Mencegah browser menggunakan cache lama (solusi kontak akun lain muncul)
  if (config.method === 'get' && config.headers) {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
  }
  
  return config;
});

// Interceptor to handle 403 Suspended responses globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403 && error.response.data?.is_suspended) {
      // Dispatch a custom event so the UI can update immediately without a full reload, or just reload.
      // Let's dispatch a custom event to update AuthContext or MainLayout.
      window.dispatchEvent(new Event('user_suspended'));
    }
    
    // Automatically log out user if token is invalid or user is deleted
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth_unauthorized'));
      // Prevent redirect loop if already on login or register
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
