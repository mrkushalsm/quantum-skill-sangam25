const request = require('supertest');
const express = require('express');
const { authenticateToken, authorizeRoles, isAdmin, isOfficer } = require('../../../middleware/auth');
const User = require('../../../models/User');

// Mock Firebase
const mockVerifyIdToken = jest.fn();
jest.mock('../../../config/firebase', () => ({
  verifyIdToken: mockVerifyIdToken
}));

describe('Auth Middleware', () => {
  let app, testUser;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create test app
    app = express();
    app.use(express.json());
    
    // Create test user
    testUser = await global.testUtils.createTestUser({
      firebaseUid: 'test-firebase-uid',
      email: 'test@army.mil',
      role: 'officer',
      isActive: true
    });
  });

  describe('authenticateToken middleware', () => {
    beforeEach(() => {
      // Setup test route
      app.get('/protected', authenticateToken, (req, res) => {
        res.json({ success: true, user: req.user.email });
      });
    });

    test('should authenticate valid token', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: testUser.firebaseUid,
        email: testUser.email
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBe(testUser.email);
    });

    test('should reject request without authorization header', async () => {
      const response = await request(app)
        .get('/protected');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    test('should reject request with invalid authorization format', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access token required');
    });

    test('should reject request with invalid token', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });

    test('should reject request for non-existent user', async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: 'non-existent-uid',
        email: 'nonexistent@army.mil'
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    test('should reject request for inactive user', async () => {
      // Create inactive user
      const inactiveUser = await global.testUtils.createTestUser({
        firebaseUid: 'inactive-user-uid',
        email: 'inactive@army.mil',
        serviceNumber: 'INACTIVE001',
        isActive: false
      });

      mockVerifyIdToken.mockResolvedValue({
        uid: inactiveUser.firebaseUid,
        email: inactiveUser.email
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is deactivated');
    });
  });

  describe('authorizeRoles middleware', () => {
    beforeEach(() => {
      mockVerifyIdToken.mockResolvedValue({
        uid: testUser.firebaseUid,
        email: testUser.email
      });
    });

    test('should allow access for authorized role', async () => {
      app.get('/officer-only', 
        authenticateToken, 
        authorizeRoles('officer', 'admin'), 
        (req, res) => {
          res.json({ success: true, message: 'Officer access granted' });
        }
      );

      const response = await request(app)
        .get('/officer-only')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should deny access for unauthorized role', async () => {
      // Create family member user
      const familyUser = await global.testUtils.createTestUser({
        firebaseUid: 'family-user-uid',
        email: 'family@army.mil',
        role: 'family_member',
        relationToOfficer: 'spouse',
        officerServiceNumber: 'OFF001'
      });

      mockVerifyIdToken.mockResolvedValue({
        uid: familyUser.firebaseUid,
        email: familyUser.email
      });

      app.get('/officer-only', 
        authenticateToken, 
        authorizeRoles('officer', 'admin'), 
        (req, res) => {
          res.json({ success: true });
        }
      );

      const response = await request(app)
        .get('/officer-only')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Insufficient permissions');
    });

    test('should handle missing user in request', async () => {
      app.get('/test-no-auth', authorizeRoles('admin'), (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).get('/test-no-auth');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication required');
    });
  });

  describe('isAdmin middleware', () => {
    test('should allow access for admin user', async () => {
      const adminUser = await global.testUtils.createTestUser({
        firebaseUid: 'admin-user-uid',
        email: 'admin@army.mil',
        role: 'admin'
      });

      mockVerifyIdToken.mockResolvedValue({
        uid: adminUser.firebaseUid,
        email: adminUser.email
      });

      app.get('/admin-only', authenticateToken, isAdmin, (req, res) => {
        res.json({ success: true, message: 'Admin access granted' });
      });

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should deny access for non-admin user', async () => {
      app.get('/admin-only', authenticateToken, isAdmin, (req, res) => {
        res.json({ success: true });
      });

      mockVerifyIdToken.mockResolvedValue({
        uid: testUser.firebaseUid,
        email: testUser.email
      });

      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Admin access required');
    });
  });

  describe('isOfficer middleware', () => {
    test('should allow access for officer user', async () => {
      app.get('/officer-access', authenticateToken, isOfficer, (req, res) => {
        res.json({ success: true, message: 'Officer access granted' });
      });

      mockVerifyIdToken.mockResolvedValue({
        uid: testUser.firebaseUid,
        email: testUser.email
      });

      const response = await request(app)
        .get('/officer-access')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should allow access for admin user', async () => {
      const adminUser = await global.testUtils.createTestUser({
        firebaseUid: 'admin-officer-uid',
        email: 'adminofficer@army.mil',
        role: 'admin'
      });

      mockVerifyIdToken.mockResolvedValue({
        uid: adminUser.firebaseUid,
        email: adminUser.email
      });

      app.get('/officer-access', authenticateToken, isOfficer, (req, res) => {
        res.json({ success: true, message: 'Admin access granted' });
      });

      const response = await request(app)
        .get('/officer-access')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should deny access for family member', async () => {
      const familyUser = await global.testUtils.createTestUser({
        firebaseUid: 'family-officer-uid',
        email: 'familyofficer@army.mil',
        role: 'family_member',
        relationToOfficer: 'spouse',
        officerServiceNumber: 'OFF001'
      });

      mockVerifyIdToken.mockResolvedValue({
        uid: familyUser.firebaseUid,
        email: familyUser.email
      });

      app.get('/officer-access', authenticateToken, isOfficer, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/officer-access')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Officer access required');
    });
  });

  describe('Error handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database error
      jest.spyOn(User, 'findOne').mockRejectedValue(new Error('Database error'));

      mockVerifyIdToken.mockResolvedValue({
        uid: 'test-uid',
        email: 'test@army.mil'
      });

      app.get('/db-error', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/db-error')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');

      // Restore the original method
      User.findOne.mockRestore();
    });

    test('should handle Firebase verification errors', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Firebase error'));

      app.get('/firebase-error', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/firebase-error')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid or expired token');
    });
  });

  describe('Token extraction', () => {
    test('should extract token correctly from Bearer header', async () => {
      const token = 'test-firebase-token-12345';
      
      mockVerifyIdToken.mockImplementation((receivedToken) => {
        expect(receivedToken).toBe(token);
        return Promise.resolve({
          uid: testUser.firebaseUid,
          email: testUser.email
        });
      });

      app.get('/token-test', authenticateToken, (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .get('/token-test')
        .set('Authorization', `Bearer ${token}`);

      expect(mockVerifyIdToken).toHaveBeenCalledWith(token);
    });
  });

  describe('Request enhancement', () => {
    test('should add user and firebaseUser to request object', async () => {
      const mockFirebaseUser = {
        uid: testUser.firebaseUid,
        email: testUser.email,
        name: 'Test User'
      };

      mockVerifyIdToken.mockResolvedValue(mockFirebaseUser);

      app.get('/request-test', authenticateToken, (req, res) => {
        res.json({
          success: true,
          hasUser: !!req.user,
          hasFirebaseUser: !!req.firebaseUser,
          userEmail: req.user?.email,
          firebaseUserName: req.firebaseUser?.name
        });
      });

      const response = await request(app)
        .get('/request-test')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.hasUser).toBe(true);
      expect(response.body.hasFirebaseUser).toBe(true);
      expect(response.body.userEmail).toBe(testUser.email);
      expect(response.body.firebaseUserName).toBe('Test User');
    });
  });
});
