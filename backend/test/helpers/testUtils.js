const mongoose = require('mongoose');
const User = require('../../models/User');
const WelfareScheme = require('../../models/WelfareScheme');
const Application = require('../../models/Application');
const MarketplaceItem = require('../../models/MarketplaceItem');
const Grievance = require('../../models/Grievance');
const EmergencyAlert = require('../../models/EmergencyAlert');

// Test utilities for creating and managing test data
class TestUtils {
  // Clean all collections before/after tests
  async cleanDatabase() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }

  // Create a test user with default or custom data
  async createTestUser(overrides = {}) {
    const defaultUserData = {
      firebaseUid: `test-user-${Date.now()}-${Math.random()}`,
      coreData: {
        firstName: 'Test',
        lastName: 'User',
        role: 'Officer',
        contactInfo: {
          email: `test${Date.now()}@example.com`,
          phone: '1234567890'
        }
      },
      isActive: true,
      isVerified: true,
      ...overrides
    };

    // Handle nested overrides for coreData
    if (overrides.coreData) {
      defaultUserData.coreData = {
        ...defaultUserData.coreData,
        ...overrides.coreData
      };
    }

    // Handle role-specific data
    if (overrides.role) {
      defaultUserData.coreData.role = overrides.role;
    }

    const user = new User(defaultUserData);
    return await user.save();
  }

  // Create a test welfare scheme
  async createTestScheme(overrides = {}) {
    const testUser = await this.createTestUser({ coreData: { role: 'Admin' } });
    
    const defaultSchemeData = {
      name: 'Test Welfare Scheme',
      description: 'A test welfare scheme for testing purposes',
      category: 'housing',
      eligibilityType: 'officer',
      eligibilityCriteria: ['Active service', 'Minimum service period'],
      requiredDocuments: ['Service certificate', 'ID proof'],
      benefits: ['Test benefit 1', 'Test benefit 2'],
      applicationProcess: 'Apply through online portal',
      budgetAllocation: 100000,
      benefitAmount: 10000,
      createdBy: testUser._id,
      isActive: true,
      isVisible: true,
      ...overrides
    };

    const scheme = new WelfareScheme(defaultSchemeData);
    return await scheme.save();
  }

  // Create a test application
  async createTestApplication(overrides = {}) {
    const testUser = await this.createTestUser();
    const testScheme = await this.createTestScheme();

    const defaultApplicationData = {
      applicant: testUser._id,
      scheme: testScheme._id,
      personalInfo: {
        fullName: 'Test User',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male',
        contactInfo: {
          email: 'test@example.com',
          phone: '1234567890'
        }
      },
      applicationData: {
        reason: 'Test reason for application',
        expectedBenefit: 'Test expected benefit'
      },
      documents: [],
      status: 'pending',
      ...overrides
    };

    const application = new Application(defaultApplicationData);
    return await application.save();
  }

  // Create a test marketplace item
  async createTestMarketplaceItem(overrides = {}) {
    const testUser = await this.createTestUser();

    const defaultItemData = {
      title: 'Test Marketplace Item',
      description: 'A test item for marketplace testing',
      category: 'electronics',
      condition: 'excellent',
      price: 1000,
      seller: testUser._id,
      contactInfo: {
        phone: '1234567890',
        email: 'seller@example.com'
      },
      images: [],
      status: 'available',
      ...overrides
    };

    const item = new MarketplaceItem(defaultItemData);
    return await item.save();
  }

  // Create a test grievance
  async createTestGrievance(overrides = {}) {
    const testUser = await this.createTestUser();

    const defaultGrievanceData = {
      title: 'Test Grievance',
      description: 'A test grievance for testing purposes',
      category: 'administrative',
      priority: 'medium',
      submittedBy: testUser._id,
      status: 'pending',
      attachments: [],
      ...overrides
    };

    const grievance = new Grievance(defaultGrievanceData);
    return await grievance.save();
  }

  // Create a test emergency alert
  async createTestEmergencyAlert(overrides = {}) {
    const testUser = await this.createTestUser();

    const defaultAlertData = {
      title: 'Test Emergency Alert',
      description: 'A test emergency alert',
      severity: 'medium',
      alertType: 'general',
      createdBy: testUser._id,
      targetAudience: ['all'],
      status: 'active',
      location: {
        coordinates: [77.2090, 28.6139],
        address: 'Test Location, Delhi'
      },
      ...overrides
    };

    const alert = new EmergencyAlert(defaultAlertData);
    return await alert.save();
  }

  // Generate a test JWT token for authentication
  generateTestToken(payload = {}) {
    const defaultPayload = {
      uid: 'test-user-uid',
      email: 'test@example.com',
      role: 'Officer',
      ...payload
    };

    // In a real scenario, you'd use a proper JWT library
    // For tests, we'll return a simple token that can be mocked
    return `test-token-${Buffer.from(JSON.stringify(defaultPayload)).toString('base64')}`;
  }

  // Connect to test database
  async connectToTestDB() {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/welfare-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  }

  // Disconnect from test database
  async disconnectFromTestDB() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  // Wait for a specific amount of time (useful for testing async operations)
  async wait(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Create multiple test documents of the same type
  async createMultiple(createFunction, count = 3, overrides = []) {
    const promises = [];
    for (let i = 0; i < count; i++) {
      const override = overrides[i] || {};
      promises.push(createFunction.call(this, override));
    }
    return await Promise.all(promises);
  }

  // Get a random item from an array
  getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Generate random string
  generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Generate random email
  generateRandomEmail() {
    return `test-${this.generateRandomString(8)}@example.com`;
  }

  // Generate random phone number
  generateRandomPhone() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }
}

// Export a singleton instance
module.exports = new TestUtils();
