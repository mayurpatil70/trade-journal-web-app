import axios from "axios";

const api = axios.create({
  // Defaults to localhost for development, can be overridden by Vercel environment variables in production
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
