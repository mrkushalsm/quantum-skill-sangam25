const { body, param, query, validationResult } = require('express-validator');
const { toObjectId } = require('../utils/transaction');

/**
 * Generic validation result handler
 * Formats validation errors consistently
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      param: error.param,
      location: error.location,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: formattedErrors,
      timestamp: new Date().toISOString()
    });
  }
  next();
};

/**
 * Common validation rules that can be reused across different routes
 */
const commonValidators = {
  // Validate MongoDB ObjectId in URL parameters
  mongoId: (field = 'id', location = 'params') => {
    const locationMap = {
      params: param,
      query: query,
      body: body
    };
    
    const validator = locationMap[location] || param;
    
    return [
      validator(field)
        .trim()
        .notEmpty()
        .withMessage(`${field} is required`)
        .custom(value => {
          if (!/^[0-9a-fA-F]{24}$/.test(value)) {
            throw new Error(`Invalid ${field} format`);
          }
          return true;
        })
        .customSanitizer(toObjectId)
    ];
  },
  
  // Pagination query parameters
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    query('sort')
      .optional()
      .isString()
      .trim()
      .matches(/^[a-zA-Z0-9_]+:(asc|desc)$/)
      .withMessage('Sort must be in format: field:(asc|desc)')
  ],
  
  // Search query parameter
  search: query('q')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
    
  // Status filter
  status: query('status')
    .optional()
    .isString()
    .trim()
    .isIn(['active', 'inactive', 'pending', 'approved', 'rejected'])
    .withMessage('Invalid status value')
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('serviceNumber')
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage('Service number must be between 5 and 20 characters'),
  body('rank')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Rank is required'),
  body('service')
    .isIn(['army', 'navy', 'airforce'])
    .withMessage('Service must be army, navy, or airforce'),
  body('unit')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Unit is required'),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

// Welfare scheme validation
const validateWelfareScheme = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category is required'),
  body('eligibleRoles')
    .isArray({ min: 1 })
    .withMessage('At least one eligible role must be specified'),
  body('eligibleServices')
    .custom((value) => {
      if (value === 'all') return true;
      if (Array.isArray(value) && value.length > 0) return true;
      throw new Error('Eligible services must be specified');
    }),
  body('applicationDeadline')
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Application deadline must be in the future');
      }
      return true;
    }),
  body('maxBeneficiaries')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max beneficiaries must be a positive integer'),
  body('requiredDocuments')
    .optional()
    .isArray()
    .withMessage('Required documents must be an array'),
  handleValidationErrors
];

// Application validation
const validateApplication = [
  body('applicationData')
    .optional()
    .isJSON()
    .withMessage('Application data must be valid JSON'),
  handleValidationErrors
];

// Marketplace item validation
const validateMarketplaceItem = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category is required'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('condition')
    .isIn(['new', 'like_new', 'good', 'fair', 'poor'])
    .withMessage('Condition must be one of: new, like_new, good, fair, poor'),
  body('location.city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters'),
  body('location.state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters'),
  body('contactPhone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

// Emergency alert validation
const validateEmergencyAlert = [
  body('type')
    .isIn(['medical', 'security', 'natural_disaster', 'fire', 'accident', 'other'])
    .withMessage('Type must be one of: medical, security, natural_disaster, fire, accident, other'),
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Severity must be one of: low, medium, high, critical'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('location.address')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('contactNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid contact number'),
  handleValidationErrors
];

// Grievance validation
const validateGrievance = [
  body('category')
    .isIn(['administrative', 'financial', 'medical', 'housing', 'career', 'discrimination', 'other'])
    .withMessage('Category must be one of: administrative, financial, medical, housing, career, discrimination, other'),
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be one of: low, medium, high'),
  body('anonymous')
    .optional()
    .isBoolean()
    .withMessage('Anonymous must be a boolean value'),
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('address')
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be between 10 and 200 characters'),
  body('emergencyContacts')
    .optional()
    .isArray()
    .withMessage('Emergency contacts must be an array'),
  body('emergencyContacts.*.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Emergency contact name must be between 2 and 50 characters'),
  body('emergencyContacts.*.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Emergency contact phone must be valid'),
  body('emergencyContacts.*.relationship')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Emergency contact relationship must be between 2 and 30 characters'),
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .isLength({ min: 6 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  handleValidationErrors
];

// Generic validation function
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  };
};

module.exports = {
  validate,
  validateUserRegistration,
  validateUserLogin,
  validateWelfareScheme,
  validateApplication,
  validateMarketplaceItem,
  validateEmergencyAlert,
  validateGrievance,
  validateProfileUpdate,
  validatePasswordChange,
  handleValidationErrors
};
