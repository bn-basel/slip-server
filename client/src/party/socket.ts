import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Gets or creates a socket connection to the server.
 * Uses REACT_APP_SERVER_URL in production, falls back to current origin.
 */
export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  
  // Get server URL from environment or use current origin
  const url = process.env.REACT_APP_SERVER_URL || window.location.origin;
  
  // Create new socket connection
  socket = io(url, {
    transports: ['websocket', 'polling'], // Allow fallback to polling if websocket fails
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Log connection events for debugging
  socket.on('connect', () => {
    console.log('[SOCKET] Connected to server:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET] Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[SOCKET] Connection error:', error);
  });

  return socket;
}

/**
 * Disconnects the socket and cleans up the connection.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}


