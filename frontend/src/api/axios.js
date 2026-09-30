import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
  timeout: 15000, // 15s timeout to prevent infinite hanging loaders
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to handle timeouts and network issues gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      console.warn("API request timed out. Please verify backend connection.");
    }
    return Promise.reject(error);
  }
);

export default api;
