import axios from 'axios';
import { config } from '@/constants/config';
import { useAuthStore } from '@/store/authStore';

const REQUEST_TIMEOUT_MS = 15000;

export const api = axios.create({
  baseURL: `${config.apiUrl}/api/v1`,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Use token from Zustand store only (no SecureStore/AsyncStorage here).
// Avoids native module errors in Expo Go. Token is set on login/register.
api.interceptors.request.use((axiosConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    axiosConfig.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== 'undefined' && axiosConfig.data instanceof FormData) {
    delete axiosConfig.headers['Content-Type'];
  }
  return axiosConfig;
});

// Auto-logout on 401 Unauthorized to clear stale/expired tokens.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 401
    ) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

