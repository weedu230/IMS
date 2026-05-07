import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT to every request ───────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ims_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Global response error handling ───────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ims_token');
      localStorage.removeItem('ims_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:          (data) => api.post('/auth/login', data),
  getMe:          ()     => api.get('/auth/me'),
  changePassword: (data) => api.patch('/auth/change-password', data),
  register:       (data) => api.post('/auth/register', data),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productAPI = {
  getAll:     (params) => api.get('/products', { params }),
  getById:    (id)     => api.get(`/products/${id}`),
  getBySku:   (sku)    => api.get(`/products/sku/${sku}`),
  create:     (data)   => api.post('/products', data),
  update:     (id, data) => api.put(`/products/${id}`, data),
  deactivate: (id)     => api.delete(`/products/${id}`),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoryAPI = {
  getAll:  (params) => api.get('/categories', { params }),
  getById: (id)     => api.get(`/categories/${id}`),
  create:  (data)   => api.post('/categories', data),
  update:  (id, data) => api.put(`/categories/${id}`, data),
  remove:  (id)     => api.delete(`/categories/${id}`),
};

// ── Suppliers ─────────────────────────────────────────────────────────────────
export const supplierAPI = {
  getAll:     (params) => api.get('/suppliers', { params }),
  getById:    (id)     => api.get(`/suppliers/${id}`),
  create:     (data)   => api.post('/suppliers', data),
  update:     (id, data) => api.put(`/suppliers/${id}`, data),
  deactivate: (id)     => api.delete(`/suppliers/${id}`),
};

// ── Warehouses ────────────────────────────────────────────────────────────────
export const warehouseAPI = {
  getAll:  (params) => api.get('/warehouses', { params }),
  getById: (id)     => api.get(`/warehouses/${id}`),
  create:  (data)   => api.post('/warehouses', data),
  update:  (id, data) => api.put(`/warehouses/${id}`, data),
};

// ── Stock ─────────────────────────────────────────────────────────────────────
export const stockAPI = {
  getAll:         (params) => api.get('/stock', { params }),
  getByProduct:   (id)     => api.get(`/stock/product/${id}`),
  getByWarehouse: (id, params) => api.get(`/stock/warehouse/${id}`, { params }),
  getLowStock:    ()       => api.get('/stock/alerts/low-stock'),
  getTransactions:(params) => api.get('/stock/transactions', { params }),
  adjust:         (data)   => api.post('/stock/adjust', data),
  transfer:       (data)   => api.post('/stock/transfer', data),
};

// ── Purchase Orders ───────────────────────────────────────────────────────────
export const poAPI = {
  getAll:       (params) => api.get('/purchase-orders', { params }),
  getById:      (id)     => api.get(`/purchase-orders/${id}`),
  create:       (data)   => api.post('/purchase-orders', data),
  submit:       (id)     => api.put(`/purchase-orders/${id}/submit`),
  approve:      (id)     => api.put(`/purchase-orders/${id}/approve`),
  cancel:       (id)     => api.put(`/purchase-orders/${id}/cancel`),
  receiveGoods: (id, data) => api.put(`/purchase-orders/${id}/receive`, data),
};

// ── Customer Orders ───────────────────────────────────────────────────────────
export const orderAPI = {
  getAll:    (params) => api.get('/orders', { params }),
  getById:   (id)     => api.get(`/orders/${id}`),
  create:    (data)   => api.post('/orders', data),
  fulfill:   (id)     => api.put(`/orders/${id}/fulfill`),
  cancel:    (id)     => api.put(`/orders/${id}/cancel`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
};

// ── Customers ─────────────────────────────────────────────────────────────────
export const customerAPI = {
  getAll:  (params) => api.get('/orders/customers', { params }),
  getById: (id)     => api.get(`/orders/customers/${id}`),
  create:  (data)   => api.post('/orders/customers', data),
  update:  (id, data) => api.put(`/orders/customers/${id}`, data),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportAPI = {
  getDashboard:      ()       => api.get('/reports/dashboard'),
  getStockValuation: ()       => api.get('/reports/stock-valuation'),
  getLowStock:       ()       => api.get('/reports/low-stock'),
  getStockMovement:  (params) => api.get('/reports/stock-movement', { params }),
  getPOSummary:      (params) => api.get('/reports/purchase-orders', { params }),
  getSalesSummary:   (params) => api.get('/reports/sales-summary', { params }),
};

// ── Audit Logs ───────────────────────────────────────────────────────────────
export const auditAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
};

// ── Employees ─────────────────────────────────────────────────────────────────
export const employeeAPI = {
  getAll:     (params) => api.get('/employees', { params }),
  getById:    (id)     => api.get(`/employees/${id}`),
  update:     (id, data) => api.put(`/employees/${id}`, data),
  deactivate: (id)     => api.delete(`/employees/${id}`),  resetPassword: (id, newPassword) => api.post(`/employees/${id}/reset-password`, { new_password: newPassword }),};

export default api;
