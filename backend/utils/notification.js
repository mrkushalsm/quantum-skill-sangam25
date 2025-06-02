const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create a notification for a user
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.userId - User ID to send notification to
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.type - Notification type (info, success, warning, error, emergency)
 * @param {string} [notificationData.relatedId] - Related document ID
 * @param {string} [notificationData.relatedType] - Related document type
 * @param {string} [notificationData.priority] - Notification priority (low, medium, high, critical)
 * @param {Date} [notificationData.scheduledFor] - Schedule notification for later
 * @param {Object} [notificationData.channels] - Delivery channels
 */
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification({
      userId: notificationData.userId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'info',
      relatedId: notificationData.relatedId,
      relatedType: notificationData.relatedType,
      priority: notificationData.priority || 'medium',
      scheduledFor: notificationData.scheduledFor,
      channels: notificationData.channels || {
        push: true,
        email: false,
        sms: false
      },
      metadata: notificationData.metadata || {}
    });

    await notification.save();

    // Add notification to user's notifications array
    await User.findByIdAndUpdate(
      notificationData.userId,
      { $push: { notifications: notification._id } }
    );

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID
 */
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { 
        isRead: true,
        readAt: new Date(),
        'delivery.push.deliveredAt': new Date()
      },
      { new: true }
    );

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 */
const markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date(),
        'delivery.push.deliveredAt': new Date()
      }
    );

    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 */
const getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });

    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

/**
 * Get notifications for a user with pagination
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Limit per page
 * @param {string} [options.type] - Filter by notification type
 * @param {boolean} [options.unreadOnly=false] - Get only unread notifications
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      unreadOnly = false
    } = options;

    const query = { userId };
    
    if (type) query.type = type;
    if (unreadOnly) query.isRead = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    return {
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalNotifications: total
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Delete old notifications (cleanup)
 * @param {number} daysOld - Delete notifications older than this many days
 */
const deleteOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    });

    console.log(`Deleted ${result.deletedCount} old notifications`);
    return result;
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    throw error;
  }
};

/**
 * Send bulk notifications to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data (without userId)
 */
const sendBulkNotifications = async (userIds, notificationData) => {
  try {
    const notifications = userIds.map(userId => ({
      ...notificationData,
      userId
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    // Update users' notification arrays
    const updatePromises = userIds.map(userId => 
      User.findByIdAndUpdate(
        userId,
        { 
          $push: { 
            notifications: { 
              $each: createdNotifications
                .filter(notif => notif.userId.toString() === userId.toString())
                .map(notif => notif._id)
            }
          }
        }
      )
    );

    await Promise.all(updatePromises);

    return createdNotifications;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw error;
  }
};

/**
 * Schedule notification for later delivery
 * @param {Object} notificationData - Notification data with scheduledFor date
 */
const scheduleNotification = async (notificationData) => {
  try {
    const notification = new Notification({
      ...notificationData,
      status: 'scheduled'
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

/**
 * Process scheduled notifications (to be called by a cron job)
 */
const processScheduledNotifications = async () => {
  try {
    const now = new Date();
    
    const scheduledNotifications = await Notification.find({
      status: 'scheduled',
      scheduledFor: { $lte: now }
    });

    const updatePromises = scheduledNotifications.map(async (notification) => {
      notification.status = 'sent';
      notification.delivery.push.sentAt = now;
      await notification.save();

      // Add to user's notifications array
      await User.findByIdAndUpdate(
        notification.userId,
        { $push: { notifications: notification._id } }
      );

      return notification;
    });

    const processedNotifications = await Promise.all(updatePromises);
    
    console.log(`Processed ${processedNotifications.length} scheduled notifications`);
    return processedNotifications;
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    throw error;
  }
};

/**
 * Get notification statistics for admin dashboard
 */
const getNotificationStats = async () => {
  try {
    const [
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      notificationsByPriority,
      recentNotifications
    ] = await Promise.all([
      Notification.countDocuments(),
      Notification.countDocuments({ isRead: false }),
      
      Notification.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      Notification.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      
      Notification.find()
        .populate('userId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title type priority createdAt userId')
    ]);

    return {
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      notificationsByPriority,
      recentNotifications
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  getUserNotifications,
  deleteOldNotifications,
  sendBulkNotifications,
  scheduleNotification,
  processScheduledNotifications,
  getNotificationStats
};
