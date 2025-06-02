const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles, checkOwnership } = require('../middleware/auth');
const { validateWelfareScheme, validateApplication } = require('../middleware/validation');
const { uploadDocuments } = require('../middleware/upload');
const WelfareScheme = require('../models/WelfareScheme');
const Application = require('../models/Application');
const User = require('../models/User');
const { createNotification } = require('../utils/notification');

// Get all welfare schemes
router.get('/schemes', authenticateUser, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      service, 
      search, 
      status = 'active' 
    } = req.query;
    
    const user = req.user; // Use req.user directly since auth middleware provides full user object
    
    const query = {};
    
    if (status === 'active') {
      query.isActive = true;
      query.applicationDeadline = { $gte: new Date() };
    } else if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'expired') {
      query.applicationDeadline = { $lt: new Date() };
    }
    
    if (category) query.category = category;
    if (service && service !== 'all') {
      query.$or = [
        { eligibleServices: service },
        { eligibleServices: 'all' }
      ];
    }
    
    // Filter by user role
    if (user.role !== 'admin') {
      query.eligibleRoles = { $in: [user.role, 'all'] };
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const schemes = await WelfareScheme.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WelfareScheme.countDocuments(query);
    
    // For each scheme, check if user has applied
    const schemesWithApplicationStatus = await Promise.all(
      schemes.map(async (scheme) => {
        const application = await Application.findOne({
          schemeId: scheme._id,
          applicantId: user._id
        });
        
        return {
          ...scheme.toObject(),
          hasApplied: !!application,
          applicationStatus: application?.status || null,
          applicationId: application?._id || null
        };
      })
    );
    
    res.json({
      schemes: schemesWithApplicationStatus,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalSchemes: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching welfare schemes', error: error.message });
  }
});

