/**
 * Global error handler middleware
 * Handles various types of errors and returns appropriate HTTP responses
 */
const errorHandler = (err, req, res, next) => {
  // Log the error with stack trace in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  console.error('Error:', {
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    name: err.name,
    code: err.code,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : 'value';
    return res.status(409).json({
      success: false,
      message: `A resource with this ${field} already exists`,
      error: 'DUPLICATE_KEY',
      details: {
        field,
        value,
        code: err.code
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // MongoDB/Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.entries(err.errors).reduce((acc, [key, error]) => ({
      ...acc,
      [key]: {
        message: error.message,
        kind: error.kind,
        path: error.path,
        value: error.value
      }
    }), {});
    
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: 'VALIDATION_ERROR',
      details: errors,
      timestamp: new Date().toISOString()
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
      error: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Authentication token has expired',
      error: 'TOKEN_EXPIRED',
      timestamp: new Date().toISOString()
    });
  }
  
  // MongoDB/Mongoose CastError (invalid ObjectId format, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      error: 'INVALID_INPUT',
      details: {
        path: err.path,
        value: err.value,
        kind: err.kind
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // Firebase Auth errors
  if (err.code && err.code.startsWith('auth/')) {
    return res.status(401).json({
      success: false,
      message: `Authentication error: ${err.message}`,
      error: err.code,
      timestamp: new Date().toISOString()
    });
  }
  
  // MongoDB connection errors
  if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
    return res.status(503).json({
      success: false,
      message: 'Database connection error',
      error: 'DATABASE_CONNECTION_ERROR',
      details: {
        message: err.message,
        name: err.name
      },
      timestamp: new Date().toISOString()
    });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'INVALID_ID'
    });
  }
  
  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large',
      error: 'FILE_TOO_LARGE'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field',
      error: 'UNEXPECTED_FILE'
    });
  }
  
  // Rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later',
      error: 'RATE_LIMIT_EXCEEDED'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'INTERNAL_SERVER_ERROR'
  });
};

module.exports = errorHandler;
