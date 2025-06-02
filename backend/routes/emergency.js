const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/auth');
const { validateEmergencyAlert } = require('../middleware/validation');
const EmergencyAlert = require('../models/EmergencyAlert');
const User = require('../models/User');
const { createNotification } = require('../utils/notification');
const { getSocketInstance } = require('../utils/socket');

// Create emergency alert (SOS)
router.post('/alerts', authenticateUser, validateEmergencyAlert, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const alert = new EmergencyAlert({
      ...req.body,
      userId: user._id,
      status: 'active'
    });

    await alert.save();

    // Get nearby emergency contacts and response team
    const nearbyUsers = await User.find({
      'emergencyContacts.contactId': user._id,
      isActive: true
    }).populate('emergencyContacts.contactId');

    const responseTeam = await User.find({
      role: { $in: ['admin', 'officer'] },
      unit: user.unit,
      isActive: true
    });

    // Assign initial response team
    alert.responseTeam = responseTeam.slice(0, 3).map(member => ({
      memberId: member._id,
      role: member.role,
      assignedAt: new Date(),
      status: 'assigned'
    }));

    await alert.save();

    // Real-time notifications via Socket.io
    const io = getSocketInstance();
    
    // Notify emergency contacts
    nearbyUsers.forEach(contact => {
      io.to(`user_${contact._id}`).emit('emergency_alert', {
        type: 'emergency',
        alert: {
          _id: alert._id,
          severity: alert.severity,
          type: alert.type,
          location: alert.location,
          user: {
            name: `${user.firstName} ${user.lastName}`,
            rank: user.rank,
            unit: user.unit
          },
          timestamp: alert.createdAt
        }
      });
    });

    // Notify response team
    responseTeam.forEach(member => {
      io.to(`user_${member._id}`).emit('emergency_alert', {
        type: 'emergency_assignment',
        alert: {
          _id: alert._id,
          severity: alert.severity,
          type: alert.type,
          location: alert.location,
          user: {
            name: `${user.firstName} ${user.lastName}`,
            rank: user.rank,
            unit: user.unit
          },
          timestamp: alert.createdAt
        }
      });
    });

    // Create database notifications
    const notificationPromises = [
      // Notify emergency contacts
      ...nearbyUsers.map(contact => 
        createNotification({
          userId: contact._id,
          title: 'Emergency Alert',
          message: `${user.firstName} ${user.lastName} has triggered an emergency alert`,
          type: 'emergency',
          relatedId: alert._id,
          relatedType: 'emergency_alert',
          priority: 'high'
        })
      ),
      // Notify response team
      ...responseTeam.map(member => 
        createNotification({
          userId: member._id,
          title: 'Emergency Response Assignment',
          message: `You have been assigned to respond to an emergency alert from ${user.firstName} ${user.lastName}`,
          type: 'emergency',
          relatedId: alert._id,
          relatedType: 'emergency_alert',
          priority: 'high'
        })
      )
    ];

    await Promise.all(notificationPromises);

    res.status(201).json({ 
      message: 'Emergency alert created successfully', 
      alert: {
        _id: alert._id,
        status: alert.status,
        responseTeam: alert.responseTeam.length,
        notifiedContacts: nearbyUsers.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating emergency alert', error: error.message });
  }
});

// Get emergency alerts
router.get('/alerts', authenticateUser, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      severity, 
      type,
      myAlerts = false 
    } = req.query;
    
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    let query = {};
    
    if (myAlerts === 'true') {
      query.userId = user._id;
    } else if (user.role !== 'admin') {
      // Show alerts where user is in response team or emergency contact
      query.$or = [
        { 'responseTeam.memberId': user._id },
        { userId: { $in: user.emergencyContacts.map(ec => ec.contactId) } },
        { userId: user._id }
      ];
    }
    
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (type) query.type = type;

    const alerts = await EmergencyAlert.find(query)
      .populate('userId', 'firstName lastName rank unit service')
      .populate('responseTeam.memberId', 'firstName lastName rank role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await EmergencyAlert.countDocuments(query);
    
    res.json({
      alerts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalAlerts: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching emergency alerts', error: error.message });
  }
});

// Get alert by ID
router.get('/alerts/:id', authenticateUser, async (req, res) => {
  try {
    const alert = await EmergencyAlert.findById(req.params.id)
      .populate('userId', 'firstName lastName rank unit service phone email')
      .populate('responseTeam.memberId', 'firstName lastName rank role phone email')
      .populate('updates.updatedBy', 'firstName lastName role');

    if (!alert) {
      return res.status(404).json({ message: 'Emergency alert not found' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    // Check access permissions
    const hasAccess = user.role === 'admin' || 
                     alert.userId.toString() === user._id.toString() ||
                     alert.responseTeam.some(member => member.memberId._id.toString() === user._id.toString()) ||
                     user.emergencyContacts.some(ec => ec.contactId.toString() === alert.userId._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching emergency alert', error: error.message });
  }
});

// Update alert status
router.put('/alerts/:id/status', authenticateUser, async (req, res) => {
  try {
    const { status, comments, location } = req.body;
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    const alert = await EmergencyAlert.findById(req.params.id)
      .populate('userId', 'firstName lastName');

    if (!alert) {
      return res.status(404).json({ message: 'Emergency alert not found' });
    }

    // Check if user has permission to update
    const canUpdate = user.role === 'admin' || 
                     alert.userId._id.toString() === user._id.toString() ||
                     alert.responseTeam.some(member => member.memberId.toString() === user._id.toString());

    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add update to history
    alert.updates.push({
      status: status || alert.status,
      updatedBy: user._id,
      updatedAt: new Date(),
      comments,
      location: location || alert.location
    });

    if (status) {
      alert.status = status;
      if (status === 'resolved') {
        alert.resolvedAt = new Date();
        alert.resolvedBy = user._id;
      }
    }

    if (location) {
      alert.location = location;
    }

    await alert.save();

    // Real-time update via Socket.io
    const io = getSocketInstance();
    
    // Notify all involved parties
    const notifyUserIds = [
      alert.userId._id,
      ...alert.responseTeam.map(member => member.memberId)
    ];

    notifyUserIds.forEach(userId => {
      io.to(`user_${userId}`).emit('emergency_update', {
        alertId: alert._id,
        status: alert.status,
        update: alert.updates[alert.updates.length - 1],
        updatedBy: {
          name: `${user.firstName} ${user.lastName}`,
          role: user.role
        }
      });
    });

    // Create notifications
    const notificationPromises = notifyUserIds
      .filter(userId => userId.toString() !== user._id.toString())
      .map(userId => 
        createNotification({
          userId,
          title: 'Emergency Alert Updated',
          message: `Emergency alert has been updated to ${status || 'in progress'}`,
          type: 'info',
          relatedId: alert._id,
          relatedType: 'emergency_alert'
        })
      );

    await Promise.all(notificationPromises);

    res.json({ message: 'Alert updated successfully', alert });
  } catch (error) {
    res.status(500).json({ message: 'Error updating alert', error: error.message });
  }
});

// Respond to emergency alert
router.post('/alerts/:id/respond', authenticateUser, async (req, res) => {
  try {
    const { response, eta, currentLocation } = req.body;
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    const alert = await EmergencyAlert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ message: 'Emergency alert not found' });
    }

    // Check if user is in response team
    const teamMember = alert.responseTeam.find(
      member => member.memberId.toString() === user._id.toString()
    );

    if (!teamMember && user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not assigned to this emergency' });
    }

    // Update response team member status
    if (teamMember) {
      teamMember.status = response;
      teamMember.responseTime = new Date();
      teamMember.eta = eta;
      teamMember.currentLocation = currentLocation;
    } else if (user.role === 'admin') {
      // Admin can join response team
      alert.responseTeam.push({
        memberId: user._id,
        role: user.role,
        assignedAt: new Date(),
        status: response,
        responseTime: new Date(),
        eta,
        currentLocation
      });
    }

    // Add to updates
    alert.updates.push({
      status: alert.status,
      updatedBy: user._id,
      updatedAt: new Date(),
      comments: `Response team member ${response}${eta ? ` - ETA: ${eta}` : ''}`,
      location: currentLocation || alert.location
    });

    await alert.save();

    // Real-time update
    const io = getSocketInstance();
    io.to(`user_${alert.userId}`).emit('emergency_response', {
      alertId: alert._id,
      responder: {
        name: `${user.firstName} ${user.lastName}`,
        rank: user.rank,
        role: user.role
      },
      response,
      eta,
      currentLocation
    });

    // Notify alert creator
    await createNotification({
      userId: alert.userId,
      title: 'Emergency Response Update',
      message: `${user.firstName} ${user.lastName} has ${response} to your emergency alert`,
      type: 'info',
      relatedId: alert._id,
      relatedType: 'emergency_alert'
    });

    res.json({ message: 'Response recorded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error recording response', error: error.message });
  }
});

// Get emergency contacts
router.get('/contacts', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid })
      .populate('emergencyContacts.contactId', 'firstName lastName rank unit service phone email avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const contacts = user.emergencyContacts
      .sort((a, b) => a.priority - b.priority)
      .map(contact => ({
        _id: contact._id,
        contact: contact.contactId,
        relationship: contact.relationship,
        priority: contact.priority,
        addedAt: contact.addedAt
      }));

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching emergency contacts', error: error.message });
  }
});

