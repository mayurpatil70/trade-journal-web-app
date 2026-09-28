import axios from "axios";

const api = axios.create({
  // Automatically switches between localhost for development and your live backend URL in production
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

export default api;
