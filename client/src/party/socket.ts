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

  // Log resolved URL and environment variables
  console.log('[SOCKET] ========== Socket Connection Initialization ==========');
  console.log('[SOCKET] Resolved server URL:', serverUrl);
  console.log('[SOCKET] Environment variables:', {
    NODE_ENV: process.env.NODE_ENV || '(not set)',
    REACT_APP_SERVER_URL: process.env.REACT_APP_SERVER_URL || '(not set, using same origin)',
    windowOrigin: window.location.origin,
    protocol: window.location.protocol,
    deploymentType: process.env.REACT_APP_SERVER_URL ? 'separate-services' : 'single-service'
  });
  console.log('[SOCKET] ========================================================');
  
  // Create new socket connection
  // IMPORTANT: Start with polling, then upgrade to websocket
  // This ensures reliable connection on Render where websocket upgrade might fail
  socket = io(serverUrl, {
    transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000, // 20 second connection timeout
    // Don't force upgrade - let Socket.IO handle it naturally
    upgrade: true,
  });

  // Comprehensive logging for connection lifecycle
  socket.on('connect', () => {
    const transport = socket?.io?.engine?.transport?.name || 'unknown';
    console.log('[SOCKET] ✅ ========== CONNECTED ==========');
    console.log('[SOCKET]   Server URL:', serverUrl);
    console.log('[SOCKET]   Socket ID:', socket?.id);
    console.log('[SOCKET]   Current transport:', transport);
    console.log('[SOCKET]   Connection state: connected');
    console.log('[SOCKET] ====================================');
    
    // Monitor transport upgrades
    if (socket?.io?.engine) {
      socket.io.engine.on('upgrade', () => {
        const newTransport = socket?.io?.engine?.transport?.name || 'unknown';
        console.log('[SOCKET] 🔄 ========== TRANSPORT UPGRADE ==========');
        console.log('[SOCKET]   Upgraded from polling to:', newTransport);
        console.log('[SOCKET]   Socket ID:', socket?.id);
        console.log('[SOCKET] ===========================================');
      });
      
      socket.io.engine.on('upgradeError', (error) => {
        console.warn('[SOCKET] ⚠️ Transport upgrade failed, staying on polling');
        console.warn('[SOCKET]   Error:', error.message || error);
        console.warn('[SOCKET]   This is OK - polling will continue to work');
      });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET] ❌ Disconnected. Reason:', reason);
    console.log('[SOCKET] Will attempt to reconnect...');
  });

  socket.on('connect_error', (error: Error & { type?: string; description?: string; context?: any }) => {
    console.error('[SOCKET] ❌ ========== CONNECTION ERROR ==========');
    console.error('[SOCKET]   Error message:', error.message || 'Unknown error');
    console.error('[SOCKET]   Error type:', error.type || 'unknown');
    console.error('[SOCKET]   Server URL:', serverUrl);
    console.error('[SOCKET]   Description:', error.description || 'none');
    console.error('[SOCKET]   Context:', error.context || 'none');
    console.error('[SOCKET]   Full error:', error);
    console.error('[SOCKET] =========================================');
    console.error('[SOCKET] ⚠️ Socket.IO will attempt to reconnect...');
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('[SOCKET] 🔄 Reconnected after', attemptNumber, 'attempt(s)');
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('[SOCKET] 🔄 Reconnection attempt', attemptNumber, '/ 10');
  });

  socket.on('reconnect_error', (error) => {
    console.error('[SOCKET] ❌ Reconnection error on attempt:', error.message);
  });

  socket.on('reconnect_failed', () => {
    console.error('[SOCKET] ❌ ========== RECONNECTION FAILED ==========');
    console.error('[SOCKET]   All 10 reconnection attempts exhausted');
    console.error('[SOCKET]   Please refresh the page');
    console.error('[SOCKET] ============================================');
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


