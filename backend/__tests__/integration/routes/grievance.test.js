const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../../models/User');
const Grievance = require('../../../models/Grievance');
const grievanceRoutes = require('../../../routes/grievance');
const errorHandler = require('../../../middleware/errorHandler');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/grievance', grievanceRoutes);
  app.use(errorHandler);
  return app;
};

describe('Grievance Routes Integration Tests', () => {
  let app;
  let testUser;
  let adminUser;
  let officerUser;
  let userToken;
  let adminToken;
  let officerToken;

  beforeEach(async () => {
    app = createTestApp();
    await global.testUtils.cleanDatabase();
    
    // Create test users
    testUser = await global.testUtils.createTestUser();
    adminUser = await global.testUtils.createTestUser({
      email: 'admin@army.mil',
      serviceNumber: 'ADMIN001',
      role: 'admin',
      firebaseUid: 'admin-firebase-uid'
    });
    officerUser = await global.testUtils.createTestUser({
      email: 'officer@army.mil',
      serviceNumber: 'OFF001',
      role: 'officer',
      rank: 'Major',
      unit: testUser.unit,
      firebaseUid: 'officer-firebase-uid'
    });

    // Generate tokens
    userToken = global.testUtils.generateTestToken({
      serviceNumber: testUser.serviceNumber,
      email: testUser.email,
      role: testUser.role
    });

    adminToken = global.testUtils.generateTestToken({
      serviceNumber: adminUser.serviceNumber,
      email: adminUser.email,
      role: adminUser.role
    });

    officerToken = global.testUtils.generateTestToken({
      serviceNumber: officerUser.serviceNumber,
      email: officerUser.email,
      role: officerUser.role
    });
  });

  describe('POST /grievance', () => {
    const validGrievanceData = {
      title: 'Test Grievance',
      description: 'This is a test grievance description',
      category: 'welfare',
      priority: 'medium',
      anonymousSubmission: false
    };

    test('should create grievance successfully', async () => {
      const response = await request(app)
        .post('/grievance')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validGrievanceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Grievance submitted successfully');
      expect(response.body.data.grievance.title).toBe(validGrievanceData.title);
      expect(response.body.data.grievance.category).toBe(validGrievanceData.category);
      expect(response.body.data.grievance.status).toBe('open');
      expect(response.body.data.grievance.submittedBy).toBe(testUser._id.toString());
      
      // Verify grievance was created in database
      const createdGrievance = await Grievance.findOne({ 
        title: validGrievanceData.title,
        submittedBy: testUser._id 
      });
      expect(createdGrievance).toBeTruthy();
      expect(createdGrievance.status).toBe('open');
    });

    test('should create anonymous grievance successfully', async () => {
      const anonymousData = {
        ...validGrievanceData,
        anonymousSubmission: true
      };

      const response = await request(app)
        .post('/grievance')
        .set('Authorization', `Bearer ${userToken}`)
        .send(anonymousData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievance.anonymousSubmission).toBe(true);
    });

    test('should create high priority grievance', async () => {
      const highPriorityData = {
        ...validGrievanceData,
        priority: 'high',
        category: 'harassment'
      };

      const response = await request(app)
        .post('/grievance')
        .set('Authorization', `Bearer ${userToken}`)
        .send(highPriorityData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievance.priority).toBe('high');
      expect(response.body.data.grievance.category).toBe('harassment');
    });

    test('should fail to create grievance without authentication', async () => {
      const response = await request(app)
        .post('/grievance')
        .send(validGrievanceData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail to create grievance with missing required fields', async () => {
      const incompleteData = {
        title: 'Incomplete Grievance'
        // Missing description and category
      };

      const response = await request(app)
        .post('/grievance')
        .set('Authorization', `Bearer ${userToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail to create grievance with invalid category', async () => {
      const invalidData = {
        ...validGrievanceData,
        category: 'invalid-category'
      };

      const response = await request(app)
        .post('/grievance')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail to create grievance with invalid priority', async () => {
      const invalidData = {
        ...validGrievanceData,
        priority: 'invalid-priority'
      };

      const response = await request(app)
        .post('/grievance')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should create grievance with attachments', async () => {
      const dataWithAttachments = {
        ...validGrievanceData,
        attachments: [
          {
            filename: 'evidence.pdf',
            originalName: 'Evidence Document.pdf',
            mimeType: 'application/pdf',
            size: 1024
          }
        ]
      };

      const response = await request(app)
        .post('/grievance')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dataWithAttachments);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievance.attachments).toBeInstanceOf(Array);
      expect(response.body.data.grievance.attachments.length).toBe(1);
    });
  });

  describe('GET /grievance', () => {
    let testGrievance;

    beforeEach(async () => {
      // Create a test grievance
      testGrievance = new Grievance({
        title: 'Test Grievance',
        description: 'Test grievance description',
        category: 'welfare',
        priority: 'medium',
        status: 'open',
        submittedBy: testUser._id,
        anonymousSubmission: false
      });
      await testGrievance.save();
    });

    test('should get user grievances', async () => {
      const response = await request(app)
        .get('/grievance')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievances).toBeInstanceOf(Array);
      expect(response.body.data.grievances.length).toBeGreaterThan(0);
      expect(response.body.data.grievances[0].submittedBy).toBe(testUser._id.toString());
    });

    test('should get all grievances as admin', async () => {
      // Create additional grievance from different user
      await new Grievance({
        title: 'Another Grievance',
        description: 'Another test grievance',
        category: 'administrative',
        priority: 'low',
        status: 'open',
        submittedBy: adminUser._id
      }).save();

      const response = await request(app)
        .get('/grievance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievances).toBeInstanceOf(Array);
      expect(response.body.data.grievances.length).toBeGreaterThanOrEqual(2);
    });

    test('should filter grievances by status', async () => {
      // Create closed grievance
      await new Grievance({
        title: 'Closed Grievance',
        description: 'Closed test grievance',
        category: 'welfare',
        priority: 'low',
        status: 'closed',
        submittedBy: testUser._id
      }).save();

      const response = await request(app)
        .get('/grievance?status=open')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievances.every(grievance => grievance.status === 'open')).toBe(true);
    });

    test('should filter grievances by category', async () => {
      // Create grievance with different category
      await new Grievance({
        title: 'Administrative Grievance',
        description: 'Administrative test grievance',
        category: 'administrative',
        priority: 'medium',
        status: 'open',
        submittedBy: testUser._id
      }).save();

      const response = await request(app)
        .get('/grievance?category=welfare')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievances.every(grievance => grievance.category === 'welfare')).toBe(true);
    });

    test('should filter grievances by priority', async () => {
      const response = await request(app)
        .get('/grievance?priority=medium')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievances.every(grievance => grievance.priority === 'medium')).toBe(true);
    });

    test('should search grievances by title', async () => {
      const response = await request(app)
        .get('/grievance?search=Test')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievances).toBeInstanceOf(Array);
    });

    test('should paginate results correctly', async () => {
      // Create multiple grievances
      for (let i = 0; i < 15; i++) {
        await new Grievance({
          title: `Test Grievance ${i}`,
          description: `Test grievance description ${i}`,
          category: 'welfare',
          priority: 'low',
          status: 'open',
          submittedBy: testUser._id
        }).save();
      }

      const response = await request(app)
        .get('/grievance?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievances.length).toBe(5);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBeGreaterThan(1);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/grievance');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /grievance/:id', () => {
    let testGrievance;

    beforeEach(async () => {
      testGrievance = new Grievance({
        title: 'Test Grievance',
        description: 'Test grievance description',
        category: 'welfare',
        priority: 'medium',
        status: 'open',
        submittedBy: testUser._id
      });
      await testGrievance.save();
    });

    test('should get specific grievance by ID', async () => {
      const response = await request(app)
        .get(`/grievance/${testGrievance._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievance._id).toBe(testGrievance._id.toString());
      expect(response.body.data.grievance.title).toBe(testGrievance.title);
    });

    test('should allow admin to view any grievance', async () => {
      const response = await request(app)
        .get(`/grievance/${testGrievance._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievance._id).toBe(testGrievance._id.toString());
    });

    test('should fail for non-existent grievance ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/grievance/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Grievance not found');
    });

    test('should fail with invalid grievance ID format', async () => {
      const response = await request(app)
        .get('/grievance/invalid-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/grievance/${testGrievance._id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should prevent user from viewing other users grievances', async () => {
      // Create another user and their grievance
      const otherUser = await global.testUtils.createTestUser({
        email: 'other@army.mil',
        serviceNumber: 'OTHER001',
        firebaseUid: 'other-firebase-uid'
      });

      const otherGrievance = new Grievance({
        title: 'Other Users Grievance',
        description: 'Other users grievance description',
        category: 'administrative',
        priority: 'low',
        status: 'open',
        submittedBy: otherUser._id
      });
      await otherGrievance.save();

      const response = await request(app)
        .get(`/grievance/${otherGrievance._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('PUT /grievance/:id/status', () => {
    let testGrievance;

    beforeEach(async () => {
      testGrievance = new Grievance({
        title: 'Test Grievance',
        description: 'Test grievance description',
        category: 'welfare',
        priority: 'medium',
        status: 'open',
        submittedBy: testUser._id
      });
      await testGrievance.save();
    });

    test('should update grievance status as admin', async () => {
      const statusUpdate = {
        status: 'in_progress',
        adminComments: 'Grievance is being reviewed'
      };

      const response = await request(app)
        .put(`/grievance/${testGrievance._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Grievance status updated successfully');
      expect(response.body.data.grievance.status).toBe('in_progress');
      expect(response.body.data.grievance.adminComments).toBe(statusUpdate.adminComments);
    });

    test('should update grievance status as officer', async () => {
      const statusUpdate = {
        status: 'resolved',
        adminComments: 'Grievance resolved by officer'
      };

      const response = await request(app)
        .put(`/grievance/${testGrievance._id}/status`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievance.status).toBe('resolved');
    });

    test('should fail to update status as regular user', async () => {
      const statusUpdate = {
        status: 'resolved'
      };

      const response = await request(app)
        .put(`/grievance/${testGrievance._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin or Officer rights required');
    });

    test('should fail to update with invalid status', async () => {
      const statusUpdate = {
        status: 'invalid-status'
      };

      const response = await request(app)
        .put(`/grievance/${testGrievance._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail to update non-existent grievance', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const statusUpdate = {
        status: 'resolved'
      };

      const response = await request(app)
        .put(`/grievance/${nonExistentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should auto-assign grievance when status changes to in_progress', async () => {
      const statusUpdate = {
        status: 'in_progress',
        adminComments: 'Taking ownership of this grievance'
      };

      const response = await request(app)
        .put(`/grievance/${testGrievance._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievance.assignedTo).toBe(adminUser._id.toString());
    });
  });

  describe('POST /grievance/:id/comments', () => {
    let testGrievance;

    beforeEach(async () => {
      testGrievance = new Grievance({
        title: 'Test Grievance',
        description: 'Test grievance description',
        category: 'welfare',
        priority: 'medium',
        status: 'open',
        submittedBy: testUser._id
      });
      await testGrievance.save();
    });

    test('should add comment to grievance as admin', async () => {
      const commentData = {
        comment: 'This is an admin comment on the grievance',
        isPrivate: false
      };

      const response = await request(app)
        .post(`/grievance/${testGrievance._id}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Comment added successfully');
      expect(response.body.data.grievance.comments).toBeInstanceOf(Array);
      expect(response.body.data.grievance.comments.length).toBe(1);
      expect(response.body.data.grievance.comments[0].comment).toBe(commentData.comment);
      expect(response.body.data.grievance.comments[0].commentedBy).toBe(adminUser._id.toString());
    });

    test('should add comment to own grievance as user', async () => {
      const commentData = {
        comment: 'Additional information from the grievance submitter'
      };

      const response = await request(app)
        .post(`/grievance/${testGrievance._id}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievance.comments[0].commentedBy).toBe(testUser._id.toString());
    });

    test('should add private comment as admin', async () => {
      const commentData = {
        comment: 'This is a private admin comment',
        isPrivate: true
      };

      const response = await request(app)
        .post(`/grievance/${testGrievance._id}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(commentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grievance.comments[0].isPrivate).toBe(true);
    });

    test('should fail to add comment to other users grievance', async () => {
      // Create another user and their grievance
      const otherUser = await global.testUtils.createTestUser({
        email: 'other@army.mil',
        serviceNumber: 'OTHER001',
        firebaseUid: 'other-firebase-uid'
      });

      const otherGrievance = new Grievance({
        title: 'Other Users Grievance',
        description: 'Other users grievance description',
        category: 'administrative',
        priority: 'low',
        status: 'open',
        submittedBy: otherUser._id
      });
      await otherGrievance.save();

      const commentData = {
        comment: 'Trying to comment on someone elses grievance'
      };

      const response = await request(app)
        .post(`/grievance/${otherGrievance._id}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(commentData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied');
    });

    test('should fail to add comment without authentication', async () => {
      const commentData = {
        comment: 'Unauthenticated comment'
      };

      const response = await request(app)
        .post(`/grievance/${testGrievance._id}/comments`)
        .send(commentData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail to add empty comment', async () => {
      const commentData = {
        comment: ''
      };

      const response = await request(app)
        .post(`/grievance/${testGrievance._id}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(commentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail to add comment to non-existent grievance', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const commentData = {
        comment: 'Comment on non-existent grievance'
      };

      const response = await request(app)
        .post(`/grievance/${nonExistentId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(commentData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /grievance/statistics', () => {
    beforeEach(async () => {
      // Create test grievances for statistics
      await new Grievance({
        title: 'Welfare Grievance',
        description: 'Welfare related grievance',
        category: 'welfare',
        priority: 'high',
        status: 'resolved',
        submittedBy: testUser._id
      }).save();

      await new Grievance({
        title: 'Administrative Grievance',
        description: 'Administrative grievance',
        category: 'administrative',
        priority: 'medium',
        status: 'open',
        submittedBy: testUser._id
      }).save();

      await new Grievance({
        title: 'Harassment Grievance',
        description: 'Harassment grievance',
        category: 'harassment',
        priority: 'critical',
        status: 'in_progress',
        submittedBy: testUser._id
      }).save();
    });

    test('should get grievance statistics as admin', async () => {
      const response = await request(app)
        .get('/grievance/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.totalGrievances).toBeDefined();
      expect(response.body.data.statistics.openGrievances).toBeDefined();
      expect(response.body.data.statistics.resolvedGrievances).toBeDefined();
      expect(response.body.data.statistics.byCategory).toBeDefined();
      expect(response.body.data.statistics.byPriority).toBeDefined();
      expect(response.body.data.statistics.byStatus).toBeDefined();
    });

    test('should get grievance statistics as officer', async () => {
      const response = await request(app)
        .get('/grievance/statistics')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
    });

    test('should fail to get statistics as regular user', async () => {
      const response = await request(app)
        .get('/grievance/statistics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin or Officer rights required');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/grievance/statistics');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should include proper statistics breakdown', async () => {
      const response = await request(app)
        .get('/grievance/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.statistics.totalGrievances).toBeGreaterThanOrEqual(3);
      expect(response.body.data.statistics.byCategory.welfare).toBeGreaterThanOrEqual(1);
      expect(response.body.data.statistics.byCategory.administrative).toBeGreaterThanOrEqual(1);
      expect(response.body.data.statistics.byCategory.harassment).toBeGreaterThanOrEqual(1);
      expect(response.body.data.statistics.byPriority.high).toBeGreaterThanOrEqual(1);
      expect(response.body.data.statistics.byPriority.critical).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PUT /grievance/:id/assign', () => {
    let testGrievance;

    beforeEach(async () => {
      testGrievance = new Grievance({
        title: 'Test Grievance for Assignment',
        description: 'Test grievance description',
        category: 'welfare',
        priority: 'medium',
        status: 'open',
        submittedBy: testUser._id
      });
      await testGrievance.save();
    });

    test('should assign grievance to officer as admin', async () => {
      const assignmentData = {
        assignedTo: officerUser._id
      };

      const response = await request(app)
        .put(`/grievance/${testGrievance._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Grievance assigned successfully');
      expect(response.body.data.grievance.assignedTo).toBe(officerUser._id.toString());
    });

    test('should fail to assign grievance as regular user', async () => {
      const assignmentData = {
        assignedTo: officerUser._id
      };

      const response = await request(app)
        .put(`/grievance/${testGrievance._id}/assign`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(assignmentData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should fail to assign to non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const assignmentData = {
        assignedTo: nonExistentUserId
      };

      const response = await request(app)
        .put(`/grievance/${testGrievance._id}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');
    });

    test('should fail to assign non-existent grievance', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const assignmentData = {
        assignedTo: officerUser._id
      };

      const response = await request(app)
        .put(`/grievance/${nonExistentId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(assignmentData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
