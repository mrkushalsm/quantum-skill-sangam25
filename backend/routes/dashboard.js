const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');
const WelfareScheme = require('../models/WelfareScheme');
const Application = require('../models/Application');
const Grievance = require('../models/Grievance');
const MarketplaceItem = require('../models/MarketplaceItem');
const EmergencyAlert = require('../models/EmergencyAlert');

// Root dashboard endpoint
router.get('/', authenticateUser, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      message: 'Armed Forces Dashboard API',
      user: {
        name: user.name,
        role: user.role,
        service: user.service,
        rank: user.rank
      },
      endpoints: {
        overview: '/api/dashboard/overview',
        statistics: '/api/dashboard/statistics',
        notifications: '/api/dashboard/notifications',
        activities: '/api/dashboard/activities'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Armed Forces Dashboard API', 
      error: error.message 
    });
  }
});

// Get dashboard overview
router.get('/overview', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }    let dashboardData = {
      user: {
        name: user.name,
        role: user.role,
        serviceNumber: user.serviceNumber,
        rank: user.rank,
        unit: user.unit,
        profilePicture: user.profilePicture
      }
    };

    // Common data for all users
    const recentNotifications = await user.populate({
      path: 'notifications',
      options: { sort: { createdAt: -1 }, limit: 5 }
    });

    dashboardData.recentNotifications = recentNotifications.notifications;

    if (user.role === 'admin') {
      // Admin dashboard data
      const totalUsers = await User.countDocuments();
      const totalOfficers = await User.countDocuments({ role: 'officer' });
      const totalFamilyMembers = await User.countDocuments({ role: 'family_member' });
      const activeSchemes = await WelfareScheme.countDocuments({ isActive: true });
      const pendingApplications = await Application.countDocuments({ status: 'pending' });
      const openGrievances = await Grievance.countDocuments({ status: { $in: ['open', 'in_progress'] } });
      const activeEmergencyAlerts = await EmergencyAlert.countDocuments({ status: 'active' });

      // Recent activities
      const recentApplications = await Application.find()
        .populate('applicantId', 'firstName lastName rank')
        .populate('schemeId', 'title')
        .sort({ createdAt: -1 })
        .limit(5);

      const recentGrievances = await Grievance.find()
        .populate('userId', 'firstName lastName rank')
        .sort({ createdAt: -1 })
        .limit(5);

      // Monthly statistics
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const monthlyApplications = await Application.countDocuments({
        createdAt: { $gte: currentMonth }
      });
      const monthlyGrievances = await Grievance.countDocuments({
        createdAt: { $gte: currentMonth }
      });

      dashboardData.admin = {
        stats: {
          totalUsers,
          totalOfficers,
          totalFamilyMembers,
          activeSchemes,
          pendingApplications,
          openGrievances,
          activeEmergencyAlerts,
          monthlyApplications,
          monthlyGrievances
        },
        recentApplications,
        recentGrievances
      };

    } else {
      // Officer/Family member dashboard data
      const myApplications = await Application.find({ applicantId: user._id })
        .populate('schemeId', 'title category')
        .sort({ createdAt: -1 })
        .limit(5);

      const myGrievances = await Grievance.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(3);

      const availableSchemes = await WelfareScheme.find({
        isActive: true,
        eligibleRoles: user.role,
        $or: [
          { eligibleServices: user.service },
          { eligibleServices: 'all' }
        ]
      }).limit(6);

      const applicationStats = await Application.aggregate([
        { $match: { applicantId: user._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      dashboardData.user = {
        ...dashboardData.user,
        stats: {
          applications: {
            total: myApplications.length,
            byStatus: applicationStats
          },
          grievances: myGrievances.length,
          availableSchemes: availableSchemes.length
        },
        myApplications,
        myGrievances,
        availableSchemes
      };

      // Family-specific data for officers
      if (user.role === 'officer') {
        const familyMembers = await User.find({ officerId: user._id })
          .select('firstName lastName relationship isActive');
        
        const familyApplications = await Application.find({
          applicantId: { $in: familyMembers.map(fm => fm._id) }
        }).populate('applicantId', 'firstName lastName relationship');

        dashboardData.family = {
          members: familyMembers,
          applications: familyApplications.slice(0, 5),
          totalApplications: familyApplications.length
        };
      }
    }

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

// Get quick stats for cards
router.get('/quick-stats', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let stats = {};

    if (user.role === 'admin') {
      const [
        totalUsers,
        pendingApplications,
        openGrievances,
        activeAlerts,
        monthlyNewUsers
      ] = await Promise.all([
        User.countDocuments(),
        Application.countDocuments({ status: 'pending' }),
        Grievance.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
        EmergencyAlert.countDocuments({ status: 'active' }),
        User.countDocuments({ 
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        })
      ]);

      stats = {
        totalUsers,
        pendingApplications,
        openGrievances,
        activeAlerts,
        monthlyNewUsers
      };
    } else {
      const [
        myApplications,
        myGrievances,
        availableSchemes,
        emergencyContacts
      ] = await Promise.all([
        Application.countDocuments({ applicantId: user._id }),
        Grievance.countDocuments({ userId: user._id }),
        WelfareScheme.countDocuments({
          isActive: true,
          eligibleRoles: user.role,
          $or: [
            { eligibleServices: user.service },
            { eligibleServices: 'all' }
          ]
        }),
        user.emergencyContacts.length
      ]);

      stats = {
        myApplications,
        myGrievances,
        availableSchemes,
        emergencyContacts
      };

      if (user.role === 'officer') {
        const familyMembers = await User.countDocuments({ officerId: user._id });
        stats.familyMembers = familyMembers;
      }
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching quick stats', error: error.message });
  }
});

// Get recent activities
router.get('/activities', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let activities = [];

    if (user.role === 'admin') {
      // Admin sees all recent activities
      const [applications, grievances, marketplaceItems] = await Promise.all([
        Application.find()
          .populate('applicantId', 'firstName lastName rank')
          .populate('schemeId', 'title')
          .sort({ createdAt: -1 })
          .limit(5),
        Grievance.find()
          .populate('userId', 'firstName lastName rank')
          .sort({ createdAt: -1 })
          .limit(5),
        MarketplaceItem.find()
          .populate('sellerId', 'firstName lastName rank')
          .sort({ createdAt: -1 })
          .limit(5)
      ]);

      activities = [
        ...applications.map(app => ({
          type: 'application',
          title: `New application for ${app.schemeId.title}`,
          user: `${app.applicantId.firstName} ${app.applicantId.lastName}`,
          timestamp: app.createdAt,
          status: app.status
        })),
        ...grievances.map(grievance => ({
          type: 'grievance',
          title: grievance.subject,
          user: `${grievance.userId.firstName} ${grievance.userId.lastName}`,
          timestamp: grievance.createdAt,
          status: grievance.status
        })),
        ...marketplaceItems.map(item => ({
          type: 'marketplace',
          title: `New item: ${item.title}`,
          user: `${item.sellerId.firstName} ${item.sellerId.lastName}`,
          timestamp: item.createdAt,
          status: item.status
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    } else {
      // Users see their own activities
      const [applications, grievances, marketplaceItems] = await Promise.all([
        Application.find({ applicantId: user._id })
          .populate('schemeId', 'title')
          .sort({ createdAt: -1 })
          .limit(5),
        Grievance.find({ userId: user._id })
          .sort({ createdAt: -1 })
          .limit(5),
        MarketplaceItem.find({ sellerId: user._id })
          .sort({ createdAt: -1 })
          .limit(5)
      ]);

      activities = [
        ...applications.map(app => ({
          type: 'application',
          title: `Application for ${app.schemeId.title}`,
          timestamp: app.createdAt,
          status: app.status
        })),
        ...grievances.map(grievance => ({
          type: 'grievance',
          title: grievance.subject,
          timestamp: grievance.createdAt,
          status: grievance.status
        })),
        ...marketplaceItems.map(item => ({
          type: 'marketplace',
          title: `Listed: ${item.title}`,
          timestamp: item.createdAt,
          status: item.status
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Paginate activities
    const startIndex = (page - 1) * limit;
    const paginatedActivities = activities.slice(startIndex, startIndex + limit);

    res.json({
      activities: paginatedActivities,
      totalPages: Math.ceil(activities.length / limit),
      currentPage: parseInt(page),
      totalActivities: activities.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
});

// Get system alerts (admin only)
router.get('/alerts', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const alerts = [];

    // Check for overdue applications
    const overdueApplications = await Application.countDocuments({
      status: 'pending',
      createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 days old
    });

    if (overdueApplications > 0) {
      alerts.push({
        type: 'warning',
        title: 'Overdue Applications',
        message: `${overdueApplications} applications are pending for more than 7 days`,
        count: overdueApplications
      });
    }

    // Check for unresolved grievances
    const unresolvedGrievances = await Grievance.countDocuments({
      status: { $in: ['open', 'in_progress'] },
      createdAt: { $lt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) } // 10 days old
    });

    if (unresolvedGrievances > 0) {
      alerts.push({
        type: 'error',
        title: 'Unresolved Grievances',
        message: `${unresolvedGrievances} grievances are unresolved for more than 10 days`,
        count: unresolvedGrievances
      });
    }

    // Check for active emergency alerts
    const activeEmergencies = await EmergencyAlert.countDocuments({ status: 'active' });

    if (activeEmergencies > 0) {
      alerts.push({
        type: 'error',
        title: 'Active Emergency Alerts',
        message: `${activeEmergencies} emergency alerts are currently active`,
        count: activeEmergencies
      });
    }

    // Check for schemes expiring soon
    const expiringSoon = await WelfareScheme.countDocuments({
      applicationDeadline: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      },
      isActive: true
    });

    if (expiringSoon > 0) {
      alerts.push({
        type: 'info',
        title: 'Schemes Expiring Soon',
        message: `${expiringSoon} welfare schemes will expire in the next 7 days`,
        count: expiringSoon
      });
    }

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alerts', error: error.message });
  }
});

// Get analytics data (admin only)
router.get('/analytics', authenticateUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case '7d':
        dateFilter = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
        break;
      case '1y':
        dateFilter = { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) };
        break;
    }

    const [
      userGrowth,
      applicationTrends,
      grievanceTrends,
      schemePopularity,
      emergencyStats
    ] = await Promise.all([
      // User growth over time
      User.aggregate([
        { $match: { createdAt: dateFilter } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      
      // Application trends
      Application.aggregate([
        { $match: { createdAt: dateFilter } },
        {
          $group: {
            _id: {
              status: '$status',
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Grievance trends
      Grievance.aggregate([
        { $match: { createdAt: dateFilter } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Scheme popularity
      Application.aggregate([
        { $match: { createdAt: dateFilter } },
        {
          $group: {
            _id: '$schemeId',
            applicationCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'welfareschemes',
            localField: '_id',
            foreignField: '_id',
            as: 'scheme'
          }
        },
        { $unwind: '$scheme' },
        {
          $project: {
            title: '$scheme.title',
            category: '$scheme.category',
            applicationCount: 1
          }
        },
        { $sort: { applicationCount: -1 } },
        { $limit: 10 }
      ]),
      
      // Emergency alert statistics
      EmergencyAlert.aggregate([
        { $match: { createdAt: dateFilter } },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      period,
      userGrowth,
      applicationTrends,
      grievanceTrends,
      schemePopularity,
      emergencyStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

module.exports = router;