// Get scheme by ID
router.get('/schemes/:id', authenticateUser, async (req, res) => {
  try {
    const scheme = await WelfareScheme.findById(req.params.id);
    
    if (!scheme) {
      return res.status(404).json({ message: 'Welfare scheme not found' });
    }
    
    const user = req.user; // Use req.user directly
    
    // Check if user has applied
    const application = await Application.findOne({
      schemeId: scheme._id,
      applicantId: user._id
    });
    
    // Get application statistics
    const stats = await Application.aggregate([
      { $match: { schemeId: scheme._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const schemeData = {
      ...scheme.toObject(),
      hasApplied: !!application,
      applicationStatus: application?.status || null,
      applicationId: application?._id || null,
      statistics: stats
    };
    
    res.json(schemeData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching welfare scheme', error: error.message });
  }
});

// Create new welfare scheme (admin only)
router.post('/schemes', 
  authenticateUser, 
  authorizeRoles(['admin']),
  validateWelfareScheme,
  async (req, res) => {
    try {
      const scheme = new WelfareScheme(req.body);
      await scheme.save();
      
      // Notify eligible users
      const eligibleUsers = await User.find({
        role: { $in: scheme.eligibleRoles },
        service: { $in: scheme.eligibleServices === 'all' ? 
          ['army', 'navy', 'airforce'] : [scheme.eligibleServices] },
        isActive: true
      });
      
      await Promise.all(
        eligibleUsers.map(user => 
          createNotification({
            userId: user._id,
            title: 'New Welfare Scheme Available',
            message: `A new welfare scheme "${scheme.title}" is now available for applications.`,
            type: 'info',
            relatedId: scheme._id,
            relatedType: 'welfare_scheme'
          })
        )
      );
      
      res.status(201).json({ 
        message: 'Welfare scheme created successfully', 
        scheme 
      });
    } catch (error) {
      res.status(500).json({ message: 'Error creating welfare scheme', error: error.message });
    }
  }
);

// Update welfare scheme (admin only)
router.put('/schemes/:id', 
  authenticateUser, 
  authorizeRoles(['admin']),
  validateWelfareScheme,
  async (req, res) => {
    try {
      const scheme = await WelfareScheme.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      
      if (!scheme) {
        return res.status(404).json({ message: 'Welfare scheme not found' });
      }
      
      res.json({ message: 'Welfare scheme updated successfully', scheme });
    } catch (error) {
      res.status(500).json({ message: 'Error updating welfare scheme', error: error.message });
    }
  }
);

// Delete welfare scheme (admin only)
router.delete('/schemes/:id', 
  authenticateUser, 
  authorizeRoles(['admin']),
  async (req, res) => {
    try {
      const scheme = await WelfareScheme.findById(req.params.id);
      
      if (!scheme) {
        return res.status(404).json({ message: 'Welfare scheme not found' });
      }
      
      // Check if there are pending applications
      const pendingApplications = await Application.countDocuments({
        schemeId: scheme._id,
        status: { $in: ['pending', 'under_review'] }
      });
      
      if (pendingApplications > 0) {
        return res.status(400).json({ 
          message: 'Cannot delete scheme with pending applications' 
        });
      }
      
      await WelfareScheme.findByIdAndDelete(req.params.id);
      
      res.json({ message: 'Welfare scheme deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting welfare scheme', error: error.message });
    }
  }
);

// Apply for welfare scheme
router.post('/schemes/:id/apply', 
  authenticateUser,
  uploadDocuments,
  validateApplication,
  async (req, res) => {
    try {
      const scheme = await WelfareScheme.findById(req.params.id);
      
      if (!scheme) {
        return res.status(404).json({ message: 'Welfare scheme not found' });
      }
      
      if (!scheme.isActive || scheme.applicationDeadline < new Date()) {
        return res.status(400).json({ message: 'Scheme is not available for applications' });
      }
      
      const user = req.user; // Use req.user directly
      
      // Check eligibility
      if (!scheme.eligibleRoles.includes(user.role) && !scheme.eligibleRoles.includes('all')) {
        return res.status(403).json({ message: 'You are not eligible for this scheme' });
      }
      
      if (scheme.eligibleServices !== 'all' && !scheme.eligibleServices.includes(user.service)) {
        return res.status(403).json({ message: 'Your service is not eligible for this scheme' });
      }
      
      // Check if already applied
      const existingApplication = await Application.findOne({
        schemeId: scheme._id,
        applicantId: user._id
      });
      
      if (existingApplication) {
        return res.status(400).json({ message: 'You have already applied for this scheme' });
      }
      
      // Process uploaded documents
      const documents = req.files ? req.files.map(file => ({
        name: file.originalname,
        path: `/uploads/documents/${file.filename}`,
        size: file.size,
        mimeType: file.mimetype
      })) : [];
      
      // Create application
      const application = new Application({
        schemeId: scheme._id,
        applicantId: user._id,
        applicationData: JSON.parse(req.body.applicationData || '{}'),
        documents,
        status: 'pending'
      });
      
      await application.save();
      
      // Update scheme statistics
      scheme.statistics.totalApplications += 1;
      await scheme.save();
      
      // Create notification for admins
      const admins = await User.find({ role: 'admin', isActive: true });
      await Promise.all(
        admins.map(admin => 
          createNotification({
            userId: admin._id,
            title: 'New Application Received',
            message: `${user.name} has applied for ${scheme.title}`,
            type: 'info',
            relatedId: application._id,
            relatedType: 'application'
          })
        )
      );
      
      // Create notification for applicant
      await createNotification({
        userId: user._id,
        title: 'Application Submitted',
        message: `Your application for ${scheme.title} has been submitted successfully`,
        type: 'success',
        relatedId: application._id,
        relatedType: 'application'
      });
      
      res.status(201).json({ 
        message: 'Application submitted successfully', 
        application: {
          _id: application._id,
          status: application.status,
          submittedAt: application.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error submitting application', error: error.message });
    }
  }
);

// Get user's applications
router.get('/applications', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const user = req.user; // Use req.user directly
    
    const query = { applicantId: user._id };
    if (status) query.status = status;
    
    const applications = await Application.find(query)
      .populate('schemeId', 'title category description')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Application.countDocuments(query);
    
    res.json({
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      totalApplications: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching applications', error: error.message });
  }
});

// Get application by ID
router.get('/applications/:id', authenticateUser, async (req, res) => {
  try {
    const user = req.user; // Use req.user directly
    
    const query = { _id: req.params.id };
    if (user.role !== 'admin') {
      query.applicantId = user._id;
    }
    
    const application = await Application.findOne(query)
      .populate('schemeId', 'title category description')
      .populate('applicantId', 'name rank service unit email')
      .populate('workflow.actionBy', 'name role');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching application', error: error.message });
  }
});

// Update application status (admin only)
router.put('/applications/:id/status', 
  authenticateUser, 
  authorizeRoles(['admin']),
  async (req, res) => {
    try {
      const { status, comments, documents } = req.body;
      const user = req.user; // Use req.user directly
      
      const application = await Application.findById(req.params.id)
        .populate('applicantId', 'name email')
        .populate('schemeId', 'title');
      
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      
      // Add to workflow
      application.workflow.push({
        status,
        actionBy: user._id,
        actionDate: new Date(),
        comments,
        documents
      });
      
      application.status = status;
      if (status === 'approved') {
        application.approvedAt = new Date();
        application.approvedBy = user._id;
      }
      
      await application.save();
      
      // Create notification for applicant
      const notificationTypes = {
        approved: 'success',
        rejected: 'error',
        under_review: 'info',
        pending: 'info'
      };
      
      await createNotification({
        userId: application.applicantId._id,
        title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your application for ${application.schemeId.title} has been ${status}`,
        type: notificationTypes[status] || 'info',
        relatedId: application._id,
        relatedType: 'application'
      });
      
      res.json({ message: 'Application status updated successfully', application });
    } catch (error) {
      res.status(500).json({ message: 'Error updating application status', error: error.message });
    }
  }
);

// Get all applications (admin only)
router.get('/admin/applications', 
  authenticateUser, 
  authorizeRoles(['admin']),
  async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status, 
        scheme, 
        service,
        search 
      } = req.query;
      
      const query = {};
      if (status) query.status = status;
      if (scheme) query.schemeId = scheme;
      
      let applications = await Application.find(query)
        .populate('schemeId', 'title category')
        .populate('applicantId', 'name rank service unit email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      // Filter by service if specified
      if (service) {
        applications = applications.filter(app => app.applicantId.service === service);
      }
      
      // Filter by search if specified
      if (search) {
        applications = applications.filter(app => 
          app.applicantId.name.toLowerCase().includes(search.toLowerCase()) ||
          app.schemeId.title.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      const total = await Application.countDocuments(query);
      
      res.json({
        applications,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        totalApplications: total
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching applications', error: error.message });
    }
  }
);

// Get scheme categories
router.get('/categories', authenticateUser, async (req, res) => {
  try {
    const categories = await WelfareScheme.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Get application statistics
router.get('/statistics', authenticateUser, authorizeRoles(['admin']), async (req, res) => {
  try {
    const [
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      applicationsByScheme,
      applicationsByService,
      monthlyApplications
    ] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: 'pending' }),
      Application.countDocuments({ status: 'approved' }),
      Application.countDocuments({ status: 'rejected' }),
      
      Application.aggregate([
        {
          $group: {
            _id: '$schemeId',
            count: { $sum: 1 }
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
            count: 1
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      Application.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'applicantId',
            foreignField: '_id',
            as: 'applicant'
          }
        },
        { $unwind: '$applicant' },
        {
          $group: {
            _id: '$applicant.service',
            count: { $sum: 1 }
          }
        }
      ]),
      
      Application.aggregate([
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
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      applicationsByScheme,
      applicationsByService,
      monthlyApplications
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

module.exports = router;