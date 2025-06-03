// Set test environment
process.env.NODE_ENV = 'test';

// Import test utilities
const testUtils = require('../test/helpers/testUtils');

// Make testUtils available globally
global.testUtils = testUtils;

// Mock Firebase before any modules are loaded
jest.mock('../config/firebase', () => ({
  initializeFirebase: jest.fn(),
  verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user', email: 'test@example.com' }),
  createCustomToken: jest.fn().mockResolvedValue('test-token'),
  getUserByUid: jest.fn().mockResolvedValue({ uid: 'test-user' }),
  setCustomUserClaims: jest.fn().mockResolvedValue(true),
  deleteUser: jest.fn().mockResolvedValue(true),
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user' }),
    createUser: jest.fn().mockResolvedValue({ uid: 'test-user' }),
    deleteUser: jest.fn().mockResolvedValue(true)
  })),
  getFirestore: jest.fn(() => ({
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
    set: jest.fn().mockResolvedValue(true)
  })),
  getStorage: jest.fn(() => ({
    bucket: jest.fn().mockReturnThis(),
    file: jest.fn().mockReturnThis()
  })),
  admin: null
}));

// Mock EmailService
jest.mock('../utils/emailService', () => ({
  createTransporter: jest.fn(),
  sendEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendNotificationEmail: jest.fn().mockResolvedValue(true)
}));

// Mock notification utils
jest.mock('../utils/notification', () => ({
  sendNotification: jest.fn().mockResolvedValue(true),
  sendPushNotification: jest.fn().mockResolvedValue(true),
  sendEmailNotification: jest.fn().mockResolvedValue(true),
  sendSMSNotification: jest.fn().mockResolvedValue(true),
  broadcastNotification: jest.fn().mockResolvedValue(true)
}));

// Mock socket utils
jest.mock('../utils/socket', () => ({
  initializeSocket: jest.fn(),
  emitToUser: jest.fn(),
  emitToRoom: jest.fn(),
  broadcastToAll: jest.fn(),
  handleConnection: jest.fn(),
  handleDisconnection: jest.fn()
}));

// Mock file upload middleware
jest.mock('../middleware/upload', () => ({
  uploadSingle: jest.fn((fieldName) => (req, res, next) => {
    req.file = { filename: 'test-file.jpg', path: '/test/path' };
    next();
  }),
  uploadMultiple: jest.fn((fieldName) => (req, res, next) => {
    req.files = [{ filename: 'test-file.jpg', path: '/test/path' }];
    next();
  })
}));

// testUtils already imported and made available globally above

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await testUtils.connectToTestDB();
});

afterAll(async () => {
  // Clean up and disconnect
  await testUtils.cleanDatabase();
  await testUtils.disconnectFromTestDB();
});

// Increase timeout for all tests
jest.setTimeout(30000);
