// client/src/lib/socket.js
import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => socket;

export const getSocketServerUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')) {
        const raw = import.meta.env.VITE_API_URL;
        return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
      }
      return 'https://jira-lite-server.onrender.com';
    }
  }
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
};

export function connectSocket(getToken) {
  if (socket) return socket;

  const serverUrl = getSocketServerUrl();

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
