import axios from 'axios';
import { useAuthStore } from '../../stores/authStore';

const normalizeBaseUrl = (value?: string) => {
  if (!value) return '';
  if (value === '/api') return '';
  return value.replace(/\/api\/?$/, '');
};

const apiClient = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_URL) || '',
  timeout: 30000, // 30 seconds - increased for Fastify v5
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  // Prevent axios from aborting requests prematurely
  validateStatus: (status) => status < 500,
});

apiClient.interceptors.request.use((config) => {
  // Session auth is handled via cookies (withCredentials: true)
  // Only add Authorization header for API keys (catalyst_ prefix)
  const token = useAuthStore.getState().token;
  if (token && token.startsWith('catalyst_')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const code = error.response?.data?.code;
      if (code !== 'TWO_FACTOR_REQUIRED') {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
