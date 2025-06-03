const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles, checkOwnership } = require('../middleware/auth');
const { validateGrievance } = require('../middleware/validation');
const { uploadGrievanceAttachment } = require('../middleware/upload');
const Grievance = require('../models/Grievance');
const User = require('../models/User');
const { createNotification } = require('../utils/notification');

// Submit grievance
router.post('/', 
  authenticateUser,
  uploadGrievanceAttachment,
  validateGrievance,
  async (req, res) => {
    try {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      
      // Process uploaded attachments
      const attachments = req.files ? req.files.map(file => ({
        filename: file.originalname,
        path: `/uploads/documents/${file.filename}`,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date()
      })) : [];

      const grievance = new Grievance({
        ...req.body,
        userId: user._id,
        attachments,
        status: 'open',
        priority: req.body.priority || 'medium'
      });

      await grievance.save();

      // Notify admins about new grievance
      const admins = await User.find({ role: 'admin', isActive: true });
      const notificationPromises = admins.map(admin => 
        createNotification({
          userId: admin._id,
          title: 'New Grievance Submitted',
          message: `${user.firstName} ${user.lastName} has submitted a grievance: ${grievance.subject}`,
          type: 'info',
          relatedId: grievance._id,
          relatedType: 'grievance',
          priority: grievance.priority
        })
      );

      await Promise.all(notificationPromises);

      // Create confirmation notification for user
      await createNotification({
        userId: user._id,
        title: 'Grievance Submitted Successfully',
        message: `Your grievance "${grievance.subject}" has been submitted and will be reviewed soon.`,
        type: 'success',
        relatedId: grievance._id,
        relatedType: 'grievance'
      });

      res.status(201).json({ 
        message: 'Grievance submitted successfully', 
        grievance: {
          _id: grievance._id,
          ticketNumber: grievance.ticketNumber,
          subject: grievance.subject,
          status: grievance.status,
          submittedAt: grievance.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error submitting grievance', error: error.message });
    }
  }
);

// Get grievances
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      priority,
      myGrievances = false 
    } = req.query;
    
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    let query = {};
    
    // Non-admin users can only see their own grievances unless explicitly viewing all
    if (user.role !== 'admin' || myGrievances === 'true') {
      query.userId = user._id;
    }
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const grievances = await Grievance.find(query)
      .populate('userId', 'firstName lastName rank unit service')
      .populate('assignedTo', 'firstName lastName role')
      .populate('communications.responderId', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Grievance.countDocuments(query);
    
    res.json({
      grievances,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalGrievances: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grievances', error: error.message });
  }
});

// Get grievance by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    const grievance = await Grievance.findById(req.params.id)
      .populate('userId', 'firstName lastName rank unit service email phone')
      .populate('assignedTo', 'firstName lastName role email')
      .populate('communications.responderId', 'firstName lastName role avatar')
      .populate('escalation.escalatedTo', 'firstName lastName role')
      .populate('escalation.escalatedBy', 'firstName lastName role');

    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }

    // Check access permissions
    const hasAccess = user.role === 'admin' || 
                     grievance.userId._id.toString() === user._id.toString() ||
                     (grievance.assignedTo && grievance.assignedTo._id.toString() === user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark as viewed by current user if it's not the grievance submitter
    if (user._id.toString() !== grievance.userId._id.toString()) {
      if (!grievance.viewedBy.some(view => view.userId.toString() === user._id.toString())) {
        grievance.viewedBy.push({
          userId: user._id,
          viewedAt: new Date()
        });
        await grievance.save();
      }
    }

    res.json(grievance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grievance', error: error.message });
  }
});

