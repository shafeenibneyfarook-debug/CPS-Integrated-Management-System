import api from './api';

export const projectService = {
  list(params = {}) {
    return api.get('/projects', { params });
  },
  get(id) {
    return api.get(`/projects/${id}`);
  },
  create(data) {
    return api.post('/projects', data);
  },
  update(id, data) {
    return api.put(`/projects/${id}`, data);
  },
  delete(id) {
    return api.delete(`/projects/${id}`);
  }
};
