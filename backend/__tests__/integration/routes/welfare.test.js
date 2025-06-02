const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../../models/User');
const WelfareScheme = require('../../../models/WelfareScheme');
const Application = require('../../../models/Application');
const welfareRoutes = require('../../../routes/welfare');
const errorHandler = require('../../../middleware/errorHandler');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/welfare', welfareRoutes);
  app.use(errorHandler);
  return app;
};

describe('Welfare Routes Integration Tests', () => {
  let app;
  let testUser;
  let adminUser;
  let testScheme;
  let userToken;
  let adminToken;

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

    // Create test welfare scheme
    testScheme = await global.testUtils.createTestScheme();

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
  });

  describe('GET /welfare/schemes', () => {
    test('should get all active welfare schemes for authenticated user', async () => {
      const response = await request(app)
        .get('/welfare/schemes')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.schemes).toBeInstanceOf(Array);
      expect(response.body.data.schemes.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('should filter schemes by category', async () => {
      // Create schemes with different categories
      await global.testUtils.createTestScheme({
        name: 'Healthcare Scheme',
        category: 'Healthcare'
      });

      const response = await request(app)
        .get('/welfare/schemes?category=Healthcare')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.schemes).toBeInstanceOf(Array);
      expect(response.body.data.schemes.every(scheme => scheme.category === 'Healthcare')).toBe(true);
    });

    test('should search schemes by title', async () => {
      const response = await request(app)
        .get('/welfare/schemes?search=Test')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.schemes).toBeInstanceOf(Array);
    });

    test('should paginate results correctly', async () => {
      // Create multiple schemes
      for (let i = 0; i < 15; i++) {
        await global.testUtils.createTestScheme({
          name: `Test Scheme ${i}`,
          category: 'Education'
        });
      }

      const response = await request(app)
        .get('/welfare/schemes?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.schemes.length).toBe(5);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBeGreaterThan(1);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/welfare/schemes');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should filter inactive schemes', async () => {
      // Create inactive scheme
      await global.testUtils.createTestScheme({
        name: 'Inactive Scheme',
        isActive: false
      });

      const response = await request(app)
        .get('/welfare/schemes?status=inactive')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /welfare/schemes/:id', () => {
    test('should get specific welfare scheme by ID', async () => {
      const response = await request(app)
        .get(`/welfare/schemes/${testScheme._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheme._id).toBe(testScheme._id.toString());
      expect(response.body.data.scheme.name).toBe(testScheme.name);
    });

    test('should fail for non-existent scheme ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/welfare/schemes/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Welfare scheme not found');
    });

    test('should fail with invalid scheme ID format', async () => {
      const response = await request(app)
        .get('/welfare/schemes/invalid-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/welfare/schemes/${testScheme._id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /welfare/schemes', () => {
    const validSchemeData = {
      name: 'New Test Scheme',
      description: 'A new welfare scheme for testing',
      category: 'Healthcare',
      eligibilityCriteria: ['Active service member', 'Medical need'],
      benefits: ['Medical coverage', 'Health insurance'],
      applicationProcess: 'Apply through online portal',
      requiredDocuments: ['Medical certificate', 'Service record'],
      eligibleServices: ['army', 'navy'],
      eligibleRanks: ['Lieutenant', 'Captain'],
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      maxApplications: 100,
      budgetAllocated: 500000
    };

    test('should create new welfare scheme as admin', async () => {
      const response = await request(app)
        .post('/welfare/schemes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSchemeData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Welfare scheme created successfully');
      expect(response.body.data.scheme.name).toBe(validSchemeData.name);
      expect(response.body.data.scheme.category).toBe(validSchemeData.category);
      
      // Verify scheme was created in database
      const createdScheme = await WelfareScheme.findOne({ name: validSchemeData.name });
      expect(createdScheme).toBeTruthy();
    });

    test('should fail to create scheme as regular user', async () => {
      const response = await request(app)
        .post('/welfare/schemes')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validSchemeData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin rights required');
    });

    test('should fail to create scheme with missing required fields', async () => {
      const incompleteData = {
        name: 'Incomplete Scheme'
        // Missing required fields
      };

      const response = await request(app)
        .post('/welfare/schemes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail to create scheme with duplicate name', async () => {
      const duplicateData = {
        ...validSchemeData,
        name: testScheme.name // Use existing scheme name
      };

      const response = await request(app)
        .post('/welfare/schemes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/welfare/schemes')
        .send(validSchemeData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /welfare/schemes/:id', () => {
    const updateData = {
      name: 'Updated Test Scheme',
      description: 'Updated description',
      maxApplications: 200
    };

    test('should update welfare scheme as admin', async () => {
      const response = await request(app)
        .put(`/welfare/schemes/${testScheme._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Welfare scheme updated successfully');
      expect(response.body.data.scheme.name).toBe(updateData.name);
      expect(response.body.data.scheme.maxApplications).toBe(updateData.maxApplications);
    });

    test('should fail to update scheme as regular user', async () => {
      const response = await request(app)
        .put(`/welfare/schemes/${testScheme._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should fail to update non-existent scheme', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/welfare/schemes/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /welfare/schemes/:id', () => {
    test('should delete welfare scheme as admin', async () => {
      const response = await request(app)
        .delete(`/welfare/schemes/${testScheme._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Welfare scheme deleted successfully');
      
      // Verify scheme was deleted from database
      const deletedScheme = await WelfareScheme.findById(testScheme._id);
      expect(deletedScheme).toBeNull();
    });

    test('should fail to delete scheme as regular user', async () => {
      const response = await request(app)
        .delete(`/welfare/schemes/${testScheme._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should fail to delete non-existent scheme', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/welfare/schemes/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /welfare/applications', () => {
    const validApplicationData = {
      personalDetails: {
        name: 'Test Applicant',
        email: 'applicant@army.mil',
        phone: '+919876543210',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456',
          country: 'India'
        }
      },
      bankDetails: {
        accountNumber: '1234567890',
        ifscCode: 'TEST0001234',
        bankName: 'Test Bank',
        branchName: 'Test Branch'
      },
      additionalInfo: 'Test application submission'
    };

    test('should submit application successfully', async () => {
      const applicationData = {
        ...validApplicationData,
        schemeId: testScheme._id
      };

      const response = await request(app)
        .post('/welfare/applications')
        .set('Authorization', `Bearer ${userToken}`)
        .send(applicationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Application submitted successfully');
      expect(response.body.data.application.schemeId).toBe(testScheme._id.toString());
      expect(response.body.data.application.status).toBe('pending');
      
      // Verify application was created in database
      const createdApplication = await Application.findOne({ 
        applicantServiceNumber: testUser.serviceNumber,
        schemeId: testScheme._id 
      });
      expect(createdApplication).toBeTruthy();
    });

    test('should fail to submit application without authentication', async () => {
      const applicationData = {
        ...validApplicationData,
        schemeId: testScheme._id
      };

      const response = await request(app)
        .post('/welfare/applications')
        .send(applicationData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail to submit application with invalid scheme ID', async () => {
      const invalidSchemeId = new mongoose.Types.ObjectId();
      const applicationData = {
        ...validApplicationData,
        schemeId: invalidSchemeId
      };

      const response = await request(app)
        .post('/welfare/applications')
        .set('Authorization', `Bearer ${userToken}`)
        .send(applicationData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Welfare scheme not found');
    });

    test('should fail to submit duplicate application', async () => {
      // First application
      const applicationData = {
        ...validApplicationData,
        schemeId: testScheme._id
      };

      await request(app)
        .post('/welfare/applications')
        .set('Authorization', `Bearer ${userToken}`)
        .send(applicationData);

      // Duplicate application
      const response = await request(app)
        .post('/welfare/applications')
        .set('Authorization', `Bearer ${userToken}`)
        .send(applicationData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already applied');
    });

    test('should fail to submit application with missing required fields', async () => {
      const incompleteData = {
        schemeId: testScheme._id
        // Missing personalDetails
      };

      const response = await request(app)
        .post('/welfare/applications')
        .set('Authorization', `Bearer ${userToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /welfare/applications', () => {
    let testApplication;

    beforeEach(async () => {
      // Create a test application
      testApplication = new Application({
        ...global.testFixtures.application,
        schemeId: testScheme._id,
        applicantServiceNumber: testUser.serviceNumber,
        userId: testUser._id
      });
      await testApplication.save();
    });

    test('should get user applications', async () => {
      const response = await request(app)
        .get('/welfare/applications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toBeInstanceOf(Array);
      expect(response.body.data.applications.length).toBeGreaterThan(0);
      expect(response.body.data.applications[0].applicantServiceNumber).toBe(testUser.serviceNumber);
    });

    test('should get all applications as admin', async () => {
      const response = await request(app)
        .get('/welfare/applications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.applications).toBeInstanceOf(Array);
    });

    test('should filter applications by status', async () => {
      const response = await request(app)
        .get('/welfare/applications?status=pending')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.applications.every(app => app.status === 'pending')).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/welfare/applications');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /welfare/applications/:id/status', () => {
    let testApplication;

    beforeEach(async () => {
      testApplication = new Application({
        ...global.testFixtures.application,
        schemeId: testScheme._id,
        applicantServiceNumber: testUser.serviceNumber,
        userId: testUser._id
      });
      await testApplication.save();
    });

    test('should update application status as admin', async () => {
      const statusUpdate = {
        status: 'approved',
        adminComments: 'Application meets all criteria'
      };

      const response = await request(app)
        .put(`/welfare/applications/${testApplication._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Application status updated successfully');
      expect(response.body.data.application.status).toBe('approved');
      expect(response.body.data.application.adminComments).toBe(statusUpdate.adminComments);
    });

    test('should fail to update status as regular user', async () => {
      const statusUpdate = {
        status: 'approved'
      };

      const response = await request(app)
        .put(`/welfare/applications/${testApplication._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    test('should fail to update with invalid status', async () => {
      const statusUpdate = {
        status: 'invalid-status'
      };

      const response = await request(app)
        .put(`/welfare/applications/${testApplication._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail to update non-existent application', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const statusUpdate = {
        status: 'approved'
      };

      const response = await request(app)
        .put(`/welfare/applications/${nonExistentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