// Update grievance status (admin only)
router.put('/:id/status', 
  authenticateUser, 
  authorizeRoles(['admin']),
  async (req, res) => {
    try {
      const { status, comments, assignedTo } = req.body;
      const user = await User.findOne({ firebaseUid: req.user.uid });
      
      const grievance = await Grievance.findById(req.params.id)
        .populate('userId', 'firstName lastName email');

      if (!grievance) {
        return res.status(404).json({ message: 'Grievance not found' });
      }

      // Update status and assignment
      grievance.status = status;
      if (assignedTo) {
        grievance.assignedTo = assignedTo;
        grievance.assignedAt = new Date();
      }

      // Add status change to communications
      grievance.communications.push({
        message: comments || `Status changed to ${status}`,
        responderId: user._id,
        type: 'status_update',
        timestamp: new Date()
      });

      if (status === 'resolved') {
        grievance.resolvedAt = new Date();
        grievance.resolvedBy = user._id;
      } else if (status === 'closed') {
        grievance.closedAt = new Date();
        grievance.closedBy = user._id;
      }

      await grievance.save();

      // Create notifications
      const notifications = [];

      // Notify grievance submitter
      notifications.push(createNotification({
        userId: grievance.userId._id,
        title: `Grievance ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your grievance "${grievance.subject}" has been ${status}`,
        type: status === 'resolved' ? 'success' : 'info',
        relatedId: grievance._id,
        relatedType: 'grievance'
      }));

      // Notify assigned person if different from current user
      if (assignedTo && assignedTo !== user._id.toString()) {
        notifications.push(createNotification({
          userId: assignedTo,
          title: 'Grievance Assigned',
          message: `You have been assigned to handle grievance: ${grievance.subject}`,
          type: 'info',
          relatedId: grievance._id,
          relatedType: 'grievance',
          priority: grievance.priority
        }));
      }

      await Promise.all(notifications);

      res.json({ message: 'Grievance status updated successfully', grievance });
    } catch (error) {
      res.status(500).json({ message: 'Error updating grievance status', error: error.message });
    }
  }
);

// Add response/communication to grievance
router.post('/:id/communications', 
  authenticateUser,
  uploadGrievanceAttachment,
  async (req, res) => {
    try {
      const { message, type = 'response' } = req.body;
      const user = await User.findOne({ firebaseUid: req.user.uid });
      
      const grievance = await Grievance.findById(req.params.id)
        .populate('userId', 'firstName lastName email');

      if (!grievance) {
        return res.status(404).json({ message: 'Grievance not found' });
      }

      // Check access permissions
      const hasAccess = user.role === 'admin' || 
                       grievance.userId._id.toString() === user._id.toString() ||
                       (grievance.assignedTo && grievance.assignedTo.toString() === user._id.toString());

      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Process attachments
      const attachments = req.files ? req.files.map(file => ({
        filename: file.originalname,
        path: `/uploads/documents/${file.filename}`,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date()
      })) : [];

      // Add communication
      grievance.communications.push({
        message,
        responderId: user._id,
        type,
        attachments,
        timestamp: new Date()
      });

      // Update status if it's still open and this is an admin response
      if (grievance.status === 'open' && user.role === 'admin') {
        grievance.status = 'in_progress';
      }

      // Update last activity
      grievance.lastActivityAt = new Date();

      await grievance.save();

      // Create notification for the other party
      let notificationUserId;
      let notificationMessage;

      if (user._id.toString() === grievance.userId._id.toString()) {
        // User responded, notify admin/assigned person
        notificationUserId = grievance.assignedTo || await User.findOne({ role: 'admin' })._id;
        notificationMessage = `${user.firstName} ${user.lastName} responded to grievance: ${grievance.subject}`;
      } else {
        // Admin/assigned person responded, notify user
        notificationUserId = grievance.userId._id;
        notificationMessage = `New response received for your grievance: ${grievance.subject}`;
      }

      await createNotification({
        userId: notificationUserId,
        title: 'Grievance Update',
        message: notificationMessage,
        type: 'info',
        relatedId: grievance._id,
        relatedType: 'grievance'
      });

      res.json({ message: 'Response added successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error adding response', error: error.message });
    }
  }
);

