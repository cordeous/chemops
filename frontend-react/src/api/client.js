import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000, // 15 s — fail fast rather than hang
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chemops_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Network / timeout (no response object)
    if (!err.response) {
      const msg = err.code === 'ECONNABORTED'
        ? 'Request timed out. Check your connection and try again.'
        : 'Network error. Check your connection and try again.';
      return Promise.reject({ message: msg, network: true });
    }

    const { status, data } = err.response;

    if (status === 401) {
      localStorage.removeItem('chemops_token');
      localStorage.removeItem('chemops_user');
      window.location.href = (import.meta.env.BASE_URL || '/') + 'login';
    }

    if (status === 403) {
      return Promise.reject({ message: 'You do not have permission to perform this action.', status });
    }

    if (status === 404) {
      return Promise.reject({ message: 'The requested resource was not found.', status });
    }

    if (status === 429) {
      return Promise.reject({ message: 'Too many requests. Please wait a moment and try again.', status });
    }

    if (status >= 500) {
      return Promise.reject({ message: 'Server error. Please try again later.', status });
    }

    // Return API-shaped error (400 validation etc.) or a generic fallback
    return Promise.reject(data || { message: `Request failed (${status})`, status });
  }
);

export default api;
