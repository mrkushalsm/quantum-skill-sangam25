// Unit Tests for Socket Utility
const {
  initializeSocket,
  emitToUser,
  emitToRoom,
  emitEmergencyAlert,
  emitNotification,
  emitApplicationUpdate,
  emitGrievanceUpdate,
  emitMarketplaceUpdate,
  broadcastSystemAnnouncement,
  getConnectedUsers,
  getUserSocketId
} = require('../../../utils/socket');

describe('Socket Utility', () => {
  let mockSocket;
  let mockIo;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock socket instance
    mockSocket = {
      id: 'socket123',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      broadcast: jest.fn().mockReturnThis(),
      on: jest.fn()
    };

    // Mock socket.io instance
    mockIo = {
      on: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      sockets: {
        sockets: new Map()
      }
    };

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initializeSocket', () => {
    it('should initialize socket.io with connection handler', () => {
      initializeSocket(mockIo);

      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should set up socket event handlers on connection', () => {
      mockIo.on.mockImplementation((event, callback) => {
        if (event === 'connection') {
          callback(mockSocket);
        }
      });

      initializeSocket(mockIo);

      expect(console.log).toHaveBeenCalledWith('User connected: socket123');
      expect(mockSocket.on).toHaveBeenCalledWith('join_user_room', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('emergency_ack', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('location_update', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('send_message', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('join_room', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('leave_room', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });
  });

  describe('Socket Event Handlers', () => {
    beforeEach(() => {
      mockIo.on.mockImplementation((event, callback) => {
        if (event === 'connection') {
          callback(mockSocket);
        }
      });
      initializeSocket(mockIo);
    });

    it('should handle join_user_room event', () => {
      const joinHandler = mockSocket.on.mock.calls.find(call => call[0] === 'join_user_room')[1];
      
      joinHandler('user123');

      expect(mockSocket.join).toHaveBeenCalledWith('user_user123');
      expect(console.log).toHaveBeenCalledWith('User user123 joined their room');
    });

    it('should handle emergency_ack event', () => {
      const ackHandler = mockSocket.on.mock.calls.find(call => call[0] === 'emergency_ack')[1];
      
      const ackData = {
        alertId: 'alert123',
        userId: 'user123',
        response: 'acknowledged'
      };

      ackHandler(ackData);

      expect(mockSocket.to).toHaveBeenCalledWith('alert_alert123');
      expect(mockSocket.emit).toHaveBeenCalledWith('emergency_ack_received', {
        userId: 'user123',
        response: 'acknowledged',
        timestamp: expect.any(Date)
      });
    });

    it('should handle location_update event', () => {
      const locationHandler = mockSocket.on.mock.calls.find(call => call[0] === 'location_update')[1];
      
      const locationData = {
        alertId: 'alert123',
        userId: 'user123',
        location: { lat: 12.345, lng: 67.890 }
      };

      locationHandler(locationData);

      expect(mockSocket.to).toHaveBeenCalledWith('alert_alert123');
      expect(mockSocket.emit).toHaveBeenCalledWith('responder_location_update', {
        userId: 'user123',
        location: { lat: 12.345, lng: 67.890 },
        timestamp: expect.any(Date)
      });
    });

    it('should handle send_message event', () => {
      const messageHandler = mockSocket.on.mock.calls.find(call => call[0] === 'send_message')[1];
      
      const messageData = {
        conversationId: 'conv123',
        message: 'Hello there',
        senderId: 'user123',
        recipientId: 'user456'
      };

      messageHandler(messageData);

      expect(mockSocket.to).toHaveBeenCalledWith('user_user456');
      expect(mockSocket.emit).toHaveBeenCalledWith('new_message', {
        conversationId: 'conv123',
        message: 'Hello there',
        senderId: 'user123',
        timestamp: expect.any(Date)
      });
    });

    it('should handle join_room event', () => {
      const joinRoomHandler = mockSocket.on.mock.calls.find(call => call[0] === 'join_room')[1];
      
      joinRoomHandler('emergency_room');

      expect(mockSocket.join).toHaveBeenCalledWith('emergency_room');
      expect(console.log).toHaveBeenCalledWith('User socket123 joined room: emergency_room');
    });

    it('should handle leave_room event', () => {
      const leaveRoomHandler = mockSocket.on.mock.calls.find(call => call[0] === 'leave_room')[1];
      
      leaveRoomHandler('emergency_room');

      expect(mockSocket.leave).toHaveBeenCalledWith('emergency_room');
      expect(console.log).toHaveBeenCalledWith('User socket123 left room: emergency_room');
    });

    it('should handle disconnect event', () => {
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1];
      
      disconnectHandler();

      expect(console.log).toHaveBeenCalledWith('User disconnected: socket123');
    });
  });

  describe('emitToUser', () => {
    beforeEach(() => {
      initializeSocket(mockIo);
    });

    it('should emit event to specific user', () => {
      emitToUser('user123', 'test_event', { message: 'Hello' });

      expect(mockIo.to).toHaveBeenCalledWith('user_user123');
      expect(mockIo.emit).toHaveBeenCalledWith('test_event', { message: 'Hello' });
    });

    it('should handle missing io instance', () => {
      // Reset the socket utility to simulate uninitialized state
      const socketUtils = require('../../../utils/socket');
      socketUtils.io = null;

      emitToUser('user123', 'test_event', { message: 'Hello' });

      expect(console.error).toHaveBeenCalledWith('Socket.io not initialized');
    });
  });

  describe('emitToRoom', () => {
    beforeEach(() => {
      initializeSocket(mockIo);
    });

    it('should emit event to specific room', () => {
      emitToRoom('emergency_room', 'alert_update', { alertId: 'alert123' });

      expect(mockIo.to).toHaveBeenCalledWith('emergency_room');
      expect(mockIo.emit).toHaveBeenCalledWith('alert_update', { alertId: 'alert123' });
    });
  });

  describe('emitEmergencyAlert', () => {
    beforeEach(() => {
      initializeSocket(mockIo);
    });

    it('should emit emergency alert to all users', () => {
      const alertData = {
        alertId: 'alert123',
        title: 'Emergency Alert',
        severity: 'high',
        location: 'Base Camp'
      };

      emitEmergencyAlert(alertData);

      expect(mockIo.emit).toHaveBeenCalledWith('emergency_alert', {
        alertId: 'alert123',
        title: 'Emergency Alert',
        severity: 'high',
        location: 'Base Camp',
        timestamp: expect.any(Date)
      });
    });

    it('should emit to specific users if provided', () => {
      const alertData = {
        alertId: 'alert123',
        title: 'Emergency Alert',
        severity: 'high',
        location: 'Base Camp'
      };

      emitEmergencyAlert(alertData, ['user1', 'user2']);

      expect(mockIo.to).toHaveBeenCalledWith('user_user1');
      expect(mockIo.to).toHaveBeenCalledWith('user_user2');
      expect(mockIo.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('emitNotification', () => {
    beforeEach(() => {
      initializeSocket(mockIo);
    });

    it('should emit notification to specific user', () => {
      const notificationData = {
        id: 'notif123',
        title: 'New Message',
        message: 'You have a new message',
        type: 'info'
      };

      emitNotification('user123', notificationData);

      expect(mockIo.to).toHaveBeenCalledWith('user_user123');
      expect(mockIo.emit).toHaveBeenCalledWith('notification', {
        id: 'notif123',
        title: 'New Message',
        message: 'You have a new message',
        type: 'info',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('emitApplicationUpdate', () => {
    beforeEach(() => {
      initializeSocket(mockIo);
    });

    it('should emit application update to user', () => {
      const updateData = {
        applicationId: 'app123',
        status: 'approved',
        schemeName: 'Education Grant'
      };

      emitApplicationUpdate('user123', updateData);

      expect(mockIo.to).toHaveBeenCalledWith('user_user123');
      expect(mockIo.emit).toHaveBeenCalledWith('application_update', {
        applicationId: 'app123',
        status: 'approved',
        schemeName: 'Education Grant',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('emitGrievanceUpdate', () => {
    beforeEach(() => {
      initializeSocket(mockIo);
    });

    it('should emit grievance update to user', () => {
      const updateData = {
        grievanceId: 'grief123',
        status: 'resolved',
        comments: 'Issue has been resolved'
      };

      emitGrievanceUpdate('user123', updateData);

      expect(mockIo.to).toHaveBeenCalledWith('user_user123');
      expect(mockIo.emit).toHaveBeenCalledWith('grievance_update', {
        grievanceId: 'grief123',
        status: 'resolved',
        comments: 'Issue has been resolved',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('emitMarketplaceUpdate', () => {
    beforeEach(() => {
      initializeSocket(mockIo);
    });

    it('should emit marketplace update', () => {
      const updateData = {
        itemId: 'item123',
        action: 'new_listing',
        title: 'Used Laptop'
      };

      emitMarketplaceUpdate(updateData);

      expect(mockIo.emit).toHaveBeenCalledWith('marketplace_update', {
        itemId: 'item123',
        action: 'new_listing',
        title: 'Used Laptop',
        timestamp: expect.any(Date)
      });
    });

    it('should emit to specific users if provided', () => {
      const updateData = {
        itemId: 'item123',
        action: 'interest_expressed',
        title: 'Used Laptop'
      };

      emitMarketplaceUpdate(updateData, ['user1']);

      expect(mockIo.to).toHaveBeenCalledWith('user_user1');
      expect(mockIo.emit).toHaveBeenCalledWith('marketplace_update', {
        itemId: 'item123',
        action: 'interest_expressed',
        title: 'Used Laptop',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('broadcastSystemAnnouncement', () => {
    beforeEach(() => {
      initializeSocket(mockIo);
    });

    it('should broadcast system announcement to all users', () => {
      const announcement = {
        title: 'System Maintenance',
        message: 'System will be down for maintenance',
        priority: 'high'
      };

      broadcastSystemAnnouncement(announcement);

      expect(mockIo.emit).toHaveBeenCalledWith('system_announcement', {
        title: 'System Maintenance',
        message: 'System will be down for maintenance',
        priority: 'high',
        timestamp: expect.any(Date)
      });
    });
  });

  describe('getConnectedUsers', () => {
    beforeEach(() => {
      initializeSocket(mockIo);
    });

    it('should return list of connected users', () => {
      // Mock connected sockets
      const mockSockets = new Map([
        ['socket1', { userId: 'user1' }],
        ['socket2', { userId: 'user2' }],
        ['socket3', { userId: 'user1' }] // Same user with multiple connections
      ]);

      mockIo.sockets.sockets = mockSockets;

      const connectedUsers = getConnectedUsers();

      expect(connectedUsers).toEqual(['user1', 'user2']);
    });

    it('should return empty array when no users connected', () => {
      mockIo.sockets.sockets = new Map();

      const connectedUsers = getConnectedUsers();

      expect(connectedUsers).toEqual([]);
    });
  });

  describe('getUserSocketId', () => {
    beforeEach(() => {
      initializeSocket(mockIo);
    });

    it('should return socket ID for connected user', () => {
      const mockSockets = new Map([
        ['socket1', { userId: 'user1' }],
        ['socket2', { userId: 'user2' }]
      ]);

      mockIo.sockets.sockets = mockSockets;

      const socketId = getUserSocketId('user1');

      expect(socketId).toBe('socket1');
    });

    it('should return null for non-connected user', () => {
      const mockSockets = new Map([
        ['socket1', { userId: 'user1' }]
      ]);

      mockIo.sockets.sockets = mockSockets;

      const socketId = getUserSocketId('user999');

      expect(socketId).toBeNull();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      initializeSocket(mockIo);
    });

    it('should handle errors in event handlers gracefully', () => {
      mockSocket.to.mockImplementation(() => {
        throw new Error('Socket error');
      });

      expect(() => {
        emitToUser('user123', 'test_event', { data: 'test' });
      }).not.toThrow();

      expect(console.error).toHaveBeenCalledWith('Socket error:', expect.any(Error));
    });

    it('should handle missing event data gracefully', () => {
      const messageHandler = mockSocket.on.mock.calls.find(call => call[0] === 'send_message')[1];
      
      // Call with incomplete data
      messageHandler({
        conversationId: 'conv123',
        message: 'Hello'
        // Missing senderId and recipientId
      });

      // Should not crash, but also shouldn't emit
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });
});