// Escalate grievance
router.post('/:id/escalate', 
  authenticateUser,
  async (req, res) => {
    try {
      const { escalationReason, escalateTo } = req.body;
      const user = await User.findOne({ firebaseUid: req.user.uid });
      
      const grievance = await Grievance.findById(req.params.id)
        .populate('userId', 'firstName lastName');

      if (!grievance) {
        return res.status(404).json({ message: 'Grievance not found' });
      }

      // Check if user can escalate (grievance owner or assigned admin)
      const canEscalate = user._id.toString() === grievance.userId._id.toString() ||
                         (user.role === 'admin' && grievance.assignedTo && 
                          grievance.assignedTo.toString() === user._id.toString());

      if (!canEscalate) {
        return res.status(403).json({ message: 'You cannot escalate this grievance' });
      }

      // Check if already escalated recently
      if (grievance.escalation.length > 0) {
        const lastEscalation = grievance.escalation[grievance.escalation.length - 1];
        const hoursSinceLastEscalation = (new Date() - lastEscalation.escalatedAt) / (1000 * 60 * 60);
        
        if (hoursSinceLastEscalation < 24) {
          return res.status(400).json({ 
            message: 'Grievance can only be escalated once per 24 hours' 
          });
        }
      }

      // Find escalation target (higher authority)
      let escalationTarget;
      if (escalateTo) {
        escalationTarget = await User.findById(escalateTo);
      } else {
        // Auto-assign to available admin
        escalationTarget = await User.findOne({ 
          role: 'admin', 
          isActive: true,
          _id: { $ne: grievance.assignedTo }
        });
      }

      if (!escalationTarget) {
        return res.status(400).json({ message: 'No available authority for escalation' });
      }

      // Add escalation record
      grievance.escalation.push({
        escalatedBy: user._id,
        escalatedTo: escalationTarget._id,
        escalatedAt: new Date(),
        reason: escalationReason,
        previousStatus: grievance.status
      });

      // Update grievance
      grievance.status = 'escalated';
      grievance.priority = grievance.priority === 'low' ? 'medium' : 
                          grievance.priority === 'medium' ? 'high' : 'critical';
      grievance.assignedTo = escalationTarget._id;
      grievance.lastActivityAt = new Date();

      // Add communication entry
      grievance.communications.push({
        message: `Grievance escalated: ${escalationReason}`,
        responderId: user._id,
        type: 'escalation',
        timestamp: new Date()
      });

      await grievance.save();

      // Create notifications
      const notifications = [
        // Notify escalation target
        createNotification({
          userId: escalationTarget._id,
          title: 'Grievance Escalated to You',
          message: `A grievance has been escalated to you: ${grievance.subject}`,
          type: 'warning',
          relatedId: grievance._id,
          relatedType: 'grievance',
          priority: 'high'
        }),
        
        // Notify grievance owner if not the one escalating
        ...(user._id.toString() !== grievance.userId._id.toString() ? [
          createNotification({
            userId: grievance.userId._id,
            title: 'Your Grievance Has Been Escalated',
            message: `Your grievance "${grievance.subject}" has been escalated to higher authority`,
            type: 'info',
            relatedId: grievance._id,
            relatedType: 'grievance'
          })
        ] : [])
      ];

      await Promise.all(notifications);

      res.json({ message: 'Grievance escalated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error escalating grievance', error: error.message });
    }
  }
);

