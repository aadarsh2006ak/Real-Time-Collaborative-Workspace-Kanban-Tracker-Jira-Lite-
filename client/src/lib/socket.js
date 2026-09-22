// client/src/lib/socket.js
import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => socket;

const getDefaultApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    return 'https://jira-lite-server.onrender.com';
  }
  return 'http://localhost:5000';
};

export function connectSocket(getToken) {
  if (socket) return socket;

  const rawApiUrl = getDefaultApiUrl();
  const serverUrl = rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
    ? rawApiUrl
    : `https://${rawApiUrl}`;

  socket = io(serverUrl, {
    auth: (cb) => {
      cb({ token: typeof getToken === 'function' ? getToken() : null });
    },
    transports: ['websocket', 'polling'],
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    autoConnect: true,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
