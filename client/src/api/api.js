import axios from 'axios';

// ── Base instance ──────────────────────────────────────
// baseURL is empty — nginx (Docker) or kgateway (K8s) handle routing
// of /api/v1/* to the correct microservice transparently.
const axiosInstance = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ───────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ff_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response interceptor: handle 401 ──────────────────
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ff_token');
      localStorage.removeItem('ff_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─────────────────────────────────────────────────────
//  Structured API layer — groups calls by domain
// ─────────────────────────────────────────────────────

export const auth = {
  login:    (body) => axiosInstance.post('/api/v1/auth/login',    body),
  register: (body) => axiosInstance.post('/api/v1/auth/register', body),
};

export const users = {
  me:         ()              => axiosInstance.get('/api/v1/users/me'),
  list:       (params = {})   => axiosInstance.get('/api/v1/users',              { params }),
  adminStats: ()              => axiosInstance.get('/api/v1/users/admin/stats'),
};

export const transactions = {
  list:      (params = {}) => axiosInstance.get('/api/v1/transactions',                   { params }),
  create:    (body)        => axiosInstance.post('/api/v1/transactions',                   body),
  update:    (id, body)    => axiosInstance.put(`/api/v1/transactions/${id}`,              body),
  remove:    (id)          => axiosInstance.delete(`/api/v1/transactions/${id}`),
  getById:   (id)          => axiosInstance.get(`/api/v1/transactions/${id}`),
  analytics: ()            => axiosInstance.get('/api/v1/transactions/analytics/summary'),
  adminStats:()            => axiosInstance.get('/api/v1/transactions/admin/stats'),
};

export const notifications = {
  list:        ()     => axiosInstance.get('/api/v1/notifications/'),
  markRead:    (id)   => axiosInstance.patch(`/api/v1/notifications/${id}/read`),
  markAllRead: ()     => axiosInstance.patch('/api/v1/notifications/read-all'),
};

// Default export for legacy imports (axios.js was the old name)
export default axiosInstance;
