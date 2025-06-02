const mongoose = require('mongoose');
const User = require('../../../models/User');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    test('should create a valid officer user', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-123',
        email: 'officer@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        serviceNumber: 'OFF001',
        rank: 'Captain',
        unit: '1st Battalion'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.firebaseUid).toBe(userData.firebaseUid);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.firstName).toBe(userData.firstName);
      expect(savedUser.lastName).toBe(userData.lastName);
      expect(savedUser.role).toBe('officer');
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.isVerified).toBe(false);
    });

    test('should create a valid family member user', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-456',
        email: 'family@army.mil',
        firstName: 'Jane',
        lastName: 'Doe',
        phoneNumber: '9876543211',
        role: 'family_member',
        relationToOfficer: 'spouse',
        officerServiceNumber: 'OFF001'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.role).toBe('family_member');
      expect(savedUser.relationToOfficer).toBe('spouse');
      expect(savedUser.officerServiceNumber).toBe('OFF001');
    });

    test('should fail validation for missing required fields', async () => {
      const userData = {
        email: 'test@army.mil',
        firstName: 'John'
        // Missing required fields
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should fail validation for invalid email format', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-789',
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        serviceNumber: 'OFF002',
        rank: 'Major',
        unit: '2nd Battalion'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should fail validation for invalid phone number format', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-101',
        email: 'test@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '123', // Invalid phone number
        role: 'officer',
        serviceNumber: 'OFF003',
        rank: 'Colonel',
        unit: '3rd Battalion'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should fail validation for invalid role', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-102',
        email: 'test@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'invalid_role', // Invalid role
        serviceNumber: 'OFF004',
        rank: 'Lieutenant',
        unit: '4th Battalion'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should enforce unique constraints', async () => {
      const userData1 = {
        firebaseUid: 'test-firebase-uid-unique1',
        email: 'unique@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        serviceNumber: 'OFF_UNIQUE',
        rank: 'Captain',
        unit: '1st Battalion'
      };

      const userData2 = {
        firebaseUid: 'test-firebase-uid-unique2',
        email: 'unique@army.mil', // Same email
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '9876543211',
        role: 'officer',
        serviceNumber: 'OFF_UNIQUE2',
        rank: 'Major',
        unit: '2nd Battalion'
      };

      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('Officer-specific validations', () => {
    test('should require serviceNumber for officer role', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-officer1',
        email: 'officer1@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        rank: 'Captain',
        unit: '1st Battalion'
        // Missing serviceNumber
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should require rank for officer role', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-officer2',
        email: 'officer2@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        serviceNumber: 'OFF_RANK_TEST',
        unit: '1st Battalion'
        // Missing rank
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should require unit for officer role', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-officer3',
        email: 'officer3@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        serviceNumber: 'OFF_UNIT_TEST',
        rank: 'Captain'
        // Missing unit
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Family member-specific validations', () => {
    test('should require relationToOfficer for family_member role', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-family1',
        email: 'family1@army.mil',
        firstName: 'Jane',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'family_member',
        officerServiceNumber: 'OFF001'
        // Missing relationToOfficer
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should require officerServiceNumber for family_member role', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-family2',
        email: 'family2@army.mil',
        firstName: 'Jane',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'family_member',
        relationToOfficer: 'spouse'
        // Missing officerServiceNumber
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    test('should validate relationToOfficer enum values', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-family3',
        email: 'family3@army.mil',
        firstName: 'Jane',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'family_member',
        relationToOfficer: 'invalid_relation', // Invalid enum value
        officerServiceNumber: 'OFF001'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Emergency Contacts', () => {
    test('should save emergency contacts with valid data', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-contact1',
        email: 'contact1@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        serviceNumber: 'OFF_CONTACT_TEST',
        rank: 'Captain',
        unit: '1st Battalion',
        emergencyContacts: [
          {
            name: 'Emergency Contact 1',
            relationship: 'spouse',
            phoneNumber: '9876543211',
            isPrimary: true
          },
          {
            name: 'Emergency Contact 2',
            relationship: 'parent',
            phoneNumber: '9876543212',
            isPrimary: false
          }
        ]
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.emergencyContacts).toHaveLength(2);
      expect(savedUser.emergencyContacts[0].name).toBe('Emergency Contact 1');
      expect(savedUser.emergencyContacts[0].isPrimary).toBe(true);
      expect(savedUser.emergencyContacts[1].isPrimary).toBe(false);
    });

    test('should validate emergency contact phone number format', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-contact2',
        email: 'contact2@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        serviceNumber: 'OFF_CONTACT_TEST2',
        rank: 'Captain',
        unit: '1st Battalion',
        emergencyContacts: [
          {
            name: 'Emergency Contact',
            relationship: 'spouse',
            phoneNumber: '123', // Invalid phone number
            isPrimary: true
          }
        ]
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Address Validation', () => {
    test('should save valid address', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-address1',
        email: 'address1@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        serviceNumber: 'OFF_ADDRESS_TEST',
        rank: 'Captain',
        unit: '1st Battalion',
        address: {
          street: '123 Main Street',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
          country: 'India'
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.address.street).toBe('123 Main Street');
      expect(savedUser.address.city).toBe('New Delhi');
      expect(savedUser.address.pincode).toBe('110001');
    });

    test('should validate pincode format', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-address2',
        email: 'address2@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        serviceNumber: 'OFF_ADDRESS_TEST2',
        rank: 'Captain',
        unit: '1st Battalion',
        address: {
          street: '123 Main Street',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '1100', // Invalid pincode
          country: 'India'
        }
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('Notification Preferences', () => {
    test('should set default notification preferences', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-notif1',
        email: 'notif1@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        serviceNumber: 'OFF_NOTIF_TEST',
        rank: 'Captain',
        unit: '1st Battalion'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.notificationPreferences.email).toBe(true);
      expect(savedUser.notificationPreferences.sms).toBe(true);
      expect(savedUser.notificationPreferences.push).toBe(true);
      expect(savedUser.notificationPreferences.emergencyAlerts).toBe(true);
    });

    test('should allow custom notification preferences', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-notif2',
        email: 'notif2@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        serviceNumber: 'OFF_NOTIF_TEST2',
        rank: 'Captain',
        unit: '1st Battalion',
        notificationPreferences: {
          email: false,
          sms: true,
          push: false,
          emergencyAlerts: true
        }
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.notificationPreferences.email).toBe(false);
      expect(savedUser.notificationPreferences.sms).toBe(true);
      expect(savedUser.notificationPreferences.push).toBe(false);
      expect(savedUser.notificationPreferences.emergencyAlerts).toBe(true);
    });
  });

  describe('User Methods', () => {
    test('should update last login timestamp', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-login1',
        email: 'login1@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        serviceNumber: 'OFF_LOGIN_TEST',
        rank: 'Captain',
        unit: '1st Battalion'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      // Simulate login
      savedUser.lastLogin = new Date();
      const updatedUser = await savedUser.save();

      expect(updatedUser.lastLogin).toBeDefined();
      expect(updatedUser.lastLogin).toBeInstanceOf(Date);
    });

    test('should toggle user active status', async () => {
      const userData = {
        firebaseUid: 'test-firebase-uid-active1',
        email: 'active1@army.mil',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '9876543210',
        role: 'officer',
        serviceNumber: 'OFF_ACTIVE_TEST',
        rank: 'Captain',
        unit: '1st Battalion'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.isActive).toBe(true);

      // Deactivate user
      savedUser.isActive = false;
      const updatedUser = await savedUser.save();

      expect(updatedUser.isActive).toBe(false);
    });
  });

  describe('Model Queries', () => {
    beforeEach(async () => {
      // Create test users
      const testUsers = [
        {
          firebaseUid: 'test-firebase-uid-query1',
          email: 'query1@army.mil',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '9876543210',
          role: 'officer',
          serviceNumber: 'OFF_QUERY1',
          rank: 'Captain',
          unit: '1st Battalion',
          isActive: true
        },
        {
          firebaseUid: 'test-firebase-uid-query2',
          email: 'query2@army.mil',
          firstName: 'Jane',
          lastName: 'Smith',
          phoneNumber: '9876543211',
          role: 'family_member',
          relationToOfficer: 'spouse',
          officerServiceNumber: 'OFF_QUERY1',
          isActive: true
        },
        {
          firebaseUid: 'test-firebase-uid-query3',
          email: 'query3@army.mil',
          firstName: 'Bob',
          lastName: 'Wilson',
          phoneNumber: '9876543212',
          role: 'officer',
          serviceNumber: 'OFF_QUERY3',
          rank: 'Major',
          unit: '2nd Battalion',
          isActive: false
        }
      ];

      await User.insertMany(testUsers);
    });

    test('should find active users', async () => {
      const activeUsers = await User.find({ isActive: true });
      expect(activeUsers).toHaveLength(2);
    });

    test('should find users by role', async () => {
      const officers = await User.find({ role: 'officer' });
      const familyMembers = await User.find({ role: 'family_member' });

      expect(officers).toHaveLength(2);
      expect(familyMembers).toHaveLength(1);
    });

    test('should find user by service number', async () => {
      const user = await User.findOne({ serviceNumber: 'OFF_QUERY1' });
      expect(user).toBeTruthy();
      expect(user.firstName).toBe('John');
    });

    test('should find family members by officer service number', async () => {
      const familyMembers = await User.find({ officerServiceNumber: 'OFF_QUERY1' });
      expect(familyMembers).toHaveLength(1);
      expect(familyMembers[0].relationToOfficer).toBe('spouse');
    });
  });
});
