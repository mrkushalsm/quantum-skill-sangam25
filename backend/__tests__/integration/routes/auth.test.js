const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../../models/User');
const authRoutes = require('../../../routes/auth');
const errorHandler = require('../../../middleware/errorHandler');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  app.use(errorHandler);
  return app;
};

describe('Auth Routes Integration Tests', () => {
  let app;
  let testUser;

  beforeEach(async () => {
    app = createTestApp();
    await global.testUtils.cleanDatabase();
    
    // Create a test user
    testUser = await global.testUtils.createTestUser();
  });

  describe('POST /auth/register', () => {
    const validRegistrationData = {
      email: 'newuser@army.mil',
      firstName: 'New',
      lastName: 'User',
      phoneNumber: '+919876543210',
      role: 'user',
      serviceNumber: 'NEW001',
      rank: 'Lieutenant',
      unit: 'Test Unit'
    };

    test('should register a new user successfully with valid data', async () => {
      // Mock Firebase token verification
      const firebaseAdmin = require('firebase-admin');
      firebaseAdmin.auth().verifyIdToken.mockResolvedValue({
        uid: 'firebase-uid-123',
        email: validRegistrationData.email
      });

      const response = await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer valid-firebase-token')
        .send(validRegistrationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.email).toBe(validRegistrationData.email);
      
      // Verify user was created in database
      const createdUser = await User.findOne({ email: validRegistrationData.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser.serviceNumber).toBe(validRegistrationData.serviceNumber);
    });

    test('should fail registration without Firebase token', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Firebase token required for registration');
    });

    test('should fail registration with invalid email format', async () => {
      const firebaseAdmin = require('firebase-admin');
      firebaseAdmin.auth().verifyIdToken.mockResolvedValue({
        uid: 'firebase-uid-123',
        email: 'invalid-email'
      });

      const invalidData = {
        ...validRegistrationData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer valid-firebase-token')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail registration with duplicate service number', async () => {
      const firebaseAdmin = require('firebase-admin');
      firebaseAdmin.auth().verifyIdToken.mockResolvedValue({
        uid: 'firebase-uid-456',
        email: 'another@army.mil'
      });

      const duplicateData = {
        ...validRegistrationData,
        email: 'another@army.mil',
        serviceNumber: testUser.serviceNumber // Use existing service number
      };

      const response = await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer valid-firebase-token')
        .send(duplicateData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Service number already exists');
    });

    test('should fail registration with missing required fields', async () => {
      const firebaseAdmin = require('firebase-admin');
      firebaseAdmin.auth().verifyIdToken.mockResolvedValue({
        uid: 'firebase-uid-789',
        email: 'incomplete@army.mil'
      });

      const incompleteData = {
        email: 'incomplete@army.mil',
        firstName: 'Incomplete'
        // Missing required fields
      };

      const response = await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer valid-firebase-token')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should register family member with valid officer reference', async () => {
      // First create an officer
      const officer = await global.testUtils.createTestUser({
        role: 'officer',
        serviceNumber: 'OFF001',
        rank: 'Major'
      });

      const firebaseAdmin = require('firebase-admin');
      firebaseAdmin.auth().verifyIdToken.mockResolvedValue({
        uid: 'firebase-family-uid',
        email: 'family@example.com'
      });

      const familyMemberData = {
        email: 'family@example.com',
        firstName: 'Family',
        lastName: 'Member',
        phoneNumber: '+919876543211',
        role: 'family_member',
        relationToOfficer: 'spouse',
        officerServiceNumber: officer.serviceNumber
      };

      const response = await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer valid-firebase-token')
        .send(familyMemberData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('family_member');
      expect(response.body.data.user.relationToOfficer).toBe('spouse');
    });

    test('should fail family member registration with invalid officer reference', async () => {
      const firebaseAdmin = require('firebase-admin');
      firebaseAdmin.auth().verifyIdToken.mockResolvedValue({
        uid: 'firebase-family-uid',
        email: 'family@example.com'
      });

      const familyMemberData = {
        email: 'family@example.com',
        firstName: 'Family',
        lastName: 'Member',
        phoneNumber: '+919876543211',
        role: 'family_member',
        relationToOfficer: 'spouse',
        officerServiceNumber: 'INVALID001' // Non-existent officer
      };

      const response = await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer valid-firebase-token')
        .send(familyMemberData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Referenced officer not found');
    });
  });

  describe('POST /auth/login', () => {
    test('should login user with valid Firebase token', async () => {
      const firebaseAdmin = require('firebase-admin');
      firebaseAdmin.auth().verifyIdToken.mockResolvedValue({
        uid: testUser.firebaseUid,
        email: testUser.email
      });

      const response = await request(app)
        .post('/auth/login')
        .set('Authorization', 'Bearer valid-firebase-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.token).toBeDefined();
    });

    test('should fail login with invalid Firebase token', async () => {
      const firebaseAdmin = require('firebase-admin');
      firebaseAdmin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/auth/login')
        .set('Authorization', 'Bearer invalid-firebase-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid authentication token');
    });

    test('should fail login without Firebase token', async () => {
      const response = await request(app)
        .post('/auth/login');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail login for non-existent user', async () => {
      const firebaseAdmin = require('firebase-admin');
      firebaseAdmin.auth().verifyIdToken.mockResolvedValue({
        uid: 'non-existent-uid',
        email: 'nonexistent@army.mil'
      });

      const response = await request(app)
        .post('/auth/login')
        .set('Authorization', 'Bearer valid-firebase-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    test('should fail login for inactive user', async () => {
      // Create inactive user
      const inactiveUser = await global.testUtils.createTestUser({
        email: 'inactive@army.mil',
        firebaseUid: 'inactive-uid',
        isActive: false
      });

      const firebaseAdmin = require('firebase-admin');
      firebaseAdmin.auth().verifyIdToken.mockResolvedValue({
        uid: inactiveUser.firebaseUid,
        email: inactiveUser.email
      });

      const response = await request(app)
        .post('/auth/login')
        .set('Authorization', 'Bearer valid-firebase-token');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is deactivated');
    });
  });

  describe('POST /auth/refresh', () => {
    test('should refresh token with valid existing token', async () => {
      const token = global.testUtils.generateTestToken({
        serviceNumber: testUser.serviceNumber,
        email: testUser.email,
        role: testUser.role
      });

      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.token).not.toBe(token); // Should be a new token
    });

    test('should fail refresh with invalid token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail refresh without token', async () => {
      const response = await request(app)
        .post('/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout user successfully', async () => {
      const token = global.testUtils.generateTestToken({
        serviceNumber: testUser.serviceNumber,
        email: testUser.email,
        role: testUser.role
      });

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    test('should handle logout without token gracefully', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('POST /auth/forgot-password', () => {
    test('should initiate password reset for valid email', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: testUser.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset email sent');
    });

    test('should fail password reset for non-existent email', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@army.mil' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    test('should fail password reset with invalid email format', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /auth/profile', () => {
    test('should get user profile with valid token', async () => {
      const token = global.testUtils.generateTestToken({
        serviceNumber: testUser.serviceNumber,
        email: testUser.email,
        role: testUser.role
      });

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.serviceNumber).toBe(testUser.serviceNumber);
    });

    test('should fail to get profile without token', async () => {
      const response = await request(app)
        .get('/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail to get profile with invalid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /auth/profile', () => {
    test('should update user profile with valid data', async () => {
      const token = global.testUtils.generateTestToken({
        serviceNumber: testUser.serviceNumber,
        email: testUser.email,
        role: testUser.role
      });

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+919876543299'
      };

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.user.firstName).toBe(updateData.firstName);
      expect(response.body.data.user.lastName).toBe(updateData.lastName);
    });

    test('should fail to update profile without token', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const response = await request(app)
        .put('/auth/profile')
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail to update profile with invalid phone number', async () => {
      const token = global.testUtils.generateTestToken({
        serviceNumber: testUser.serviceNumber,
        email: testUser.email,
        role: testUser.role
      });

      const updateData = {
        phoneNumber: 'invalid-phone'
      };

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
