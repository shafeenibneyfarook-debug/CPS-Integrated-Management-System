import api from './api';

export const authService = {
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout')
};
