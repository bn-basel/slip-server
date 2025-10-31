import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Gets or creates a socket connection to the server.
 * Uses REACT_APP_SERVER_URL in production, localhost in development.
 */
export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  
  // Get server URL from environment variable (REQUIRED in production)
  // In development, fallback to localhost:5001
  const serverUrl = process.env.REACT_APP_SERVER_URL || 
    (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : null);
  
  if (!serverUrl) {
    console.error('[SOCKET] ERROR: REACT_APP_SERVER_URL environment variable is not set!');
    throw new Error('REACT_APP_SERVER_URL is required for socket connection');
  }

  console.log('[SOCKET] Initializing connection to:', serverUrl);
  console.log('[SOCKET] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_SERVER_URL: process.env.REACT_APP_SERVER_URL,
    windowOrigin: window.location.origin
  });
  
  // Create new socket connection
  socket = io(serverUrl, {
    transports: ['websocket', 'polling'], // Allow fallback to polling if websocket fails
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000, // 20 second connection timeout
  });

  // Comprehensive logging for debugging
  socket.on('connect', () => {
    console.log('[SOCKET] ✅ Connected successfully to:', serverUrl);
    console.log('[SOCKET] Socket ID:', socket?.id);
    console.log('[SOCKET] Transport:', socket?.io?.engine?.transport?.name || 'unknown');
  });

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET] ❌ Disconnected. Reason:', reason);
    console.log('[SOCKET] Will attempt to reconnect...');
  });

  socket.on('connect_error', (error: Error & { type?: string; description?: string; context?: any }) => {
    console.error('[SOCKET] ❌ Connection error:', error.message || 'Unknown error');
    console.error('[SOCKET] Error details:', {
      type: error.type || 'unknown',
      description: error.description || 'none',
      context: error.context || 'none',
      serverUrl: serverUrl,
      error: error
    });
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('[SOCKET] 🔄 Reconnected after', attemptNumber, 'attempt(s)');
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('[SOCKET] 🔄 Reconnection attempt', attemptNumber);
  });

  socket.on('reconnect_error', (error) => {
    console.error('[SOCKET] ❌ Reconnection error:', error.message);
  });

  socket.on('reconnect_failed', () => {
    console.error('[SOCKET] ❌ Reconnection failed after all attempts');
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


