import api from './api';

export const supplierService = {
  list(params = {}) {
    return api.get('/suppliers', { params });
  },
  get(id) {
    return api.get(`/suppliers/${id}`);
  },
  create(data) {
    return api.post('/suppliers', data);
  },
  update(id, data) {
    return api.put(`/suppliers/${id}`, data);
  },
  delete(id) {
    return api.delete(`/suppliers/${id}`);
  },
  getStats() {
    return api.get('/suppliers/stats/summary');
  }
};
