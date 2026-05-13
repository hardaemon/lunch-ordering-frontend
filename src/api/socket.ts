import { io, Socket } from 'socket.io-client';
import { tokenStorage } from '../auth/storage';

// socket.io без /api
const SOCKET_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/api\/?$/, '');

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (socket && socket.connected) return socket;

  const token = await tokenStorage.get();
  if (!token) throw new Error('No auth token');

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}