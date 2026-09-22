// client/src/lib/api.js
import axios from 'axios';
import { getSocket } from './socket';

let store;

export const injectStore = (s) => {
  store = s;
};

const getDefaultApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://jira-lite-server.onrender.com';
  }
  return 'http://localhost:5000';
};

const rawApiUrl = getDefaultApiUrl();
const normalizedApiUrl = rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
  ? rawApiUrl
  : `https://${rawApiUrl}`;

const baseURL = `${normalizedApiUrl.replace(/\/$/, '')}/api/v1`;

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Request Interceptor: Attach Bearer JWT and x-socket-id
api.interceptors.request.use((config) => {
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
          .post(`${baseURL}/auth/refresh`, null, { withCredentials: true })
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

        const newToken = await refreshingPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
