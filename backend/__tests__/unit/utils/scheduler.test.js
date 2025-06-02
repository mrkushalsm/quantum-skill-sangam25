// Unit Tests for Scheduler Utility
const Scheduler = require('../../../utils/scheduler');
const WelfareScheme = require('../../../models/WelfareScheme');
const Application = require('../../../models/Application');
const Grievance = require('../../../models/Grievance');
const User = require('../../../models/User');
const { createNotification } = require('../../../utils/notification');
const logger = require('../../../config/logger');

// Mock dependencies
jest.mock('node-cron');
jest.mock('../../../models/WelfareScheme');
jest.mock('../../../models/Application');
jest.mock('../../../models/Grievance');
jest.mock('../../../models/User');
jest.mock('../../../utils/notification');
jest.mock('../../../config/logger');

const cron = require('node-cron');

describe('Scheduler', () => {
  let scheduler;
  let mockIo;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock socket.io
    mockIo = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis()
    };

    // Mock cron.schedule
    cron.schedule = jest.fn();

    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize all scheduled tasks', () => {
      scheduler = new Scheduler(mockIo);

      expect(cron.schedule).toHaveBeenCalledTimes(6);
      expect(logger.info).toHaveBeenCalledWith('Scheduled tasks initialized');
    });

    it('should schedule task for checking scheme deadlines', () => {
      scheduler = new Scheduler(mockIo);

      expect(cron.schedule).toHaveBeenCalledWith('0 9 * * *', expect.any(Function));
    });

    it('should schedule task for weekly reminders', () => {
      scheduler = new Scheduler(mockIo);

      expect(cron.schedule).toHaveBeenCalledWith('0 10 * * 0', expect.any(Function));
    });

    it('should schedule task for checking overdue grievances', () => {
      scheduler = new Scheduler(mockIo);

      expect(cron.schedule).toHaveBeenCalledWith('0 14 * * *', expect.any(Function));
    });

    it('should schedule task for cleanup', () => {
      scheduler = new Scheduler(mockIo);

      expect(cron.schedule).toHaveBeenCalledWith('0 0 * * 0', expect.any(Function));
    });

    it('should schedule task for birthday wishes', () => {
      scheduler = new Scheduler(mockIo);

      expect(cron.schedule).toHaveBeenCalledWith('0 8 * * *', expect.any(Function));
    });

    it('should schedule task for pending applications', () => {
      scheduler = new Scheduler(mockIo);

      expect(cron.schedule).toHaveBeenCalledWith('0 11 * * *', expect.any(Function));
    });
  });

  describe('checkSchemeDeadlines', () => {
    beforeEach(() => {
      scheduler = new Scheduler(mockIo);
    });

    it('should check for schemes approaching deadline', async () => {
      const mockSchemes = [
        {
          _id: 'scheme1',
          name: 'Education Grant',
          applicationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          eligibleUsers: ['user1', 'user2']
        }
      ];

      WelfareScheme.find = jest.fn().mockResolvedValue(mockSchemes);
      createNotification.mockResolvedValue({});

      await scheduler.checkSchemeDeadlines();

      expect(WelfareScheme.find).toHaveBeenCalledWith({
        applicationDeadline: {
          $gte: expect.any(Date),
          $lte: expect.any(Date)
        },
        status: 'active'
      });

      expect(createNotification).toHaveBeenCalledTimes(2); // Once for each eligible user
    });

    it('should handle errors during deadline check', async () => {
      WelfareScheme.find = jest.fn().mockRejectedValue(new Error('Database error'));

      await scheduler.checkSchemeDeadlines();

      expect(logger.error).toHaveBeenCalledWith('Error checking scheme deadlines:', expect.any(Error));
    });

    it('should skip schemes with no eligible users', async () => {
      const mockSchemes = [
        {
          _id: 'scheme1',
          name: 'Education Grant',
          applicationDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          eligibleUsers: []
        }
      ];

      WelfareScheme.find = jest.fn().mockResolvedValue(mockSchemes);

      await scheduler.checkSchemeDeadlines();

      expect(createNotification).not.toHaveBeenCalled();
    });
  });

  describe('sendWeeklyReminders', () => {
    beforeEach(() => {
      scheduler = new Scheduler(mockIo);
    });

    it('should send weekly reminders for active schemes', async () => {
      const mockSchemes = [
        {
          _id: 'scheme1',
          name: 'Health Insurance',
          description: 'Health coverage for families',
          eligibleUsers: ['user1', 'user2', 'user3']
        }
      ];

      WelfareScheme.find = jest.fn().mockResolvedValue(mockSchemes);
      createNotification.mockResolvedValue({});

      await scheduler.sendWeeklyReminders();

      expect(WelfareScheme.find).toHaveBeenCalledWith({
        status: 'active',
        applicationDeadline: { $gte: expect.any(Date) }
      });

      expect(createNotification).toHaveBeenCalledTimes(3); // Once for each eligible user
    });

    it('should handle errors during weekly reminders', async () => {
      WelfareScheme.find = jest.fn().mockRejectedValue(new Error('Database error'));

      await scheduler.sendWeeklyReminders();

      expect(logger.error).toHaveBeenCalledWith('Error sending weekly reminders:', expect.any(Error));
    });
  });

  describe('checkOverdueGrievances', () => {
    beforeEach(() => {
      scheduler = new Scheduler(mockIo);
    });

    it('should check for overdue grievances', async () => {
      const mockGrievances = [
        {
          _id: 'grievance1',
          title: 'Overdue Issue',
          userId: 'user1',
          assignedTo: 'officer1',
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockGrievances)
      };

      Grievance.find = jest.fn().mockReturnValue(mockQuery);
      createNotification.mockResolvedValue({});

      await scheduler.checkOverdueGrievances();

      expect(Grievance.find).toHaveBeenCalledWith({
        status: { $in: ['pending', 'in_progress'] },
        createdAt: { $lt: expect.any(Date) }
      });

      expect(createNotification).toHaveBeenCalledTimes(2); // Once for user, once for assigned officer
    });

    it('should handle grievances without assigned officer', async () => {
      const mockGrievances = [
        {
          _id: 'grievance1',
          title: 'Unassigned Issue',
          userId: 'user1',
          assignedTo: null,
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockGrievances)
      };

      Grievance.find = jest.fn().mockReturnValue(mockQuery);
      createNotification.mockResolvedValue({});

      await scheduler.checkOverdueGrievances();

      expect(createNotification).toHaveBeenCalledTimes(1); // Only for user
    });
  });

  describe('sendBirthdayWishes', () => {
    beforeEach(() => {
      scheduler = new Scheduler(mockIo);
    });

    it('should send birthday wishes to users', async () => {
      const today = new Date();
      const mockUsers = [
        {
          _id: 'user1',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date(1990, today.getMonth(), today.getDate())
        },
        {
          _id: 'user2',
          firstName: 'Jane',
          lastName: 'Smith',
          dateOfBirth: new Date(1985, today.getMonth(), today.getDate())
        }
      ];

      const mockQuery = {
        select: jest.fn().mockResolvedValue(mockUsers)
      };

      User.find = jest.fn().mockReturnValue(mockQuery);
      createNotification.mockResolvedValue({});

      await scheduler.sendBirthdayWishes();

      expect(User.find).toHaveBeenCalledWith({
        $expr: {
          $and: [
            { $eq: [{ $dayOfMonth: '$dateOfBirth' }, today.getDate()] },
            { $eq: [{ $month: '$dateOfBirth' }, today.getMonth() + 1] }
          ]
        }
      });

      expect(createNotification).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during birthday wishes', async () => {
      const mockQuery = {
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      User.find = jest.fn().mockReturnValue(mockQuery);

      await scheduler.sendBirthdayWishes();

      expect(logger.error).toHaveBeenCalledWith('Error sending birthday wishes:', expect.any(Error));
    });
  });

  describe('checkPendingApplications', () => {
    beforeEach(() => {
      scheduler = new Scheduler(mockIo);
    });

    it('should check for applications needing attention', async () => {
      const mockApplications = [
        {
          _id: 'app1',
          userId: 'user1',
          schemeId: { name: 'Education Grant' },
          status: 'pending',
          submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockApplications)
      };

      Application.find = jest.fn().mockReturnValue(mockQuery);
      User.find = jest.fn().mockResolvedValue([{ _id: 'officer1' }]);
      createNotification.mockResolvedValue({});

      await scheduler.checkPendingApplications();

      expect(Application.find).toHaveBeenCalledWith({
        status: 'pending',
        submittedAt: { $lt: expect.any(Date) }
      });

      expect(createNotification).toHaveBeenCalled();
    });

    it('should handle no officers available', async () => {
      const mockApplications = [
        {
          _id: 'app1',
          userId: 'user1',
          schemeId: { name: 'Education Grant' },
          status: 'pending',
          submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
        }
      ];

      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockApplications)
      };

      Application.find = jest.fn().mockReturnValue(mockQuery);
      User.find = jest.fn().mockResolvedValue([]); // No officers
      createNotification.mockResolvedValue({});

      await scheduler.checkPendingApplications();

      expect(logger.warn).toHaveBeenCalledWith('No officers available to notify about pending applications');
    });
  });

  describe('cleanupOldNotifications', () => {
    beforeEach(() => {
      scheduler = new Scheduler(mockIo);
    });

    it('should clean up old notifications', async () => {
      const { cleanupOldNotifications } = require('../../../utils/notification');
      cleanupOldNotifications.mockResolvedValue({ deletedCount: 50 });

      await scheduler.cleanupOldNotifications();

      expect(cleanupOldNotifications).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Cleaned up 50 old notifications');
    });

    it('should handle cleanup errors', async () => {
      const { cleanupOldNotifications } = require('../../../utils/notification');
      cleanupOldNotifications.mockRejectedValue(new Error('Cleanup failed'));

      await scheduler.cleanupOldNotifications();

      expect(logger.error).toHaveBeenCalledWith('Error during notification cleanup:', expect.any(Error));
    });
  });
});
