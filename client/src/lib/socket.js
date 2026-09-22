// client/src/lib/socket.js
import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => socket;

export function connectSocket(getToken) {
  if (socket) return socket;

  const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