// Get grievance categories
router.get('/categories', authenticateUser, async (req, res) => {
  try {
    const categories = await Grievance.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get grievance statistics
router.get('/statistics', authenticateUser, authorizeRoles(['admin']), async (req, res) => {
  try {
    const [
      totalGrievances,
      openGrievances,
      inProgressGrievances,
      resolvedGrievances,
      escalatedGrievances,
      grievancesByCategory,
      grievancesByPriority,
      averageResolutionTime,
      monthlyGrievances,
      topCategories
    ] = await Promise.all([
      Grievance.countDocuments(),
      Grievance.countDocuments({ status: 'open' }),
      Grievance.countDocuments({ status: 'in_progress' }),
      Grievance.countDocuments({ status: 'resolved' }),
      Grievance.countDocuments({ status: 'escalated' }),
      
      Grievance.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      Grievance.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      
      // Calculate average resolution time
      Grievance.aggregate([
        { $match: { status: 'resolved', resolvedAt: { $exists: true } } },
        {
          $project: {
            resolutionTime: {
              $divide: [
                { $subtract: ['$resolvedAt', '$createdAt'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgResolutionTime: { $avg: '$resolutionTime' }
          }
        }
      ]),
      
      Grievance.aggregate([
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
      ]),
      
      Grievance.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);
    
    res.json({
      totalGrievances,
      openGrievances,
      inProgressGrievances,
      resolvedGrievances,
      escalatedGrievances,
      grievancesByCategory,
      grievancesByPriority,
      averageResolutionTime: averageResolutionTime[0]?.avgResolutionTime || 0,
      monthlyGrievances,
      topCategories
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Get user's grievance summary
router.get('/my-summary', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    const [
      totalGrievances,
      openGrievances,
      inProgressGrievances,
      resolvedGrievances,
      recentGrievances
    ] = await Promise.all([
      Grievance.countDocuments({ userId: user._id }),
      Grievance.countDocuments({ userId: user._id, status: 'open' }),
      Grievance.countDocuments({ userId: user._id, status: 'in_progress' }),
      Grievance.countDocuments({ userId: user._id, status: 'resolved' }),
      
      Grievance.find({ userId: user._id })
        .select('subject status priority createdAt ticketNumber')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);
    
    res.json({
      totalGrievances,
      openGrievances,
      inProgressGrievances,
      resolvedGrievances,
      recentGrievances
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching grievance summary', error: error.message });
  }
});

// Search grievances
router.get('/search', authenticateUser, async (req, res) => {
  try {
    const { q, status, category, priority } = req.query;
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    let query = {
      $or: [
        { subject: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { ticketNumber: { $regex: q, $options: 'i' } }
      ]
    };

    // Non-admin users can only search their own grievances
    if (user.role !== 'admin') {
      query.userId = user._id;
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const grievances = await Grievance.find(query)
      .populate('userId', 'firstName lastName rank')
      .select('subject status priority category createdAt ticketNumber')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(grievances);
  } catch (error) {
    res.status(500).json({ message: 'Error searching grievances', error: error.message });
  }
});

// Bulk status update (admin only)
router.put('/bulk/status', 
  authenticateUser, 
  authorizeRoles(['admin']),
  async (req, res) => {
    try {
      const { grievanceIds, status, comments } = req.body;
      const user = await User.findOne({ firebaseUid: req.user.uid });
      
      if (!grievanceIds || !Array.isArray(grievanceIds) || grievanceIds.length === 0) {
        return res.status(400).json({ message: 'Grievance IDs are required' });
      }

      const updatePromises = grievanceIds.map(async (id) => {
        const grievance = await Grievance.findById(id).populate('userId', 'firstName lastName');
        
        if (grievance) {
          grievance.status = status;
          grievance.communications.push({
            message: comments || `Bulk status update to ${status}`,
            responderId: user._id,
            type: 'status_update',
            timestamp: new Date()
          });

          if (status === 'resolved') {
            grievance.resolvedAt = new Date();
            grievance.resolvedBy = user._id;
          }

          await grievance.save();

          // Create notification for grievance owner
          return createNotification({
            userId: grievance.userId._id,
            title: `Grievance ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `Your grievance "${grievance.subject}" has been ${status}`,
            type: status === 'resolved' ? 'success' : 'info',
            relatedId: grievance._id,
            relatedType: 'grievance'
          });
        }
      });

      await Promise.all(updatePromises);

      res.json({ 
        message: `${grievanceIds.length} grievances updated successfully`,
        updatedCount: grievanceIds.length 
      });
    } catch (error) {
      res.status(500).json({ message: 'Error bulk updating grievances', error: error.message });
    }
  }
);

// Tickets API endpoints (aliases for frontend compatibility)
router.get('/tickets', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, category } = req.query;
    const user = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Build query
    const query = { userId: user._id };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const options = {
      skip: (page - 1) * limit,
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const tickets = await Grievance.find(query, null, options)
      .populate('userId', 'coreData.personalInfo.firstName coreData.personalInfo.lastName')
      .lean();

    const total = await Grievance.countDocuments(query);

    // Format response for frontend
    const formattedTickets = tickets.map(ticket => ({
      id: ticket._id,
      ticketId: ticket.ticketId,
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      submittedBy: `${ticket.userId?.coreData?.personalInfo?.firstName || ''} ${ticket.userId?.coreData?.personalInfo?.lastName || ''}`.trim(),
      submittedDate: ticket.createdAt.toISOString().split('T')[0],
      lastUpdate: ticket.updatedAt.toISOString().split('T')[0],
      assignedTo: ticket.assignedTo,
      expectedResolution: ticket.expectedResolution,
      attachments: ticket.attachments?.length || 0,
      resolution: ticket.resolution,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    }));

    res.json({
      success: true,
      data: {
        tickets: formattedTickets,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tickets' 
    });
  }
});

router.post('/tickets', 
  authenticateUser,
  uploadGrievanceAttachment,
  validateGrievance,
  async (req, res) => {
    try {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Parse ticketData if it's sent as form data
      let ticketData = req.body;
      if (typeof req.body.ticketData === 'string') {
        ticketData = JSON.parse(req.body.ticketData);
      }

      // Process uploaded attachments
      const attachments = req.files ? req.files.map(file => ({
        filename: file.originalname,
        path: `/uploads/documents/${file.filename}`,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date()
      })) : [];

      // Generate ticket ID
      const ticketId = `GRV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      const grievance = new Grievance({
        ticketId,
        title: ticketData.title,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority,
        userId: user._id,
        attachments,
        status: 'pending',
        submittedAt: new Date()
      });

      await grievance.save();

      // Create notification for admins
      try {
        await createNotification({
          type: 'new_grievance',
          title: 'New Grievance Submitted',
          message: `New grievance "${ticketData.title}" submitted by ${user.coreData?.personalInfo?.firstName || 'User'}`,
          recipients: ['admin'],
          data: { grievanceId: grievance._id }
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
      }

      res.status(201).json({
        success: true,
        message: 'Grievance submitted successfully',
        data: {
          id: grievance._id,
          ticketId: grievance.ticketId,
          status: grievance.status
        }
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to submit grievance' 
      });
    }
  }
);

router.get('/tickets/:id', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    const grievance = await Grievance.findById(req.params.id)
      .populate('userId', 'coreData.personalInfo.firstName coreData.personalInfo.lastName');
    
    if (!grievance) {
      return res.status(404).json({ 
        success: false, 
        message: 'Grievance not found' 
      });
    }

    // Check ownership or admin role
    if (grievance.userId._id.toString() !== user._id.toString() && 
        !user.coreData?.role?.includes('admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: grievance
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch ticket' 
    });
  }
});

router.post('/tickets/:id/comments', 
  authenticateUser,
  uploadGrievanceAttachment,
  async (req, res) => {
    try {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      const grievance = await Grievance.findById(req.params.id);
      
      if (!grievance) {
        return res.status(404).json({ 
          success: false, 
          message: 'Grievance not found' 
        });
      }

      // Check ownership or admin role
      if (grievance.userId.toString() !== user._id.toString() && 
          !user.coreData?.role?.includes('admin')) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied' 
        });
      }

      // Process uploaded attachments
      const attachments = req.files ? req.files.map(file => ({
        filename: file.originalname,
        path: `/uploads/documents/${file.filename}`,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date()
      })) : [];

      const comment = {
        userId: user._id,
        message: req.body.comment,
        attachments,
        createdAt: new Date()
      };

      grievance.communications = grievance.communications || [];
      grievance.communications.push(comment);
      await grievance.save();

      res.json({
        success: true,
        message: 'Comment added successfully',
        data: comment
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to add comment' 
      });
    }
  }
);

router.get('/tickets/:id/comments', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    const grievance = await Grievance.findById(req.params.id)
      .populate('communications.userId', 'coreData.personalInfo.firstName coreData.personalInfo.lastName');
    
    if (!grievance) {
      return res.status(404).json({ 
        success: false, 
        message: 'Grievance not found' 
      });
    }

    // Check ownership or admin role
    if (grievance.userId.toString() !== user._id.toString() && 
        !user.coreData?.role?.includes('admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      data: grievance.communications || []
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch comments' 
    });
  }
});

router.put('/tickets/:id/status', 
  authenticateUser,
  authorizeRoles(['admin']),
  async (req, res) => {
    try {
      const { status, resolution } = req.body;
      const grievance = await Grievance.findById(req.params.id);
      
      if (!grievance) {
        return res.status(404).json({ 
          success: false, 
          message: 'Grievance not found' 
        });
      }

      grievance.status = status;
      if (resolution) {
        grievance.resolution = resolution;
      }
      
      await grievance.save();

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: grievance
      });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update status' 
      });
    }
  }
);

router.put('/tickets/:id/assign', 
  authenticateUser,
  authorizeRoles(['admin']),
  async (req, res) => {
    try {
      const { assignedTo } = req.body;
      const grievance = await Grievance.findById(req.params.id);
      
      if (!grievance) {
        return res.status(404).json({ 
          success: false, 
          message: 'Grievance not found' 
        });
      }

      grievance.assignedTo = assignedTo;
      await grievance.save();

      res.json({
        success: true,
        message: 'Ticket assigned successfully',
        data: grievance
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to assign ticket' 
      });
    }
  }
);

module.exports = router;
