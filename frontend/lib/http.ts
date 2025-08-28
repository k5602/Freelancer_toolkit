import axios from 'axios';

const baseURL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export const http = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.detail || error?.message || 'Request failed';
    return Promise.reject(message);
  }
);
