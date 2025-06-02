let io = null;

/**
 * Initialize Socket.io instance
 * @param {Object} socketIO - Socket.io server instance
 */
const initializeSocket = (socketIO) => {
  io = socketIO;
  
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Join user to their personal room for targeted notifications
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    });
    
    // Handle emergency alert acknowledgment
    socket.on('emergency_ack', (data) => {
      const { alertId, userId, response } = data;
      // Broadcast acknowledgment to alert creator and response team
      socket.to(`alert_${alertId}`).emit('emergency_ack_received', {
        userId,
        response,
        timestamp: new Date()
      });
    });
    
    // Handle location updates for emergency response
    socket.on('location_update', (data) => {
      const { alertId, userId, location } = data;
      // Broadcast location update to alert creator and response team
      socket.to(`alert_${alertId}`).emit('responder_location_update', {
        userId,
        location,
        timestamp: new Date()
      });
    });
    
    // Handle real-time messaging
    socket.on('send_message', (data) => {
      const { conversationId, message, senderId, recipientId } = data;
      
      // Send message to recipient
      socket.to(`user_${recipientId}`).emit('new_message', {
        conversationId,
        message,
        senderId,
        timestamp: new Date()
      });
    });
    
    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { conversationId, userId, recipientId } = data;
      socket.to(`user_${recipientId}`).emit('user_typing', {
        conversationId,
        userId
      });
    });
    
    socket.on('typing_stop', (data) => {
      const { conversationId, userId, recipientId } = data;
      socket.to(`user_${recipientId}`).emit('user_stopped_typing', {
        conversationId,
        userId
      });
    });
    
    // Handle marketplace item updates
    socket.on('item_inquiry', (data) => {
      const { itemId, sellerId, buyerId, inquiry } = data;
      // Notify seller of new inquiry
      socket.to(`user_${sellerId}`).emit('new_item_inquiry', {
        itemId,
        buyerId,
        inquiry,
        timestamp: new Date()
      });
    });
    
    // Handle grievance updates
    socket.on('grievance_update', (data) => {
      const { grievanceId, userId, update } = data;
      // Notify assigned admin or grievance owner
      socket.to(`grievance_${grievanceId}`).emit('grievance_updated', {
        grievanceId,
        userId,
        update,
        timestamp: new Date()
      });
    });
    
    // Handle room joining for specific features
    socket.on('join_alert_room', (alertId) => {
      socket.join(`alert_${alertId}`);
    });
    
    socket.on('join_grievance_room', (grievanceId) => {
      socket.join(`grievance_${grievanceId}`);
    });
    
    socket.on('join_conversation_room', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
  
  return io;
};

/**
 * Get Socket.io instance
 * @returns {Object} Socket.io instance
 */
const getSocketInstance = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

/**
 * Send notification to specific user
 * @param {string} userId - Target user ID
 * @param {Object} notification - Notification data
 */
const sendToUser = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit('notification', notification);
  }
};

/**
 * Send notification to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notification - Notification data
 */
const sendToUsers = (userIds, notification) => {
  if (io) {
    userIds.forEach(userId => {
      io.to(`user_${userId}`).emit('notification', notification);
    });
  }
};

/**
 * Broadcast notification to all connected users
 * @param {Object} notification - Notification data
 */
const broadcast = (notification) => {
  if (io) {
    io.emit('broadcast', notification);
  }
};

/**
 * Send emergency alert to specific users with real-time location tracking
 * @param {Array} userIds - Array of user IDs to notify
 * @param {Object} alertData - Emergency alert data
 */
const sendEmergencyAlert = (userIds, alertData) => {
  if (io) {
    userIds.forEach(userId => {
      io.to(`user_${userId}`).emit('emergency_alert', {
        ...alertData,
        timestamp: new Date(),
        requiresAck: true
      });
    });
  }
};

