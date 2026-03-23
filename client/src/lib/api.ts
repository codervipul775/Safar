import axios from "axios";

const API_BASE_URL = "http://localhost:5001/api"; // Matches the server .env PORT

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add Auth token to every request
api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem("safar_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
