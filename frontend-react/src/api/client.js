import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chemops_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('chemops_token');
      localStorage.removeItem('chemops_user');
      window.location.href = (import.meta.env.BASE_URL || '/') + 'login';
    }
    return Promise.reject(err.response?.data || err);
  }
);

export default api;
