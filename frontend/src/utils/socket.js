import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const joinSession = (sessionId) => {
  socket.emit('join-session', sessionId);
};

export const leaveSession = (sessionId) => {
  socket.emit('leave-session', sessionId);
};

export const updateCode = (sessionId, code, userId) => {
  socket.emit('code-update', { sessionId, code, userId });
};

// Listen for code updates
export const onCodeUpdate = (callback) => {
  socket.on('code-updated', callback);
};

// Listen for user join events
export const onUserJoined = (callback) => {
  socket.on('user-joined', callback);
};

// Listen for user leave events
export const onUserLeft = (callback) => {
  socket.on('user-left', callback);
};

// Clean up listeners
export const cleanupSocketListeners = () => {
  socket.off('code-updated');
  socket.off('user-joined');
  socket.off('user-left');
};
