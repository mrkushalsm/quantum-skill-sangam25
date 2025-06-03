'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  initializeSocket, 
  disconnectSocket, 
  getSocket,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  subscribeToEmergencyAlerts,
  unsubscribeFromEmergencyAlerts
} from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

interface UseRealtimeOptions {
  enableNotifications?: boolean;
  enableEmergencyAlerts?: boolean;
  enableGrievanceUpdates?: boolean;
  enableWelfareUpdates?: boolean;
  enableMarketplaceUpdates?: boolean;
}

export const useRealtime = (options: UseRealtimeOptions = {}) => {
  const { 
    enableNotifications = true,
    enableEmergencyAlerts = true,
    enableGrievanceUpdates = true,
    enableWelfareUpdates = true,
    enableMarketplaceUpdates = true
  } = options;

  const { token, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize socket connection
      const socket = initializeSocket(token);
      socketRef.current = socket;

      // Set up connection event listeners
      socket.on('connect', () => {
        setIsConnected(true);
        console.log('Real-time connection established');
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Real-time connection lost');
      });

      socket.on('connect_error', (error: any) => {
        console.error('Real-time connection error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to establish real-time connection",
          variant: "destructive",
        });
      });

      // Set up feature-specific listeners
      if (enableNotifications) {
        subscribeToNotifications((notification) => {
          setNotifications(prev => [notification, ...prev.slice(0, 49)]);
          
          // Show toast for important notifications
          if (notification.type === 'urgent' || notification.priority === 'high') {
            toast({
              title: notification.title,
              description: notification.message,
              variant: notification.type === 'error' ? 'destructive' : 'default',
            });
          }
        });
      }

      if (enableEmergencyAlerts) {
        subscribeToEmergencyAlerts((alert) => {
          setEmergencyAlerts(prev => [alert, ...prev.slice(0, 19)]);
          
          // Show urgent toast for emergency alerts
          toast({
            title: `🚨 Emergency Alert - ${alert.severity?.toUpperCase()}`,
            description: alert.title || alert.description,
            variant: "destructive",
          });

          // Play notification sound for critical alerts
          if (alert.severity === 'critical' && 'Notification' in window) {
            new Notification(`Emergency Alert - ${alert.title}`, {
              body: alert.description,
              icon: '/emergency-icon.png',
              requireInteraction: true,
            });
          }
        });
      }

      return () => {
        // Clean up subscriptions
        if (enableNotifications) {
          unsubscribeFromNotifications();
        }
        if (enableEmergencyAlerts) {
          unsubscribeFromEmergencyAlerts();
        }
        
        // Disconnect socket
        disconnectSocket();
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, token, enableNotifications, enableEmergencyAlerts, toast]);

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const emitEvent = (event: string, data: any) => {
    const socket = getSocket();
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const clearEmergencyAlerts = () => {
    setEmergencyAlerts([]);
  };

  return {
    isConnected,
    notifications,
    emergencyAlerts,
    emitEvent,
    markNotificationAsRead,
    clearNotifications,
    clearEmergencyAlerts,
    socket: socketRef.current,
  };
};

export default useRealtime;
