import api from './api';

// Auth APIs
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data)
};

// Dashboard APIs
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getActivities: () => api.get('/dashboard/activities'),
  getUpcomingPayments: () => api.get('/dashboard/upcoming-payments'),
  getLowUptimeSites: () => api.get('/dashboard/low-uptime-sites')
};

// Customer APIs
export const customerService = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`)
};

// Site APIs
export const siteService = {
  getAll: () => api.get('/sites'),
  getById: (id) => api.get(`/sites/${id}`),
  create: (data) => api.post('/sites', data),
  update: (id, data) => api.put(`/sites/${id}`, data),
  delete: (id) => api.delete(`/sites/${id}`),
  suspend: (id, reason) => api.post(`/sites/${id}/suspend`, { reason }),
  reactivate: (id) => api.post(`/sites/${id}/reactivate`),
  createReactivationPayment: (id) => api.post(`/sites/${id}/create-reactivation-payment`),
  getUptime: (id, hours) => api.get(`/sites/${id}/uptime?hours=${hours || 24}`),
  getPayments: (id) => api.get(`/sites/${id}/payments`),
  getPendingPayment: (id) => api.get(`/sites/${id}/pending-payment`)
};

// Payment APIs
export const paymentService = {
  getAll: (status) => api.get('/payments', { params: { status } }),
  getById: (id) => api.get(`/payments/${id}`),
  uploadProof: (id, formData) => api.post(`/payments/${id}/upload-proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  verify: (id, notes) => api.post(`/payments/${id}/verify`, { notes }),
  markPaid: (id, notes) => api.post(`/payments/${id}/mark-paid`, { notes })
};

export default {
  authService,
  dashboardService,
  customerService,
  siteService,
  paymentService
};
