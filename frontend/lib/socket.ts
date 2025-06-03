'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (token: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  const socketURL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
  
  socket = io(socketURL, {
    auth: {
      token,
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Emergency alert events
export const subscribeToEmergencyAlerts = (callback: (alert: any) => void): void => {
  if (!socket) return;
  
  socket.on('emergency:new-alert', callback);
  socket.on('emergency:alert-update', callback);
  socket.on('emergency:alert-response', callback);
};

export const unsubscribeFromEmergencyAlerts = (): void => {
  if (!socket) return;
  
  socket.off('emergency:new-alert');
  socket.off('emergency:alert-update');
  socket.off('emergency:alert-response');
};

// Notification events
export const subscribeToNotifications = (callback: (notification: any) => void): void => {
  if (!socket) return;
  
  socket.on('notification:new', callback);
  socket.on('notification:update', callback);
};

export const unsubscribeFromNotifications = (): void => {
  if (!socket) return;
  
  socket.off('notification:new');
  socket.off('notification:update');
};

// Grievance events
export const subscribeToGrievanceUpdates = (callback: (update: any) => void): void => {
  if (!socket) return;
  
  socket.on('grievance:status-update', callback);
  socket.on('grievance:new-comment', callback);
  socket.on('grievance:assigned', callback);
};

export const unsubscribeFromGrievanceUpdates = (): void => {
  if (!socket) return;
  
  socket.off('grievance:status-update');
  socket.off('grievance:new-comment');
  socket.off('grievance:assigned');
};

// Welfare application events
export const subscribeToWelfareUpdates = (callback: (update: any) => void): void => {
  if (!socket) return;
  
  socket.on('welfare:application-status', callback);
  socket.on('welfare:new-scheme', callback);
};

export const unsubscribeFromWelfareUpdates = (): void => {
  if (!socket) return;
  
  socket.off('welfare:application-status');
  socket.off('welfare:new-scheme');
};

// Marketplace events
export const subscribeToMarketplaceUpdates = (callback: (update: any) => void): void => {
  if (!socket) return;
  
  socket.on('marketplace:new-inquiry', callback);
  socket.on('marketplace:item-sold', callback);
  socket.on('marketplace:new-item', callback);
};

export const unsubscribeFromMarketplaceUpdates = (): void => {
  if (!socket) return;
  
  socket.off('marketplace:new-inquiry');
  socket.off('marketplace:item-sold');
  socket.off('marketplace:new-item');
};

// Join specific rooms
export const joinRoom = (room: string): void => {
  if (!socket) return;
  socket.emit('join-room', room);
};

export const leaveRoom = (room: string): void => {
  if (!socket) return;
  socket.emit('leave-room', room);
};

// Emit events
export const emitEvent = (event: string, data: any): void => {
  if (!socket) return;
  socket.emit(event, data);
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  subscribeToEmergencyAlerts,
  unsubscribeFromEmergencyAlerts,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  subscribeToGrievanceUpdates,
  unsubscribeFromGrievanceUpdates,
  subscribeToWelfareUpdates,
  unsubscribeFromWelfareUpdates,
  subscribeToMarketplaceUpdates,
  unsubscribeFromMarketplaceUpdates,
  joinRoom,
  leaveRoom,
  emitEvent,
};
