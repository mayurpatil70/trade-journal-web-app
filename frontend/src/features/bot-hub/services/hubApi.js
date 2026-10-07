import api from "../../../api/axios";

const base = "/api/bot-hub";
const data = (r) => r.data;

export { errorMessage } from "../../trading-bot/services/binanceApi";

export const hubApi = {
  connections: () => api.get(`${base}/connections`).then(data),
  saveConnection: (exchange, body) => api.put(`${base}/connections/${exchange}`, body).then(data),
  removeConnection: (exchange) => api.delete(`${base}/connections/${exchange}`).then(data),
  testConnection: (exchange) => api.post(`${base}/connections/${exchange}/test`).then(data),
  setLive: (exchange, enabled, confirm) => api.post(`${base}/connections/${exchange}/live`, { enabled, confirm }).then(data),
  status: () => api.get(`${base}/status`).then(data),
  configs: () => api.get(`${base}/configs`).then((r) => r.data.data),
  createConfig: (body) => api.post(`${base}/setup`, body).then(data),
  toggle: (id, active) => api.post(`${base}/configs/${id}/toggle`, { active }).then(data),
  remove: (id) => api.delete(`${base}/configs/${id}`).then(data),
  orders: (params) => api.get(`${base}/orders`, { params }).then(data),
  logs: (params) => api.get(`${base}/logs`, { params }).then(data),
  mt5Status: () => api.get(`${base}/mt5/status`).then(data),
  mt5Token: () => api.post(`${base}/mt5/token`).then(data),
  mt5Revoke: () => api.delete(`${base}/mt5/token`).then(data),
  mt5Settings: (body) => api.put(`${base}/mt5/settings`, body).then(data),
  mt5Signals: (params) => api.get(`${base}/mt5/signals`, { params }).then(data),
  mt5Decide: (id, action) => api.post(`${base}/mt5/signals/${id}/${action}`).then(data),
};
