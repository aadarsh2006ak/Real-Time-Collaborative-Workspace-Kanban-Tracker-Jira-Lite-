// client/src/lib/api.js
import axios from 'axios';
import { getSocket } from './socket';

let store;

export const injectStore = (s) => {
  store = s;
};

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')) {
        const raw = import.meta.env.VITE_API_URL;
        const norm = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
        return `${norm.replace(/\/$/, '')}/api/v1`;
      }
      return 'https://jira-lite-server.onrender.com/api/v1';
    }
  }
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const norm = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  return `${norm.replace(/\/$/, '')}/api/v1`;
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

// Request Interceptor: Attach Bearer JWT, x-socket-id, and dynamically ensure runtime baseURL
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();

  const token = store?.getState()?.auth?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const socketId = getSocket()?.id;
  if (socketId) {
    config.headers['x-socket-id'] = socketId; // Prevents echo broadcast to sender
  }

  return config;
});

// Response Interceptor: Silent Token Refresh Queue
let refreshingPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const errorCode = error.response?.data?.error?.code;

    // Handle token expired scenario with request retry queue
    if (error.response?.status === 401 && errorCode === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        refreshingPromise ??= axios
          .post(`${getApiBaseUrl()}/auth/refresh`, null, { withCredentials: true })
          .then((res) => {
            const newAccessToken = res.data.data.accessToken;
            store?.dispatch({ type: 'auth/tokenRefreshed', payload: newAccessToken });
            return newAccessToken;
          })
          .catch((refreshErr) => {
            store?.dispatch({ type: 'auth/loggedOut' });
            throw refreshErr;
          })
          .finally(() => {
            refreshingPromise = null;
          });

        const newAccessToken = await refreshingPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
