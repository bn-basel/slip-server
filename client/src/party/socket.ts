import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket && socket.connected) return socket;
  const url = process.env.REACT_APP_SERVER_URL || window.location.origin;
  socket = io(url, {
    transports: ['websocket'],
    withCredentials: true,
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


