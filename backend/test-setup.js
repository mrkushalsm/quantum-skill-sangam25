// Jest Test Setup File for Armed Forces Welfare Management System
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const path = require('path');

let mongoServer;

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  auth: () => ({
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    getUserByEmail: jest.fn(),
    setCustomUserClaims: jest.fn()
  }),
  firestore: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      })),
      add: jest.fn(),
      get: jest.fn()
    }))
  })
}));

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn((mailOptions, callback) => {
      if (callback) callback(null, { messageId: 'test-message-id' });
      return Promise.resolve({ messageId: 'test-message-id' });
    }),
    verify: jest.fn(() => Promise.resolve(true))
  }))
}));

// Mock Twilio
jest.mock('twilio', () => {
  return jest.fn(() => ({
    messages: {
      create: jest.fn(() => Promise.resolve({ sid: 'test-sid' }))
    }
  }));
});

// Mock multer for file upload testing
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = {
        fieldname: 'file',
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024,
        filename: 'test.pdf',
        path: '/tmp/test.pdf'
      };
      next();
    },
    array: () => (req, res, next) => {
      req.files = [{
        fieldname: 'files',
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test file content'),
        size: 1024
      }];
      next();
    }
  });
  multer.diskStorage = jest.fn();
  return multer;
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.FIREBASE_ADMIN_SDK_PATH = path.join(__dirname, 'test-firebase-key.json');
process.env.EMAIL_HOST = 'smtp.test.com';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@test.com';
process.env.EMAIL_PASS = 'testpass';
process.env.TWILIO_ACCOUNT_SID = 'test-twilio-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-twilio-token';
process.env.TWILIO_PHONE_NUMBER = '+1234567890';

// Test fixtures
global.testFixtures = {
  user: {
    serviceNumber: 'TEST001',
    name: 'Test User',
    email: 'test@army.mil',
    phone: '+919876543210',
    rank: 'Captain',
    unit: 'Test Regiment',
    serviceType: 'Army',
    dateOfBirth: new Date('1990-01-01'),
    dateOfJoining: new Date('2015-01-01'),
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456'
    },
    emergencyContact: {
      name: 'Test Emergency',
      relationship: 'Spouse',
      phone: '+919876543211'
    },
    isActive: true
  },
  
  welfareScheme: {
    name: 'Test Welfare Scheme',
    description: 'Test scheme for unit testing',
    category: 'Education',
    eligibilityCriteria: ['Active service member'],
    benefits: ['Education loan'],
    applicationProcess: 'Apply online',
    requiredDocuments: ['Service certificate'],
    isActive: true
  },
  
  application: {
    applicantServiceNumber: 'TEST001',
    schemeId: null, // Will be set in tests
    status: 'pending',
    submittedAt: new Date(),
    personalDetails: {
      name: 'Test User',
      email: 'test@army.mil',
      phone: '+919876543210'
    },
    documents: []
  },
  
  validTokenPayload: {
    serviceNumber: 'TEST001',
    email: 'test@army.mil',
    role: 'user'
  }
};

// Global test utilities
global.testUtils = {
  // Generate JWT token for testing
  generateTestToken: (payload = global.testFixtures.validTokenPayload) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  },
  
  // Clean all collections
  cleanDatabase: async () => {
    if (mongoose.connection.readyState === 1) {
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    }
  },
  
  // Create test user
  createTestUser: async (userData = {}) => {
    const User = require('./models/User');
    const testUser = new User({
      ...global.testFixtures.user,
      ...userData
    });
    return await testUser.save();
  },
  
  // Create test welfare scheme
  createTestScheme: async (schemeData = {}) => {
    const WelfareScheme = require('./models/WelfareScheme');
    const testScheme = new WelfareScheme({
      ...global.testFixtures.welfareScheme,
      ...schemeData
    });
    return await testScheme.save();
  }
};

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  // Create Firebase key file for testing
  const fs = require('fs');
  const firebaseKeyPath = process.env.FIREBASE_ADMIN_SDK_PATH;
  if (!fs.existsSync(firebaseKeyPath)) {
    fs.writeFileSync(firebaseKeyPath, JSON.stringify({
      type: 'service_account',
      project_id: 'test-project',
      private_key_id: 'test-key-id',
      private_key: '-----BEGIN PRIVATE KEY-----\ntest-private-key\n-----END PRIVATE KEY-----\n',
      client_email: 'test@test-project.iam.gserviceaccount.com',
      client_id: 'test-client-id',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token'
    }));
  }
});

// Cleanup after each test
afterEach(async () => {
  if (global.testUtils.cleanDatabase) {
    await global.testUtils.cleanDatabase();
  }
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  // Clean up test files
  const fs = require('fs');
  const firebaseKeyPath = process.env.FIREBASE_ADMIN_SDK_PATH;
  if (fs.existsSync(firebaseKeyPath)) {
    fs.unlinkSync(firebaseKeyPath);
  }
});
