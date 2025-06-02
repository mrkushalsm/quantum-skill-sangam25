const mongoose = require('mongoose');
const Application = require('../../../models/Application');
const WelfareScheme = require('../../../models/WelfareScheme');
const User = require('../../../models/User');

describe('Application Model', () => {
  let testUser, testScheme;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create test user
    testUser = await global.testUtils.createTestUser({
      firebaseUid: 'test-applicant-uid',
      email: 'applicant@army.mil',
      role: 'officer',
      serviceNumber: 'APP001'
    });

    // Create test scheme
    testScheme = await global.testUtils.createTestScheme({
      name: 'Test Application Scheme',
      createdBy: testUser._id
    });
  });

  describe('Schema Validation', () => {
    test('should create a valid application', async () => {
      const applicationData = {
        scheme: testScheme._id,
        applicant: testUser._id,
        applicationId: 'APP-001-2024',
        status: 'submitted',
        personalDetails: {
          fullName: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          address: {
            street: '123 Test Street',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001',
            country: 'India'
          },
          phoneNumber: '9876543210',
          email: 'john.doe@army.mil'
        }
      };

      const application = new Application(applicationData);
      const savedApplication = await application.save();

      expect(savedApplication._id).toBeDefined();
      expect(savedApplication.applicationId).toBe('APP-001-2024');
      expect(savedApplication.status).toBe('submitted');
      expect(savedApplication.personalDetails.fullName).toBe('John Doe');
      expect(savedApplication.personalDetails.address.city).toBe('New Delhi');
    });

    test('should fail validation for missing required fields', async () => {
      const applicationData = {
        scheme: testScheme._id,
        applicant: testUser._id
        // Missing applicationId and personalDetails
      };

      const application = new Application(applicationData);
      await expect(application.save()).rejects.toThrow();
    });

    test('should fail validation for invalid status', async () => {
      const applicationData = {
        scheme: testScheme._id,
        applicant: testUser._id,
        applicationId: 'APP-002-2024',
        status: 'invalid_status', // Invalid enum value
        personalDetails: {
          fullName: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          address: {
            street: '123 Test Street',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001'
          },
          phoneNumber: '9876543210',
          email: 'john.doe@army.mil'
        }
      };

      const application = new Application(applicationData);
      await expect(application.save()).rejects.toThrow();
    });

    test('should fail validation for invalid phone number format', async () => {
      const applicationData = {
        scheme: testScheme._id,
        applicant: testUser._id,
        applicationId: 'APP-003-2024',
        personalDetails: {
          fullName: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          address: {
            street: '123 Test Street',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001'
          },
          phoneNumber: '123', // Invalid phone number
          email: 'john.doe@army.mil'
        }
      };

      const application = new Application(applicationData);
      await expect(application.save()).rejects.toThrow();
    });

    test('should fail validation for invalid pincode format', async () => {
      const applicationData = {
        scheme: testScheme._id,
        applicant: testUser._id,
        applicationId: 'APP-004-2024',
        personalDetails: {
          fullName: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          address: {
            street: '123 Test Street',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '1100' // Invalid pincode
          },
          phoneNumber: '9876543210',
          email: 'john.doe@army.mil'
        }
      };

      const application = new Application(applicationData);
      await expect(application.save()).rejects.toThrow();
    });

    test('should enforce unique applicationId constraint', async () => {
      const applicationData1 = {
        scheme: testScheme._id,
        applicant: testUser._id,
        applicationId: 'APP-UNIQUE-2024',
        personalDetails: {
          fullName: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          address: {
            street: '123 Test Street',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001'
          },
          phoneNumber: '9876543210',
          email: 'john.doe@army.mil'
        }
      };

      // Create second user for second application
      const testUser2 = await global.testUtils.createTestUser({
        firebaseUid: 'test-applicant-uid-2',
        email: 'applicant2@army.mil',
        serviceNumber: 'APP002'
      });

      const applicationData2 = {
        scheme: testScheme._id,
        applicant: testUser2._id,
        applicationId: 'APP-UNIQUE-2024', // Same applicationId
        personalDetails: {
          fullName: 'Jane Smith',
          dateOfBirth: new Date('1992-01-01'),
          gender: 'female',
          address: {
            street: '456 Test Avenue',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
          },
          phoneNumber: '9876543211',
          email: 'jane.smith@army.mil'
        }
      };

      const application1 = new Application(applicationData1);
      await application1.save();

      const application2 = new Application(applicationData2);
      await expect(application2.save()).rejects.toThrow();
    });
  });

  describe('Status Validation', () => {
    const validStatuses = [
      'draft',
      'submitted',
      'under_review',
      'pending_documents',
      'approved',
      'rejected',
      'cancelled'
    ];

    validStatuses.forEach(status => {
      test(`should accept valid status: ${status}`, async () => {
        const applicationData = {
          scheme: testScheme._id,
          applicant: testUser._id,
          applicationId: `APP-${status.toUpperCase()}-2024`,
          status: status,
          personalDetails: {
            fullName: 'John Doe',
            dateOfBirth: new Date('1990-01-01'),
            gender: 'male',
            address: {
              street: '123 Test Street',
              city: 'New Delhi',
              state: 'Delhi',
              pincode: '110001'
            },
            phoneNumber: '9876543210',
            email: 'john.doe@army.mil'
          }
        };

        const application = new Application(applicationData);
        const savedApplication = await application.save();

        expect(savedApplication.status).toBe(status);
      });
    });
  });

  describe('Gender Validation', () => {
    const validGenders = ['male', 'female', 'other'];

    validGenders.forEach(gender => {
      test(`should accept valid gender: ${gender}`, async () => {
        const applicationData = {
          scheme: testScheme._id,
          applicant: testUser._id,
          applicationId: `APP-GENDER-${gender.toUpperCase()}-2024`,
          personalDetails: {
            fullName: 'Test Person',
            dateOfBirth: new Date('1990-01-01'),
            gender: gender,
            address: {
              street: '123 Test Street',
              city: 'New Delhi',
              state: 'Delhi',
              pincode: '110001'
            },
            phoneNumber: '9876543210',
            email: 'test@army.mil'
          }
        };

        const application = new Application(applicationData);
        const savedApplication = await application.save();

        expect(savedApplication.personalDetails.gender).toBe(gender);
      });
    });
  });

  describe('Default Values', () => {
    test('should set default status to draft', async () => {
      const applicationData = {
        scheme: testScheme._id,
        applicant: testUser._id,
        applicationId: 'APP-DEFAULT-2024',
        personalDetails: {
          fullName: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          address: {
            street: '123 Test Street',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001'
          },
          phoneNumber: '9876543210',
          email: 'john.doe@army.mil'
        }
        // No status specified
      };

      const application = new Application(applicationData);
      const savedApplication = await application.save();

      expect(savedApplication.status).toBe('draft');
    });

    test('should set default country to India', async () => {
      const applicationData = {
        scheme: testScheme._id,
        applicant: testUser._id,
        applicationId: 'APP-COUNTRY-2024',
        personalDetails: {
          fullName: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          address: {
            street: '123 Test Street',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001'
            // No country specified
          },
          phoneNumber: '9876543210',
          email: 'john.doe@army.mil'
        }
      };

      const application = new Application(applicationData);
      const savedApplication = await application.save();

      expect(savedApplication.personalDetails.address.country).toBe('India');
    });
  });

  describe('Optional Fields', () => {
    test('should save application with optional personal details', async () => {
      const applicationData = {
        scheme: testScheme._id,
        applicant: testUser._id,
        applicationId: 'APP-OPTIONAL-2024',
        personalDetails: {
          fullName: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          fatherName: 'Father Name',
          motherName: 'Mother Name',
          spouseName: 'Spouse Name',
          address: {
            street: '123 Test Street',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001'
          },
          phoneNumber: '9876543210',
          alternatePhoneNumber: '9876543211',
          email: 'john.doe@army.mil'
        }
      };

      const application = new Application(applicationData);
      const savedApplication = await application.save();

      expect(savedApplication.personalDetails.fatherName).toBe('Father Name');
      expect(savedApplication.personalDetails.motherName).toBe('Mother Name');
      expect(savedApplication.personalDetails.spouseName).toBe('Spouse Name');
      expect(savedApplication.personalDetails.alternatePhoneNumber).toBe('9876543211');
    });

    test('should save application with bank details', async () => {
      const applicationData = {
        scheme: testScheme._id,
        applicant: testUser._id,
        applicationId: 'APP-BANK-2024',
        personalDetails: {
          fullName: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          address: {
            street: '123 Test Street',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001'
          },
          phoneNumber: '9876543210',
          email: 'john.doe@army.mil',
          bankDetails: {
            accountNumber: '1234567890',
            ifscCode: 'SBIN0001234',
            bankName: 'State Bank of India',
            branchName: 'New Delhi Branch',
            accountHolderName: 'John Doe'
          }
        }
      };

      const application = new Application(applicationData);
      const savedApplication = await application.save();

      expect(savedApplication.personalDetails.bankDetails.accountNumber).toBe('1234567890');
      expect(savedApplication.personalDetails.bankDetails.ifscCode).toBe('SBIN0001234');
      expect(savedApplication.personalDetails.bankDetails.bankName).toBe('State Bank of India');
    });
  });

  describe('Reference Population', () => {
    test('should populate scheme and applicant references', async () => {
      const applicationData = {
        scheme: testScheme._id,
        applicant: testUser._id,
        applicationId: 'APP-POPULATE-2024',
        personalDetails: {
          fullName: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          address: {
            street: '123 Test Street',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001'
          },
          phoneNumber: '9876543210',
          email: 'john.doe@army.mil'
        }
      };

      const application = new Application(applicationData);
      const savedApplication = await application.save();

      const populatedApplication = await Application
        .findById(savedApplication._id)
        .populate('scheme')
        .populate('applicant');

      expect(populatedApplication.scheme.name).toBe(testScheme.name);
      expect(populatedApplication.applicant.email).toBe(testUser.email);
    });
  });

  describe('Model Queries', () => {
    beforeEach(async () => {
      // Create test applications with different statuses
      const testApplications = [
        {
          scheme: testScheme._id,
          applicant: testUser._id,
          applicationId: 'APP-QUERY-001',
          status: 'submitted',
          personalDetails: {
            fullName: 'John Doe 1',
            dateOfBirth: new Date('1990-01-01'),
            gender: 'male',
            address: {
              street: '123 Test Street',
              city: 'New Delhi',
              state: 'Delhi',
              pincode: '110001'
            },
            phoneNumber: '9876543210',
            email: 'john1@army.mil'
          }
        },
        {
          scheme: testScheme._id,
          applicant: testUser._id,
          applicationId: 'APP-QUERY-002',
          status: 'approved',
          personalDetails: {
            fullName: 'John Doe 2',
            dateOfBirth: new Date('1991-01-01'),
            gender: 'male',
            address: {
              street: '456 Test Avenue',
              city: 'Mumbai',
              state: 'Maharashtra',
              pincode: '400001'
            },
            phoneNumber: '9876543211',
            email: 'john2@army.mil'
          }
        },
        {
          scheme: testScheme._id,
          applicant: testUser._id,
          applicationId: 'APP-QUERY-003',
          status: 'rejected',
          personalDetails: {
            fullName: 'John Doe 3',
            dateOfBirth: new Date('1992-01-01'),
            gender: 'female',
            address: {
              street: '789 Test Road',
              city: 'Bangalore',
              state: 'Karnataka',
              pincode: '560001'
            },
            phoneNumber: '9876543212',
            email: 'john3@army.mil'
          }
        }
      ];

      await Application.insertMany(testApplications);
    });

    test('should find applications by status', async () => {
      const submittedApps = await Application.find({ status: 'submitted' });
      const approvedApps = await Application.find({ status: 'approved' });
      const rejectedApps = await Application.find({ status: 'rejected' });

      expect(submittedApps).toHaveLength(1);
      expect(approvedApps).toHaveLength(1);
      expect(rejectedApps).toHaveLength(1);
    });

    test('should find applications by applicant', async () => {
      const userApplications = await Application.find({ applicant: testUser._id });
      expect(userApplications).toHaveLength(3);
    });

    test('should find applications by scheme', async () => {
      const schemeApplications = await Application.find({ scheme: testScheme._id });
      expect(schemeApplications).toHaveLength(3);
    });

    test('should find applications with specific criteria', async () => {
      const maleApplications = await Application.find({
        'personalDetails.gender': 'male'
      });
      expect(maleApplications).toHaveLength(2);

      const femaleApplications = await Application.find({
        'personalDetails.gender': 'female'
      });
      expect(femaleApplications).toHaveLength(1);
    });
  });

  describe('Status Transitions', () => {
    test('should allow valid status transitions', async () => {
      const applicationData = {
        scheme: testScheme._id,
        applicant: testUser._id,
        applicationId: 'APP-TRANSITION-2024',
        status: 'draft',
        personalDetails: {
          fullName: 'John Doe',
          dateOfBirth: new Date('1990-01-01'),
          gender: 'male',
          address: {
            street: '123 Test Street',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001'
          },
          phoneNumber: '9876543210',
          email: 'john.doe@army.mil'
        }
      };

      const application = new Application(applicationData);
      const savedApplication = await application.save();

      // Transition from draft to submitted
      savedApplication.status = 'submitted';
      const submittedApp = await savedApplication.save();
      expect(submittedApp.status).toBe('submitted');

      // Transition from submitted to under_review
      submittedApp.status = 'under_review';
      const reviewApp = await submittedApp.save();
      expect(reviewApp.status).toBe('under_review');

      // Transition to approved
      reviewApp.status = 'approved';
      const approvedApp = await reviewApp.save();
      expect(approvedApp.status).toBe('approved');
    });
  });
});
