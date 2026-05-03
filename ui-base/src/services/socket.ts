import { io, Socket } from 'socket.io-client';

const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  return apiUrl.replace(/\/api\/v1$/, '').replace(/\/api$/, '') || 'http://localhost:3000';
};

const WS_URL = getBaseUrl();

let socket: Socket | null = null;
let onConnectCallback: (() => void) | null = null;

export const setOnConnectCallback = (cb: () => void) => {
  onConnectCallback = cb;
};

export const getSocket = (): Socket => {
  if (!socket) {
    console.log('Initializing WebSocket connection to:', WS_URL);
    
    socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket?.id);
      onConnectCallback?.();
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      if (reason === 'io server disconnect') {
        socket?.connect();
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed after all attempts');
    });
  }

  return socket;
};

/**
 * Disconnect WebSocket
 */
export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌 Disconnecting WebSocket');
    socket.disconnect();
    socket = null;
  }
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false;
};