// Get emergency statistics (admin only)
router.get('/statistics', authenticateUser, authorizeRoles(['admin']), async (req, res) => {
  try {
    const [
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      averageResponseTime,
      alertsBySeverity,
      alertsByType,
      alertsByUnit,
      monthlyAlerts
    ] = await Promise.all([
      EmergencyAlert.countDocuments(),
      EmergencyAlert.countDocuments({ status: 'active' }),
      EmergencyAlert.countDocuments({ status: 'resolved' }),
      
      // Calculate average response time
      EmergencyAlert.aggregate([
        { $match: { status: 'resolved', resolvedAt: { $exists: true } } },
        {
          $project: {
            responseTime: {
              $divide: [
                { $subtract: ['$resolvedAt', '$createdAt'] },
                1000 * 60 // Convert to minutes
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$responseTime' }
          }
        }
      ]),
      
      EmergencyAlert.aggregate([
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        }
      ]),
      
      EmergencyAlert.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]),
      
      EmergencyAlert.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $group: {
            _id: '$user.unit',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      EmergencyAlert.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 }
      ])
    ]);
    
    res.json({
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      averageResponseTime: averageResponseTime[0]?.avgResponseTime || 0,
      alertsBySeverity,
      alertsByType,
      alertsByUnit,
      monthlyAlerts
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Get nearby emergency alerts
router.get('/alerts/nearby', authenticateUser, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query; // radius in km
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Location coordinates required' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    // Find alerts within radius
    const alerts = await EmergencyAlert.find({
      status: 'active',
      'location.coordinates': {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(longitude), parseFloat(latitude)],
            radius / 6371 // Convert km to radians
          ]
        }
      }
    })
    .populate('userId', 'firstName lastName rank unit service')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching nearby alerts', error: error.message });
  }
});

