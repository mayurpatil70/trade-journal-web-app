import api from "../../../api/axios";

export const botApi = {
  status: () => api.get("/api/bot/status").then((r) => r.data),
  configs: () => api.get("/api/bot/configs").then((r) => r.data.data),
  createConfig: (body) => api.post("/api/bot/setup", body).then((r) => r.data.data),
  toggle: (id, active) => api.post(`/api/bot/configs/${id}/toggle`, { active }).then((r) => r.data),
  remove: (id) => api.delete(`/api/bot/configs/${id}`).then((r) => r.data),
  orders: (params) => api.get("/api/bot/orders", { params }).then((r) => r.data),
  logs: (params) => api.get("/api/bot/logs", { params }).then((r) => r.data),
};

export const errorMessage = (err) => {
  const d = err?.response?.data;
  if (d?.details?.length) return d.details.join(". ");
  return d?.error || err?.message || "Request failed";
};
