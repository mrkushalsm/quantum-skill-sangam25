const request = require('supertest');
const express = require('express');
const errorHandler = require('../../../middleware/errorHandler');

describe('Error Handler Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('MongoDB Errors', () => {
    test('should handle duplicate key error (11000)', async () => {
      app.get('/duplicate-error', (req, res, next) => {
        const error = new Error('Duplicate key error');
        error.code = 11000;
        error.keyValue = { email: 'test@army.mil' };
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/duplicate-error');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('email already exists');
      expect(response.body.error).toBe('DUPLICATE_KEY');
    });

    test('should handle validation error', async () => {
      app.get('/validation-error', (req, res, next) => {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        error.errors = {
          email: { message: 'Email is required' },
          name: { message: 'Name must be at least 2 characters' }
        };
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/validation-error');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation Error');
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.errors).toContain('Email is required');
      expect(response.body.errors).toContain('Name must be at least 2 characters');
    });

    test('should handle CastError', async () => {
      app.get('/cast-error', (req, res, next) => {
        const error = new Error('Cast to ObjectId failed');
        error.name = 'CastError';
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/cast-error');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid ID format');
      expect(response.body.error).toBe('INVALID_ID');
    });
  });

  describe('JWT Errors', () => {
    test('should handle JsonWebTokenError', async () => {
      app.get('/jwt-error', (req, res, next) => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/jwt-error');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token');
      expect(response.body.error).toBe('INVALID_TOKEN');
    });

    test('should handle TokenExpiredError', async () => {
      app.get('/token-expired', (req, res, next) => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/token-expired');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Token expired');
      expect(response.body.error).toBe('TOKEN_EXPIRED');
    });
  });

  describe('Firebase Auth Errors', () => {
    test('should handle Firebase auth errors', async () => {
      app.get('/firebase-error', (req, res, next) => {
        const error = new Error('Firebase authentication failed');
        error.code = 'auth/invalid-id-token';
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/firebase-error');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication error');
      expect(response.body.error).toBe('auth/invalid-id-token');
    });

    test('should handle other Firebase auth error codes', async () => {
      app.get('/firebase-user-not-found', (req, res, next) => {
        const error = new Error('User not found');
        error.code = 'auth/user-not-found';
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/firebase-user-not-found');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Authentication error');
      expect(response.body.error).toBe('auth/user-not-found');
    });
  });

  describe('File Upload Errors', () => {
    test('should handle file size limit error', async () => {
      app.get('/file-size-error', (req, res, next) => {
        const error = new Error('File too large');
        error.code = 'LIMIT_FILE_SIZE';
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/file-size-error');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('File too large');
      expect(response.body.error).toBe('FILE_TOO_LARGE');
    });

    test('should handle unexpected file field error', async () => {
      app.get('/unexpected-file-error', (req, res, next) => {
        const error = new Error('Unexpected file field');
        error.code = 'LIMIT_UNEXPECTED_FILE';
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/unexpected-file-error');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Unexpected file field');
      expect(response.body.error).toBe('UNEXPECTED_FILE');
    });
  });

  describe('Rate Limit Errors', () => {
    test('should handle rate limit error', async () => {
      app.get('/rate-limit-error', (req, res, next) => {
        const error = new Error('Too many requests');
        error.status = 429;
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/rate-limit-error');

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Too many requests, please try again later');
      expect(response.body.error).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Generic Errors', () => {
    test('should handle generic error with custom status', async () => {
      app.get('/custom-error', (req, res, next) => {
        const error = new Error('Custom error message');
        error.status = 422;
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/custom-error');

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Custom error message');
    });

    test('should handle generic error with default 500 status', async () => {
      app.get('/generic-error', (req, res, next) => {
        const error = new Error('Something went wrong');
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/generic-error');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Something went wrong');
    });

    test('should handle error without message', async () => {
      app.get('/no-message-error', (req, res, next) => {
        const error = new Error();
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/no-message-error');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });

  describe('Development vs Production', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    test('should include stack trace in development mode', async () => {
      process.env.NODE_ENV = 'development';

      app.get('/dev-error', (req, res, next) => {
        const error = new Error('Development error');
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/dev-error');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Development error');
      expect(typeof response.body.error).toBe('string');
      expect(response.body.error).toContain('Error: Development error');
    });

    test('should not include stack trace in production mode', async () => {
      process.env.NODE_ENV = 'production';

      app.get('/prod-error', (req, res, next) => {
        const error = new Error('Production error');
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/prod-error');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Production error');
      expect(response.body.error).toBe('INTERNAL_SERVER_ERROR');
    });

    test('should not include stack trace when NODE_ENV is not set', async () => {
      delete process.env.NODE_ENV;

      app.get('/no-env-error', (req, res, next) => {
        const error = new Error('No environment error');
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/no-env-error');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No environment error');
      expect(response.body.error).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('Error Logging', () => {
    test('should log error to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      app.get('/log-error', (req, res, next) => {
        const error = new Error('Error to be logged');
        error.stack = 'Error: Error to be logged\n    at test location';
        next(error);
      });

      app.use(errorHandler);

      await request(app).get('/log-error');

      expect(consoleSpy).toHaveBeenCalledWith('Error:', 'Error: Error to be logged\n    at test location');

      consoleSpy.mockRestore();
    });
  });

  describe('Error Response Format', () => {
    test('should always include success: false in response', async () => {
      app.get('/format-test', (req, res, next) => {
        const error = new Error('Format test error');
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/format-test');

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });

    test('should handle multiple duplicate keys', async () => {
      app.get('/multiple-duplicates', (req, res, next) => {
        const error = new Error('Duplicate key error');
        error.code = 11000;
        error.keyValue = { email: 'test@army.mil', serviceNumber: 'SVC001' };
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/multiple-duplicates');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      // Should pick the first key
      expect(response.body.message).toBe('email already exists');
      expect(response.body.error).toBe('DUPLICATE_KEY');
    });
  });

  describe('Edge Cases', () => {
    test('should handle error with null message', async () => {
      app.get('/null-message', (req, res, next) => {
        const error = new Error();
        error.message = null;
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/null-message');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal Server Error');
    });

    test('should handle error with undefined properties', async () => {
      app.get('/undefined-props', (req, res, next) => {
        const error = {};
        next(error);
      });

      app.use(errorHandler);

      const response = await request(app).get('/undefined-props');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });
});