// Send emergency broadcast (admin only)
router.post('/broadcast', 
  authenticateUser, 
  authorizeRoles(['admin']),
  async (req, res) => {
    try {
      const { message, severity, targetUnits, targetServices } = req.body;
      const user = await User.findOne({ firebaseUid: req.user.uid });
      
      // Build target user query
      let userQuery = { isActive: true };
      
      if (targetUnits && targetUnits.length > 0) {
        userQuery.unit = { $in: targetUnits };
      }
      
      if (targetServices && targetServices.length > 0) {
        userQuery.service = { $in: targetServices };
      }
      
      const targetUsers = await User.find(userQuery);
      
      // Create broadcast alert
      const broadcast = new EmergencyAlert({
        userId: user._id,
        type: 'broadcast',
        severity: severity || 'medium',
        description: message,
        location: {
          type: 'Point',
          coordinates: [0, 0], // Default coordinates for broadcast
          address: 'System Broadcast'
        },
        status: 'active'
      });
      
      await broadcast.save();
      
      // Send real-time notifications
      const io = getSocketInstance();
      const notificationPromises = targetUsers.map(targetUser => {
        // Real-time socket notification
        io.to(`user_${targetUser._id}`).emit('emergency_broadcast', {
          type: 'broadcast',
          severity,
          message,
          timestamp: new Date(),
          from: `${user.firstName} ${user.lastName}`
        });
        
        // Database notification
        return createNotification({
          userId: targetUser._id,
          title: 'Emergency Broadcast',
          message,
          type: 'emergency',
          relatedId: broadcast._id,
          relatedType: 'emergency_alert',
          priority: 'high'
        });
      });
      
      await Promise.all(notificationPromises);
      
      res.json({ 
        message: 'Broadcast sent successfully',
        targetedUsers: targetUsers.length,
        broadcastId: broadcast._id
      });
    } catch (error) {
      res.status(500).json({ message: 'Error sending broadcast', error: error.message });
    }
  }
);

module.exports = router;
