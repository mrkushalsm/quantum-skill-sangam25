// Unit Tests for Notification Utility
const {
  createNotification,
  sendBulkNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getUserNotifications,
  sendEmergencyAlert,
  sendWelcomeNotification,
  sendApplicationStatusNotification,
  cleanupOldNotifications
} = require('../../../utils/notification');
const Notification = require('../../../models/Notification');
const User = require('../../../models/User');

// Mock the models
jest.mock('../../../models/Notification');
jest.mock('../../../models/User');

describe('Notification Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      const mockNotification = {
        _id: 'notification123',
        userId: 'user123',
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
        save: jest.fn().mockResolvedValue(true)
      };

      Notification.mockImplementation(() => mockNotification);
      User.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const notificationData = {
        userId: 'user123',
        title: 'Test Notification',
        message: 'Test message',
        type: 'info'
      };

      const result = await createNotification(notificationData);

      expect(Notification).toHaveBeenCalledWith({
        userId: 'user123',
        title: 'Test Notification',
        message: 'Test message',
        type: 'info',
        relatedId: undefined,
        relatedType: undefined,
        priority: 'medium',
        scheduledFor: undefined,
        channels: {
          push: true,
          email: false,
          sms: false
        },
        metadata: {}
      });
      
      expect(mockNotification.save).toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        { $push: { notifications: 'notification123' } }
      );
      expect(result).toBe(mockNotification);
    });

    it('should use default values for optional fields', async () => {
      const mockNotification = {
        _id: 'notification123',
        save: jest.fn().mockResolvedValue(true)
      };

      Notification.mockImplementation(() => mockNotification);
      User.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const notificationData = {
        userId: 'user123',
        title: 'Test',
        message: 'Test message'
      };

      await createNotification(notificationData);

      expect(Notification).toHaveBeenCalledWith({
        userId: 'user123',
        title: 'Test',
        message: 'Test message',
        type: 'info',
        relatedId: undefined,
        relatedType: undefined,
        priority: 'medium',
        scheduledFor: undefined,
        channels: {
          push: true,
          email: false,
          sms: false
        },
        metadata: {}
      });
    });

    it('should handle custom channels and metadata', async () => {
      const mockNotification = {
        _id: 'notification123',
        save: jest.fn().mockResolvedValue(true)
      };

      Notification.mockImplementation(() => mockNotification);
      User.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const notificationData = {
        userId: 'user123',
        title: 'Test',
        message: 'Test message',
        channels: { push: false, email: true, sms: true },
        metadata: { customField: 'value' }
      };

      await createNotification(notificationData);

      expect(Notification).toHaveBeenCalledWith({
        userId: 'user123',
        title: 'Test',
        message: 'Test message',
        type: 'info',
        relatedId: undefined,
        relatedType: undefined,
        priority: 'medium',
        scheduledFor: undefined,
        channels: { push: false, email: true, sms: true },
        metadata: { customField: 'value' }
      });
    });

    it('should handle errors during notification creation', async () => {
      const mockError = new Error('Database error');
      Notification.mockImplementation(() => {
        throw mockError;
      });

      const notificationData = {
        userId: 'user123',
        title: 'Test',
        message: 'Test message'
      };

      await expect(createNotification(notificationData)).rejects.toThrow('Database error');
      expect(console.error).toHaveBeenCalledWith('Error creating notification:', mockError);
    });

    it('should handle errors during user update', async () => {
      const mockNotification = {
        _id: 'notification123',
        save: jest.fn().mockResolvedValue(true)
      };

      Notification.mockImplementation(() => mockNotification);
      User.findByIdAndUpdate = jest.fn().mockRejectedValue(new Error('User update failed'));

      const notificationData = {
        userId: 'user123',
        title: 'Test',
        message: 'Test message'
      };

      await expect(createNotification(notificationData)).rejects.toThrow('User update failed');
    });
  });

  describe('sendBulkNotifications', () => {
    it('should send notifications to multiple users', async () => {
      const mockNotification = {
        _id: 'notification123',
        save: jest.fn().mockResolvedValue(true)
      };

      Notification.mockImplementation(() => mockNotification);
      User.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const userIds = ['user1', 'user2', 'user3'];
      const notificationData = {
        title: 'Bulk Notification',
        message: 'Test bulk message',
        type: 'announcement'
      };

      const result = await sendBulkNotifications(userIds, notificationData);

      expect(Notification).toHaveBeenCalledTimes(3);
      expect(User.findByIdAndUpdate).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });

    it('should handle partial failures in bulk notifications', async () => {
      const mockNotification = {
        _id: 'notification123',
        save: jest.fn().mockResolvedValue(true)
      };

      Notification.mockImplementation(() => mockNotification);
      User.findByIdAndUpdate = jest.fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('User not found'))
        .mockResolvedValueOnce({});

      const userIds = ['user1', 'user2', 'user3'];
      const notificationData = {
        title: 'Bulk Notification',
        message: 'Test bulk message'
      };

      const result = await sendBulkNotifications(userIds, notificationData);

      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0]).toMatchObject({
        userId: 'user2',
        error: expect.any(Error)
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      Notification.findByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: 'notification123',
        isRead: true
      });

      const result = await markAsRead('notification123', 'user123');

      expect(Notification.findByIdAndUpdate).toHaveBeenCalledWith(
        'notification123',
        { 
          isRead: true,
          readAt: expect.any(Date)
        },
        { new: true }
      );
      expect(result).toMatchObject({
        _id: 'notification123',
        isRead: true
      });
    });

    it('should handle notification not found', async () => {
      Notification.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await expect(markAsRead('invalid123', 'user123')).rejects.toThrow('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all user notifications as read', async () => {
      Notification.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 5 });

      const result = await markAllAsRead('user123');

      expect(Notification.updateMany).toHaveBeenCalledWith(
        { userId: 'user123', isRead: false },
        { 
          isRead: true,
          readAt: expect.any(Date)
        }
      );
      expect(result.modifiedCount).toBe(5);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread notification count', async () => {
      Notification.countDocuments = jest.fn().mockResolvedValue(3);

      const count = await getUnreadCount('user123');

      expect(Notification.countDocuments).toHaveBeenCalledWith({
        userId: 'user123',
        isRead: false
      });
      expect(count).toBe(3);
    });
  });

  describe('getUserNotifications', () => {
    it('should get user notifications with pagination', async () => {
      const mockNotifications = [
        { _id: 'notif1', title: 'Test 1' },
        { _id: 'notif2', title: 'Test 2' }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockNotifications)
      };

      Notification.find = jest.fn().mockReturnValue(mockQuery);
      Notification.countDocuments = jest.fn().mockResolvedValue(25);

      const result = await getUserNotifications('user123', { page: 2, limit: 10 });

      expect(Notification.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockQuery.skip).toHaveBeenCalledWith(10);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(result.notifications).toEqual(mockNotifications);
      expect(result.pagination).toMatchObject({
        currentPage: 2,
        totalPages: 3,
        totalCount: 25,
        hasNext: true,
        hasPrev: true
      });
    });

    it('should filter notifications by type', async () => {
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      Notification.find = jest.fn().mockReturnValue(mockQuery);
      Notification.countDocuments = jest.fn().mockResolvedValue(0);

      await getUserNotifications('user123', { type: 'emergency' });

      expect(Notification.find).toHaveBeenCalledWith({
        userId: 'user123',
        type: 'emergency'
      });
    });
  });

  describe('sendEmergencyAlert', () => {
    it('should send emergency alert notification', async () => {
      const mockNotification = {
        _id: 'notification123',
        save: jest.fn().mockResolvedValue(true)
      };

      Notification.mockImplementation(() => mockNotification);
      User.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const alertData = {
        userId: 'user123',
        alertId: 'alert123',
        location: 'Base Camp',
        severity: 'high'
      };

      await sendEmergencyAlert(alertData);

      expect(Notification).toHaveBeenCalledWith({
        userId: 'user123',
        title: 'Emergency Alert',
        message: expect.stringContaining('An emergency alert has been triggered'),
        type: 'emergency',
        priority: 'critical',
        relatedId: 'alert123',
        relatedType: 'emergency',
        channels: {
          push: true,
          email: true,
          sms: true
        },
        metadata: {
          alertId: 'alert123',
          location: 'Base Camp',
          severity: 'high'
        }
      });
    });
  });

  describe('sendWelcomeNotification', () => {
    it('should send welcome notification to new user', async () => {
      const mockNotification = {
        _id: 'notification123',
        save: jest.fn().mockResolvedValue(true)
      };

      Notification.mockImplementation(() => mockNotification);
      User.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const userData = {
        userId: 'user123',
        name: 'John Doe',
        role: 'family_member'
      };

      await sendWelcomeNotification(userData);

      expect(Notification).toHaveBeenCalledWith({
        userId: 'user123',
        title: 'Welcome to Armed Forces Welfare System',
        message: expect.stringContaining('Welcome John Doe'),
        type: 'info',
        priority: 'medium',
        channels: {
          push: true,
          email: true,
          sms: false
        }
      });
    });
  });

  describe('sendApplicationStatusNotification', () => {
    it('should send application status update notification', async () => {
      const mockNotification = {
        _id: 'notification123',
        save: jest.fn().mockResolvedValue(true)
      };

      Notification.mockImplementation(() => mockNotification);
      User.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const statusData = {
        userId: 'user123',
        applicationId: 'app123',
        schemeName: 'Education Grant',
        status: 'approved',
        comments: 'Application approved for processing'
      };

      await sendApplicationStatusNotification(statusData);

      expect(Notification).toHaveBeenCalledWith({
        userId: 'user123',
        title: 'Application Status Update',
        message: expect.stringContaining('Your application for Education Grant has been approved'),
        type: 'success',
        priority: 'medium',
        relatedId: 'app123',
        relatedType: 'application',
        channels: {
          push: true,
          email: true,
          sms: false
        },
        metadata: {
          applicationId: 'app123',
          schemeName: 'Education Grant',
          status: 'approved'
        }
      });
    });
  });

  describe('cleanupOldNotifications', () => {
    it('should delete old read notifications', async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      Notification.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 15 });

      const result = await cleanupOldNotifications();

      expect(Notification.deleteMany).toHaveBeenCalledWith({
        isRead: true,
        createdAt: { $lt: expect.any(Date) }
      });
      expect(result.deletedCount).toBe(15);
    });

    it('should handle cleanup errors', async () => {
      Notification.deleteMany = jest.fn().mockRejectedValue(new Error('Cleanup failed'));

      await expect(cleanupOldNotifications()).rejects.toThrow('Cleanup failed');
      expect(console.error).toHaveBeenCalledWith('Error cleaning up old notifications:', expect.any(Error));
    });
  });
});
