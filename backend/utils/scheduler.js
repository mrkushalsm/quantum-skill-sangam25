const cron = require('node-cron');
const WelfareScheme = require('../models/WelfareScheme');
const Application = require('../models/Application');
const Grievance = require('../models/Grievance');
const User = require('../models/User');
const { createNotification } = require('./notification');
const logger = require('../config/logger');

class Scheduler {
  constructor(io) {
    this.io = io;
    this.init();
  }

  init() {
    // Check for scheme application deadlines daily at 9 AM
    cron.schedule('0 9 * * *', () => {
      this.checkSchemeDeadlines();
    });

    // Send weekly welfare scheme reminders on Sundays at 10 AM
    cron.schedule('0 10 * * 0', () => {
      this.sendWeeklyReminders();
    });

    // Check for overdue grievances daily at 2 PM
    cron.schedule('0 14 * * *', () => {
      this.checkOverdueGrievances();
    });

    // Clean up old notifications weekly on Sundays at midnight
    cron.schedule('0 0 * * 0', () => {
      this.cleanupOldNotifications();
    });

    // Send birthday wishes daily at 8 AM
    cron.schedule('0 8 * * *', () => {
      this.sendBirthdayWishes();
    });

    // Check for pending applications that need attention
    cron.schedule('0 11 * * *', () => {
      this.checkPendingApplications();
    });

    logger.info('Scheduled tasks initialized');
  }

  async checkSchemeDeadlines() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const schemesNearDeadline = await WelfareScheme.find({
        applicationDeadline: {
          $lte: threeDaysFromNow,
          $gte: new Date()
        },
        status: 'active'
      });

      for (const scheme of schemesNearDeadline) {
        // Notify eligible users
        const eligibleUsers = await User.find({
          role: { $in: ['officer', 'family_member'] },
          'profile.serviceStatus': 'active'
        });

        for (const user of eligibleUsers) {
          await createNotification({
            userId: user._id,
            title: 'Scheme Deadline Approaching',
            message: `The application deadline for "${scheme.name}" is approaching. Apply before ${scheme.applicationDeadline.toDateString()}.`,
            type: 'welfare_reminder',
            relatedModel: 'WelfareScheme',
            relatedId: scheme._id,
            io: this.io
          });
        }
      }

      logger.info(`Checked ${schemesNearDeadline.length} schemes near deadline`);
    } catch (error) {
      logger.error('Error checking scheme deadlines:', error);
    }
  }

  async sendWeeklyReminders() {
    try {
      const activeSchemes = await WelfareScheme.find({
        status: 'active',
        applicationDeadline: { $gte: new Date() }
      }).limit(5);

      const users = await User.find({
        role: { $in: ['officer', 'family_member'] }
      });

      for (const user of users) {
        if (activeSchemes.length > 0) {
          await createNotification({
            userId: user._id,
            title: 'Weekly Welfare Update',
            message: `${activeSchemes.length} welfare schemes are currently available for application. Check them out!`,
            type: 'weekly_reminder',
            io: this.io
          });
        }
      }

      logger.info(`Sent weekly reminders to ${users.length} users`);
    } catch (error) {
      logger.error('Error sending weekly reminders:', error);
    }
  }

  async checkOverdueGrievances() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const overdueGrievances = await Grievance.find({
        status: { $in: ['open', 'in_progress'] },
        createdAt: { $lte: sevenDaysAgo }
      }).populate('assignedTo');

      for (const grievance of overdueGrievances) {
        // Notify assigned officer
        if (grievance.assignedTo) {
          await createNotification({
            userId: grievance.assignedTo._id,
            title: 'Overdue Grievance',
            message: `Grievance #${grievance.ticketNumber} has been pending for over 7 days. Please provide an update.`,
            type: 'grievance_overdue',
            relatedModel: 'Grievance',
            relatedId: grievance._id,
            priority: 'high',
            io: this.io
          });
        }

        // Auto-escalate if no action taken in 10 days
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        
        if (grievance.createdAt <= tenDaysAgo && grievance.status !== 'escalated') {
          grievance.status = 'escalated';
          grievance.escalatedAt = new Date();
          await grievance.save();

          // Notify administrators
          const admins = await User.find({ role: 'admin' });
          for (const admin of admins) {
            await createNotification({
              userId: admin._id,
              title: 'Grievance Auto-Escalated',
              message: `Grievance #${grievance.ticketNumber} has been auto-escalated due to no response for 10 days.`,
              type: 'grievance_escalated',
              relatedModel: 'Grievance',
              relatedId: grievance._id,
              priority: 'high',
              io: this.io
            });
          }
        }
      }

      logger.info(`Checked ${overdueGrievances.length} overdue grievances`);
    } catch (error) {
      logger.error('Error checking overdue grievances:', error);
    }
  }

  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const Notification = require('../models/Notification');
      const result = await Notification.deleteMany({
        createdAt: { $lte: thirtyDaysAgo },
        read: true
      });

      logger.info(`Cleaned up ${result.deletedCount} old notifications`);
    } catch (error) {
      logger.error('Error cleaning up notifications:', error);
    }
  }

  async sendBirthdayWishes() {
    try {
      const today = new Date();
      const todayStr = `${today.getMonth() + 1}-${today.getDate()}`;

      const users = await User.find({
        'profile.dateOfBirth': { $exists: true }
      });

      const birthdayUsers = users.filter(user => {
        if (user.profile.dateOfBirth) {
          const dob = new Date(user.profile.dateOfBirth);
          const dobStr = `${dob.getMonth() + 1}-${dob.getDate()}`;
          return dobStr === todayStr;
        }
        return false;
      });

      for (const user of birthdayUsers) {
        await createNotification({
          userId: user._id,
          title: 'Happy Birthday! 🎉',
          message: `Wishing you a very happy birthday! May this year bring you joy, success, and good health. Thank you for your service to our nation.`,
          type: 'birthday_wish',
          priority: 'low',
          io: this.io
        });
      }

      logger.info(`Sent birthday wishes to ${birthdayUsers.length} users`);
    } catch (error) {
      logger.error('Error sending birthday wishes:', error);
    }
  }

  async checkPendingApplications() {
    try {
      const pendingApplications = await Application.find({
        status: 'submitted'
      }).populate('scheme user');

      const groupedByScheme = {};
      
      pendingApplications.forEach(app => {
        const schemeId = app.scheme._id.toString();
        if (!groupedByScheme[schemeId]) {
          groupedByScheme[schemeId] = {
            scheme: app.scheme,
            count: 0
          };
        }
        groupedByScheme[schemeId].count++;
      });

      // Notify administrators about pending applications
      const admins = await User.find({ role: 'admin' });
      
      for (const admin of admins) {
        const schemes = Object.values(groupedByScheme);
        if (schemes.length > 0) {
          const totalPending = schemes.reduce((sum, s) => sum + s.count, 0);
          await createNotification({
            userId: admin._id,
            title: 'Pending Applications Review',
            message: `${totalPending} applications across ${schemes.length} schemes are pending review.`,
            type: 'admin_reminder',
            priority: 'medium',
            io: this.io
          });
        }
      }

      logger.info(`Found ${pendingApplications.length} pending applications`);
    } catch (error) {
      logger.error('Error checking pending applications:', error);
    }
  }

  // Manual trigger methods for testing
  async triggerSchemeDeadlineCheck() {
    await this.checkSchemeDeadlines();
  }

  async triggerWeeklyReminders() {
    await this.sendWeeklyReminders();
  }

  async triggerGrievanceCheck() {
    await this.checkOverdueGrievances();
  }
}

module.exports = Scheduler;
