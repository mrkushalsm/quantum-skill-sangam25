const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../../models/User');
const EmergencyAlert = require('../../../models/EmergencyAlert');
const emergencyRoutes = require('../../../routes/emergency');
const errorHandler = require('../../../middleware/errorHandler');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/emergency', emergencyRoutes);
  app.use(errorHandler);
  return app;
};

describe('Emergency Routes Integration Tests', () => {
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

  describe('POST /emergency/alerts', () => {
    const validAlertData = {
      type: 'medical',
      severity: 'high',
      description: 'Medical emergency requiring immediate attention',
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'Test Location, New Delhi, India'
      },
      contactNumber: '+919876543210'
    };

    test('should create emergency alert successfully', async () => {
      const response = await request(app)
        .post('/emergency/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validAlertData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Emergency alert created successfully');
      expect(response.body.data.alert.type).toBe(validAlertData.type);
      expect(response.body.data.alert.severity).toBe(validAlertData.severity);
      expect(response.body.data.alert.status).toBe('active');
      expect(response.body.data.alert.userId).toBeTruthy();
      
      // Verify alert was created in database
      const createdAlert = await EmergencyAlert.findOne({ 
        userId: testUser._id,
        type: validAlertData.type 
      });
      expect(createdAlert).toBeTruthy();
      expect(createdAlert.status).toBe('active');
    });

    test('should create emergency alert with minimal required data', async () => {
      const minimalData = {
        type: 'security',
        severity: 'medium',
        description: 'Security incident'
      };

      const response = await request(app)
        .post('/emergency/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(minimalData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.type).toBe(minimalData.type);
    });

    test('should fail to create alert without authentication', async () => {
      const response = await request(app)
        .post('/emergency/alerts')
        .send(validAlertData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail to create alert with missing required fields', async () => {
      const incompleteData = {
        severity: 'high'
        // Missing type and description
      };

      const response = await request(app)
        .post('/emergency/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail to create alert with invalid severity level', async () => {
      const invalidData = {
        ...validAlertData,
        severity: 'invalid-severity'
      };

      const response = await request(app)
        .post('/emergency/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail to create alert with invalid emergency type', async () => {
      const invalidData = {
        ...validAlertData,
        type: 'invalid-type'
      };

      const response = await request(app)
        .post('/emergency/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should assign response team automatically for high severity alerts', async () => {
      const highSeverityAlert = {
        ...validAlertData,
        severity: 'critical'
      };

      const response = await request(app)
        .post('/emergency/alerts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(highSeverityAlert);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.responseTeam).toBeDefined();
      expect(response.body.data.alert.responseTeam.length).toBeGreaterThan(0);
    });
  });

  describe('GET /emergency/alerts', () => {
    let testAlert;

    beforeEach(async () => {
      // Create a test emergency alert
      testAlert = new EmergencyAlert({
        userId: testUser._id,
        type: 'medical',
        severity: 'high',
        description: 'Test emergency alert',
        status: 'active',
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'Test Location'
        }
      });
      await testAlert.save();
    });

    test('should get user emergency alerts', async () => {
      const response = await request(app)
        .get('/emergency/alerts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toBeInstanceOf(Array);
      expect(response.body.data.alerts.length).toBeGreaterThan(0);
      expect(response.body.data.alerts[0].userId).toBe(testUser._id.toString());
    });

    test('should get all alerts as admin', async () => {
      const response = await request(app)
        .get('/emergency/alerts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toBeInstanceOf(Array);
    });

    test('should filter alerts by status', async () => {
      // Create resolved alert
      await new EmergencyAlert({
        userId: testUser._id,
        type: 'security',
        severity: 'medium',
        description: 'Resolved alert',
        status: 'resolved'
      }).save();

      const response = await request(app)
        .get('/emergency/alerts?status=active')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts.every(alert => alert.status === 'active')).toBe(true);
    });

    test('should filter alerts by type', async () => {
      const response = await request(app)
        .get('/emergency/alerts?type=medical')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts.every(alert => alert.type === 'medical')).toBe(true);
    });

    test('should filter alerts by severity', async () => {
      const response = await request(app)
        .get('/emergency/alerts?severity=high')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts.every(alert => alert.severity === 'high')).toBe(true);
    });

    test('should paginate results correctly', async () => {
      // Create multiple alerts
      for (let i = 0; i < 15; i++) {
        await new EmergencyAlert({
          userId: testUser._id,
          type: 'medical',
          severity: 'low',
          description: `Test alert ${i}`,
          status: 'active'
        }).save();
      }

      const response = await request(app)
        .get('/emergency/alerts?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts.length).toBe(5);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBeGreaterThan(1);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/emergency/alerts');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /emergency/alerts/:id', () => {
    let testAlert;

    beforeEach(async () => {
      testAlert = new EmergencyAlert({
        userId: testUser._id,
        type: 'medical',
        severity: 'high',
        description: 'Test emergency alert',
        status: 'active'
      });
      await testAlert.save();
    });

    test('should get specific emergency alert by ID', async () => {
      const response = await request(app)
        .get(`/emergency/alerts/${testAlert._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alert._id).toBe(testAlert._id.toString());
      expect(response.body.data.alert.type).toBe(testAlert.type);
    });

    test('should allow admin to view any alert', async () => {
      const response = await request(app)
        .get(`/emergency/alerts/${testAlert._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alert._id).toBe(testAlert._id.toString());
    });

    test('should fail for non-existent alert ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/emergency/alerts/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Emergency alert not found');
    });

    test('should fail with invalid alert ID format', async () => {
      const response = await request(app)
        .get('/emergency/alerts/invalid-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/emergency/alerts/${testAlert._id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should prevent user from viewing other users alerts', async () => {
      // Create another user and their alert
      const otherUser = await global.testUtils.createTestUser({
        email: 'other@army.mil',
        serviceNumber: 'OTHER001',
        firebaseUid: 'other-firebase-uid'
      });

      const otherAlert = new EmergencyAlert({
        userId: otherUser._id,
        type: 'security',
        severity: 'medium',
        description: 'Other users alert',
        status: 'active'
      });
      await otherAlert.save();

      const response = await request(app)
        .get(`/emergency/alerts/${otherAlert._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('PUT /emergency/alerts/:id/status', () => {
    let testAlert;

    beforeEach(async () => {
      testAlert = new EmergencyAlert({
        userId: testUser._id,
        type: 'medical',
        severity: 'high',
        description: 'Test emergency alert',
        status: 'active',
        responseTeam: [{
          memberId: officerUser._id,
          assignedAt: new Date(),
          status: 'assigned'
        }]
      });
      await testAlert.save();
    });

    test('should update alert status as assigned response team member', async () => {
      const statusUpdate = {
        status: 'in_progress',
        responseNotes: 'Response team dispatched'
      };

      const response = await request(app)
        .put(`/emergency/alerts/${testAlert._id}/status`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Alert status updated successfully');
      expect(response.body.data.alert.status).toBe('in_progress');
      expect(response.body.data.alert.responseNotes).toBe(statusUpdate.responseNotes);
    });

    test('should update alert status as admin', async () => {
      const statusUpdate = {
        status: 'resolved',
        responseNotes: 'Situation resolved by admin'
      };

      const response = await request(app)
        .put(`/emergency/alerts/${testAlert._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.status).toBe('resolved');
    });

    test('should allow alert owner to cancel their own alert', async () => {
      const statusUpdate = {
        status: 'cancelled',
        responseNotes: 'False alarm, situation resolved'
      };

      const response = await request(app)
        .put(`/emergency/alerts/${testAlert._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alert.status).toBe('cancelled');
    });

    test('should fail to update status with invalid status value', async () => {
      const statusUpdate = {
        status: 'invalid-status'
      };

      const response = await request(app)
        .put(`/emergency/alerts/${testAlert._id}/status`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail to update non-existent alert', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const statusUpdate = {
        status: 'resolved'
      };

      const response = await request(app)
        .put(`/emergency/alerts/${nonExistentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should fail for unauthorized user to update alert status', async () => {
      // Create another user not in response team
      const unauthorizedUser = await global.testUtils.createTestUser({
        email: 'unauthorized@army.mil',
        serviceNumber: 'UNAUTH001',
        firebaseUid: 'unauthorized-firebase-uid'
      });

      const unauthorizedToken = global.testUtils.generateTestToken({
        serviceNumber: unauthorizedUser.serviceNumber,
        email: unauthorizedUser.email,
        role: unauthorizedUser.role
      });

      const statusUpdate = {
        status: 'resolved'
      };

      const response = await request(app)
        .put(`/emergency/alerts/${testAlert._id}/status`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send(statusUpdate);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied');
    });
  });

  describe('POST /emergency/alerts/:id/response', () => {
    let testAlert;

    beforeEach(async () => {
      testAlert = new EmergencyAlert({
        userId: testUser._id,
        type: 'medical',
        severity: 'critical',
        description: 'Critical emergency requiring response',
        status: 'active'
      });
      await testAlert.save();
    });

    test('should assign response team member as admin', async () => {
      const responseData = {
        memberId: officerUser._id,
        role: 'lead_responder'
      };

      const response = await request(app)
        .post(`/emergency/alerts/${testAlert._id}/response`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(responseData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Response team member assigned successfully');
      expect(response.body.data.alert.responseTeam).toBeInstanceOf(Array);
      expect(response.body.data.alert.responseTeam.length).toBeGreaterThan(0);
    });

    test('should volunteer as response team member', async () => {
      const responseData = {
        volunteer: true,
        message: 'I am available to respond to this emergency'
      };

      const response = await request(app)
        .post(`/emergency/alerts/${testAlert._id}/response`)
        .set('Authorization', `Bearer ${officerToken}`)
        .send(responseData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Volunteered for emergency response successfully');
    });

    test('should fail to assign response to non-existent alert', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const responseData = {
        memberId: officerUser._id
      };

      const response = await request(app)
        .post(`/emergency/alerts/${nonExistentId}/response`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(responseData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should fail without authentication', async () => {
      const responseData = {
        memberId: officerUser._id
      };

      const response = await request(app)
        .post(`/emergency/alerts/${testAlert._id}/response`)
        .send(responseData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /emergency/nearby', () => {
    test('should get nearby emergency alerts for location', async () => {
      // Create emergency alert with location
      await new EmergencyAlert({
        userId: testUser._id,
        type: 'medical',
        severity: 'high',
        description: 'Medical emergency',
        status: 'active',
        location: {
          latitude: 28.6139,
          longitude: 77.2090,
          address: 'Near location'
        }
      }).save();

      const response = await request(app)
        .get('/emergency/nearby?latitude=28.6140&longitude=77.2091&radius=1')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toBeInstanceOf(Array);
    });

    test('should require latitude and longitude parameters', async () => {
      const response = await request(app)
        .get('/emergency/nearby')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('latitude and longitude');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/emergency/nearby?latitude=28.6140&longitude=77.2091');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return empty array when no nearby alerts', async () => {
      const response = await request(app)
        .get('/emergency/nearby?latitude=0&longitude=0&radius=1')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.alerts).toBeInstanceOf(Array);
      expect(response.body.data.alerts.length).toBe(0);
    });
  });

  describe('GET /emergency/statistics', () => {
    beforeEach(async () => {
      // Create test alerts for statistics
      await new EmergencyAlert({
        userId: testUser._id,
        type: 'medical',
        severity: 'high',
        description: 'Medical emergency',
        status: 'resolved'
      }).save();

      await new EmergencyAlert({
        userId: testUser._id,
        type: 'security',
        severity: 'medium',
        description: 'Security incident',
        status: 'active'
      }).save();
    });

    test('should get emergency statistics as admin', async () => {
      const response = await request(app)
        .get('/emergency/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.totalAlerts).toBeDefined();
      expect(response.body.data.statistics.activeAlerts).toBeDefined();
      expect(response.body.data.statistics.resolvedAlerts).toBeDefined();
      expect(response.body.data.statistics.byType).toBeDefined();
      expect(response.body.data.statistics.bySeverity).toBeDefined();
    });

    test('should get emergency statistics as officer', async () => {
      const response = await request(app)
        .get('/emergency/statistics')
        .set('Authorization', `Bearer ${officerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
    });

    test('should fail to get statistics as regular user', async () => {
      const response = await request(app)
        .get('/emergency/statistics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin or Officer rights required');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/emergency/statistics');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
