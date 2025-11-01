import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Gets or creates a socket connection to the server.
 * For single-service deployment: uses window.location.origin if REACT_APP_SERVER_URL not set.
 * For separate services: uses REACT_APP_SERVER_URL or localhost in development.
 */
export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  
  // Determine server URL:
  // 1. Use REACT_APP_SERVER_URL if set (explicit override)
  // 2. In development, use localhost:5001
  // 3. In production without REACT_APP_SERVER_URL, use same origin (single-service deployment)
  let serverUrl: string | null = null;
  
  if (process.env.REACT_APP_SERVER_URL) {
    serverUrl = process.env.REACT_APP_SERVER_URL;
  } else if (process.env.NODE_ENV === 'development') {
    serverUrl = 'http://localhost:5001';
  } else {
    // Production single-service deployment: use same origin
    serverUrl = window.location.origin;
  }

  if (!serverUrl) {
    console.error('[SOCKET] ERROR: Could not determine server URL!');
    throw new Error('Socket server URL could not be determined');
  }

  console.log('[SOCKET] Initializing connection to:', serverUrl);
  console.log('[SOCKET] Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_SERVER_URL: process.env.REACT_APP_SERVER_URL || '(not set, using same origin)',
    windowOrigin: window.location.origin,
    deploymentType: process.env.REACT_APP_SERVER_URL ? 'separate-services' : 'single-service'
  });
  
  // Create new socket connection
  // Client automatically matches server pingInterval/pingTimeout
  socket = io(serverUrl, {
    transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000, // 20 second connection timeout
  });

  // Comprehensive logging for debugging
  socket.on('connect', () => {
    const transport = socket?.io?.engine?.transport?.name || 'unknown';
    console.log('[SOCKET] ✅ Connected successfully');
    console.log('[SOCKET]   Server URL:', serverUrl);
    console.log('[SOCKET]   Socket ID:', socket?.id);
    console.log('[SOCKET]   Transport:', transport);
    
    // Log transport upgrade when it happens
    if (socket?.io?.engine) {
      socket.io.engine.on('upgrade', () => {
        const newTransport = socket?.io?.engine?.transport?.name || 'unknown';
        console.log('[SOCKET] 🔄 Transport upgraded to:', newTransport);
      });
    }
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