/**
 * Update emergency alert status in real-time
 * @param {string} alertId - Alert ID
 * @param {Object} updateData - Update data
 */
const updateEmergencyAlert = (alertId, updateData) => {
  if (io) {
    io.to(`alert_${alertId}`).emit('emergency_update', {
      alertId,
      ...updateData,
      timestamp: new Date()
    });
  }
};

/**
 * Send real-time message in conversation
 * @param {string} conversationId - Conversation ID
 * @param {Object} messageData - Message data
 */
const sendMessage = (conversationId, messageData) => {
  if (io) {
    io.to(`conversation_${conversationId}`).emit('new_message', {
      ...messageData,
      timestamp: new Date()
    });
  }
};

/**
 * Update grievance status in real-time
 * @param {string} grievanceId - Grievance ID
 * @param {Object} updateData - Update data
 */
const updateGrievance = (grievanceId, updateData) => {
  if (io) {
    io.to(`grievance_${grievanceId}`).emit('grievance_updated', {
      grievanceId,
      ...updateData,
      timestamp: new Date()
    });
  }
};

/**
 * Send marketplace inquiry notification
 * @param {string} sellerId - Seller user ID
 * @param {Object} inquiryData - Inquiry data
 */
const sendMarketplaceInquiry = (sellerId, inquiryData) => {
  if (io) {
    io.to(`user_${sellerId}`).emit('new_inquiry', {
      ...inquiryData,
      timestamp: new Date()
    });
  }
};

/**
 * Send typing indicator
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User who is typing
 * @param {boolean} isTyping - Whether user is typing
 */
const sendTypingIndicator = (conversationId, userId, isTyping) => {
  if (io) {
    const event = isTyping ? 'user_typing' : 'user_stopped_typing';
    io.to(`conversation_${conversationId}`).emit(event, {
      userId,
      timestamp: new Date()
    });
  }
};

/**
 * Get online users count
 * @returns {number} Number of connected users
 */
const getOnlineUsersCount = () => {
  if (io) {
    return io.engine.clientsCount;
  }
  return 0;
};

/**
 * Get users in specific room
 * @param {string} roomName - Room name
 * @returns {Array} Array of socket IDs in the room
 */
const getUsersInRoom = (roomName) => {
  if (io) {
    const room = io.sockets.adapter.rooms.get(roomName);
    return room ? Array.from(room) : [];
  }
  return [];
};

/**
 * Send system maintenance notification
 * @param {Object} maintenanceData - Maintenance notification data
 */
const sendMaintenanceNotification = (maintenanceData) => {
  if (io) {
    io.emit('system_maintenance', {
      ...maintenanceData,
      timestamp: new Date()
    });
  }
};

/**
 * Send welfare scheme notification to eligible users
 * @param {Array} userIds - Array of eligible user IDs
 * @param {Object} schemeData - Welfare scheme data
 */
const sendWelfareSchemeNotification = (userIds, schemeData) => {
  if (io) {
    userIds.forEach(userId => {
      io.to(`user_${userId}`).emit('new_welfare_scheme', {
        ...schemeData,
        timestamp: new Date()
      });
    });
  }
};

/**
 * Send application status update
 * @param {string} userId - Applicant user ID
 * @param {Object} applicationData - Application status data
 */
const sendApplicationUpdate = (userId, applicationData) => {
  if (io) {
    io.to(`user_${userId}`).emit('application_update', {
      ...applicationData,
      timestamp: new Date()
    });
  }
};

module.exports = {
  initializeSocket,
  getSocketInstance,
  sendToUser,
  sendToUsers,
  broadcast,
  sendEmergencyAlert,
  updateEmergencyAlert,
  sendMessage,
  updateGrievance,
  sendMarketplaceInquiry,
  sendTypingIndicator,
  getOnlineUsersCount,
  getUsersInRoom,
  sendMaintenanceNotification,
  sendWelfareSchemeNotification,
  sendApplicationUpdate
};
