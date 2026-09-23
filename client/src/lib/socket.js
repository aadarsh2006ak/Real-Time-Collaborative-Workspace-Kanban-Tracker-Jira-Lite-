// client/src/lib/socket.js
import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => socket;

export const getSocketServerUrl = () => {
  let raw = import.meta.env.VITE_API_URL;

  // Resolve Render private hostname or missing/local hostname in browser
  if (
    !raw ||
    raw === 'jira-lite-server' ||
    raw === 'http://jira-lite-server' ||
    raw === 'https://jira-lite-server' ||
    (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com') && raw.includes('localhost'))
  ) {
    if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
      raw = 'https://jira-lite-server.onrender.com';
    } else {
      raw = raw || 'http://localhost:5000';
    }
  }

  // Ensure public FQDN if on onrender.com
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    if (!raw.includes('.onrender.com') && !raw.includes('.')) {
      raw = `https://${raw.replace(/^https?:\/\//, '').replace(/\/$/, '')}.onrender.com`;
    }
  }

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
