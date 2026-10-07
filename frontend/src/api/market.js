import api from './axios';

export const marketApi = {
  symbols: (params) => api.get('/api/market/symbols', { params }).then((r) => r.data),
  candles: (params) => api.get('/api/market/candles', { params, timeout: 45000 }).then((r) => r.data),
};
