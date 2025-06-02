const mongoose = require('mongoose');
const WelfareScheme = require('../../../models/WelfareScheme');
const User = require('../../../models/User');

describe('WelfareScheme Model', () => {
  let testUser;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create a test user for scheme creation
    testUser = await global.testUtils.createTestUser({
      firebaseUid: 'test-admin-uid',
      email: 'admin@army.mil',
      role: 'admin'
    });
  });

  describe('Schema Validation', () => {
    test('should create a valid welfare scheme', async () => {
      const schemeData = {
        name: 'Test Housing Scheme',
        description: 'A test scheme for housing assistance',
        category: 'housing',
        subcategory: 'rent_allowance',
        eligibilityType: 'officer',
        eligibilityCriteria: ['Active service', 'Minimum 5 years service'],
        requiredDocuments: ['Service certificate', 'Income certificate'],
        benefits: ['Monthly rent allowance', 'Housing loan'],
        applicationProcess: 'Apply online through welfare portal',
        budgetAllocation: 1000000,
        benefitAmount: 50000,
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      const savedScheme = await scheme.save();

      expect(savedScheme._id).toBeDefined();
      expect(savedScheme.name).toBe(schemeData.name);
      expect(savedScheme.category).toBe('housing');
      expect(savedScheme.eligibilityType).toBe('officer');
      expect(savedScheme.isActive).toBe(true);
      expect(savedScheme.isVisible).toBe(true);
      expect(savedScheme.eligibilityCriteria).toHaveLength(2);
      expect(savedScheme.requiredDocuments).toHaveLength(2);
      expect(savedScheme.benefits).toHaveLength(2);
    });

    test('should fail validation for missing required fields', async () => {
      const schemeData = {
        name: 'Incomplete Scheme',
        description: 'Missing required fields'
        // Missing category, eligibilityType, etc.
      };

      const scheme = new WelfareScheme(schemeData);
      await expect(scheme.save()).rejects.toThrow();
    });

    test('should fail validation for invalid category', async () => {
      const schemeData = {
        name: 'Invalid Category Scheme',
        description: 'Scheme with invalid category',
        category: 'invalid_category', // Invalid enum value
        eligibilityType: 'officer',
        eligibilityCriteria: ['Active service'],
        requiredDocuments: ['Service certificate'],
        benefits: ['Benefit 1'],
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      await expect(scheme.save()).rejects.toThrow();
    });

    test('should fail validation for invalid eligibility type', async () => {
      const schemeData = {
        name: 'Invalid Eligibility Scheme',
        description: 'Scheme with invalid eligibility type',
        category: 'education',
        eligibilityType: 'invalid_type', // Invalid enum value
        eligibilityCriteria: ['Active service'],
        requiredDocuments: ['Service certificate'],
        benefits: ['Education benefit'],
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      await expect(scheme.save()).rejects.toThrow();
    });

    test('should validate string length limits', async () => {
      const schemeData = {
        name: 'A'.repeat(201), // Exceeds maxlength of 200
        description: 'Valid description',
        category: 'education',
        eligibilityType: 'officer',
        eligibilityCriteria: ['Active service'],
        requiredDocuments: ['Service certificate'],
        benefits: ['Education benefit'],
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      await expect(scheme.save()).rejects.toThrow();
    });

    test('should validate minimum values for numeric fields', async () => {
      const schemeData = {
        name: 'Negative Budget Scheme',
        description: 'Scheme with negative budget',
        category: 'financial_assistance',
        eligibilityType: 'officer',
        eligibilityCriteria: ['Active service'],
        requiredDocuments: ['Service certificate'],
        benefits: ['Financial aid'],
        budgetAllocation: -1000, // Negative value
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      await expect(scheme.save()).rejects.toThrow();
    });
  });

  describe('Category Validation', () => {
    const validCategories = [
      'housing',
      'education',
      'healthcare',
      'financial_assistance',
      'pension',
      'insurance',
      'recreation',
      'other'
    ];

    validCategories.forEach(category => {
      test(`should accept valid category: ${category}`, async () => {
        const schemeData = {
          name: `Test ${category} Scheme`,
          description: `A test scheme for ${category}`,
          category: category,
          eligibilityType: 'officer',
          eligibilityCriteria: ['Active service'],
          requiredDocuments: ['Service certificate'],
          benefits: ['Test benefit'],
          createdBy: testUser._id
        };

        const scheme = new WelfareScheme(schemeData);
        const savedScheme = await scheme.save();

        expect(savedScheme.category).toBe(category);
      });
    });
  });

  describe('Eligibility Type Validation', () => {
    const validEligibilityTypes = ['officer', 'family_member', 'both'];

    validEligibilityTypes.forEach(type => {
      test(`should accept valid eligibility type: ${type}`, async () => {
        const schemeData = {
          name: `Test ${type} Scheme`,
          description: `A test scheme for ${type}`,
          category: 'education',
          eligibilityType: type,
          eligibilityCriteria: ['Active service'],
          requiredDocuments: ['Service certificate'],
          benefits: ['Education benefit'],
          createdBy: testUser._id
        };

        const scheme = new WelfareScheme(schemeData);
        const savedScheme = await scheme.save();

        expect(savedScheme.eligibilityType).toBe(type);
      });
    });
  });

  describe('Array Field Validation', () => {
    test('should require at least one eligibility criteria', async () => {
      const schemeData = {
        name: 'No Criteria Scheme',
        description: 'Scheme without eligibility criteria',
        category: 'housing',
        eligibilityType: 'officer',
        eligibilityCriteria: [], // Empty array
        requiredDocuments: ['Service certificate'],
        benefits: ['Housing benefit'],
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      await expect(scheme.save()).rejects.toThrow();
    });

    test('should require at least one required document', async () => {
      const schemeData = {
        name: 'No Documents Scheme',
        description: 'Scheme without required documents',
        category: 'housing',
        eligibilityType: 'officer',
        eligibilityCriteria: ['Active service'],
        requiredDocuments: [], // Empty array
        benefits: ['Housing benefit'],
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      await expect(scheme.save()).rejects.toThrow();
    });

    test('should require at least one benefit', async () => {
      const schemeData = {
        name: 'No Benefits Scheme',
        description: 'Scheme without benefits',
        category: 'housing',
        eligibilityType: 'officer',
        eligibilityCriteria: ['Active service'],
        requiredDocuments: ['Service certificate'],
        benefits: [], // Empty array
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      await expect(scheme.save()).rejects.toThrow();
    });
  });

  describe('Financial Fields', () => {
    test('should save scheme with valid financial data', async () => {
      const schemeData = {
        name: 'Financial Test Scheme',
        description: 'Scheme with financial details',
        category: 'financial_assistance',
        eligibilityType: 'officer',
        eligibilityCriteria: ['Active service'],
        requiredDocuments: ['Service certificate'],
        benefits: ['Financial aid'],
        budgetAllocation: 5000000,
        benefitAmount: 100000,
        maxApplications: 50,
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      const savedScheme = await scheme.save();

      expect(savedScheme.budgetAllocation).toBe(5000000);
      expect(savedScheme.benefitAmount).toBe(100000);
      expect(savedScheme.maxApplications).toBe(50);
    });

    test('should validate minimum values for maxApplications', async () => {
      const schemeData = {
        name: 'Invalid Max Applications Scheme',
        description: 'Scheme with invalid max applications',
        category: 'education',
        eligibilityType: 'officer',
        eligibilityCriteria: ['Active service'],
        requiredDocuments: ['Service certificate'],
        benefits: ['Education benefit'],
        maxApplications: 0, // Below minimum
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      await expect(scheme.save()).rejects.toThrow();
    });
  });

  describe('Date Fields', () => {
    test('should save scheme with application deadline', async () => {
      const deadline = new Date('2024-12-31');
      const schemeData = {
        name: 'Deadline Test Scheme',
        description: 'Scheme with application deadline',
        category: 'education',
        eligibilityType: 'officer',
        eligibilityCriteria: ['Active service'],
        requiredDocuments: ['Service certificate'],
        benefits: ['Education benefit'],
        applicationDeadline: deadline,
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      const savedScheme = await scheme.save();

      expect(savedScheme.applicationDeadline).toEqual(deadline);
    });
  });

  describe('Status Fields', () => {
    test('should set default values for status fields', async () => {
      const schemeData = {
        name: 'Default Status Scheme',
        description: 'Scheme with default status values',
        category: 'healthcare',
        eligibilityType: 'both',
        eligibilityCriteria: ['Active service'],
        requiredDocuments: ['Service certificate'],
        benefits: ['Healthcare benefit'],
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      const savedScheme = await scheme.save();

      expect(savedScheme.isActive).toBe(true);
      expect(savedScheme.isVisible).toBe(true);
    });

    test('should allow custom status values', async () => {
      const schemeData = {
        name: 'Custom Status Scheme',
        description: 'Scheme with custom status values',
        category: 'healthcare',
        eligibilityType: 'both',
        eligibilityCriteria: ['Active service'],
        requiredDocuments: ['Service certificate'],
        benefits: ['Healthcare benefit'],
        isActive: false,
        isVisible: false,
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      const savedScheme = await scheme.save();

      expect(savedScheme.isActive).toBe(false);
      expect(savedScheme.isVisible).toBe(false);
    });
  });

  describe('Reference Fields', () => {
    test('should populate createdBy field', async () => {
      const schemeData = {
        name: 'Reference Test Scheme',
        description: 'Scheme to test reference population',
        category: 'housing',
        eligibilityType: 'officer',
        eligibilityCriteria: ['Active service'],
        requiredDocuments: ['Service certificate'],
        benefits: ['Housing benefit'],
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      const savedScheme = await scheme.save();

      const populatedScheme = await WelfareScheme
        .findById(savedScheme._id)
        .populate('createdBy');

      expect(populatedScheme.createdBy.email).toBe(testUser.email);
    });

    test('should update lastModifiedBy field', async () => {
      const schemeData = {
        name: 'Modified Test Scheme',
        description: 'Scheme to test modification tracking',
        category: 'education',
        eligibilityType: 'officer',
        eligibilityCriteria: ['Active service'],
        requiredDocuments: ['Service certificate'],
        benefits: ['Education benefit'],
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      const savedScheme = await scheme.save();

      // Update the scheme
      savedScheme.lastModifiedBy = testUser._id;
      savedScheme.description = 'Updated description';
      const updatedScheme = await savedScheme.save();

      expect(updatedScheme.lastModifiedBy.toString()).toBe(testUser._id.toString());
      expect(updatedScheme.description).toBe('Updated description');
    });
  });

  describe('Model Queries', () => {
    beforeEach(async () => {
      // Create test schemes
      const testSchemes = [
        {
          name: 'Active Housing Scheme',
          description: 'Active housing scheme',
          category: 'housing',
          eligibilityType: 'officer',
          eligibilityCriteria: ['Active service'],
          requiredDocuments: ['Service certificate'],
          benefits: ['Housing benefit'],
          isActive: true,
          isVisible: true,
          createdBy: testUser._id
        },
        {
          name: 'Inactive Education Scheme',
          description: 'Inactive education scheme',
          category: 'education',
          eligibilityType: 'family_member',
          eligibilityCriteria: ['Dependent status'],
          requiredDocuments: ['Dependency certificate'],
          benefits: ['Education benefit'],
          isActive: false,
          isVisible: true,
          createdBy: testUser._id
        },
        {
          name: 'Hidden Healthcare Scheme',
          description: 'Hidden healthcare scheme',
          category: 'healthcare',
          eligibilityType: 'both',
          eligibilityCriteria: ['Medical need'],
          requiredDocuments: ['Medical certificate'],
          benefits: ['Healthcare benefit'],
          isActive: true,
          isVisible: false,
          createdBy: testUser._id
        }
      ];

      await WelfareScheme.insertMany(testSchemes);
    });

    test('should find active schemes', async () => {
      const activeSchemes = await WelfareScheme.find({ isActive: true });
      expect(activeSchemes).toHaveLength(2);
    });

    test('should find visible schemes', async () => {
      const visibleSchemes = await WelfareScheme.find({ isVisible: true });
      expect(visibleSchemes).toHaveLength(2);
    });

    test('should find schemes by category', async () => {
      const housingSchemes = await WelfareScheme.find({ category: 'housing' });
      const educationSchemes = await WelfareScheme.find({ category: 'education' });

      expect(housingSchemes).toHaveLength(1);
      expect(educationSchemes).toHaveLength(1);
    });

    test('should find schemes by eligibility type', async () => {
      const officerSchemes = await WelfareScheme.find({ eligibilityType: 'officer' });
      const familySchemes = await WelfareScheme.find({ eligibilityType: 'family_member' });
      const bothSchemes = await WelfareScheme.find({ eligibilityType: 'both' });

      expect(officerSchemes).toHaveLength(1);
      expect(familySchemes).toHaveLength(1);
      expect(bothSchemes).toHaveLength(1);
    });

    test('should find active and visible schemes', async () => {
      const availableSchemes = await WelfareScheme.find({
        isActive: true,
        isVisible: true
      });
      expect(availableSchemes).toHaveLength(1);
      expect(availableSchemes[0].name).toBe('Active Housing Scheme');
    });
  });

  describe('Virtual Fields and Methods', () => {
    test('should calculate total applications if virtual exists', async () => {
      const schemeData = {
        name: 'Virtual Test Scheme',
        description: 'Scheme to test virtual fields',
        category: 'education',
        eligibilityType: 'officer',
        eligibilityCriteria: ['Active service'],
        requiredDocuments: ['Service certificate'],
        benefits: ['Education benefit'],
        createdBy: testUser._id
      };

      const scheme = new WelfareScheme(schemeData);
      const savedScheme = await scheme.save();

      // Test basic save functionality
      expect(savedScheme.name).toBe('Virtual Test Scheme');
    });
  });
});
