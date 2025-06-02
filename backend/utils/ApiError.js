/**
 * Custom API error class that extends the built-in Error class
 */
class ApiError extends Error {
  /**
   * Create a new ApiError
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @param {Object} [details] - Additional error details
   */
  constructor(statusCode, message, details = {}) {
    super(message);
    
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    
    // Custom properties
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true; // This is used to distinguish operational errors from programming errors
    
    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Create a 400 Bad Request error
   * @param {string} message - Error message
   * @param {Object} details - Additional error details
   * @returns {ApiError}
   */
  static badRequest(message = 'Bad Request', details = {}) {
    return new ApiError(400, message, details);
  }
  
  /**
   * Create a 401 Unauthorized error
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }
  
  /**
   * Create a 403 Forbidden error
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }
  
  /**
   * Create a 404 Not Found error
   * @param {string} resource - Name of the resource that wasn't found
   * @param {string|ObjectId} id - ID of the resource that wasn't found
   * @returns {ApiError}
   */
  static notFound(resource = 'Resource', id = null) {
    const details = id ? { resource, id: id.toString() } : { resource };
    return new ApiError(404, `${resource} not found`, details);
  }
  
  /**
   * Create a 409 Conflict error
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static conflict(message = 'Conflict') {
    return new ApiError(409, message);
  }
  
  /**
   * Create a 422 Unprocessable Entity error
   * @param {string} message - Error message
   * @param {Object} errors - Validation errors
   * @returns {ApiError}
   */
  static validationError(message = 'Validation Error', errors = {}) {
    return new ApiError(422, message, { errors });
  }
  
  /**
   * Create a 500 Internal Server Error
   * @param {string} message - Error message
   * @returns {ApiError}
   */
  static internal(message = 'Internal Server Error') {
    return new ApiError(500, message);
  }
  
  /**
   * Convert the error to a plain object for JSON responses
   * @returns {Object}
   */
  toJSON() {
    return {
      success: false,
      message: this.message,
      error: this.name,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      ...(Object.keys(this.details).length > 0 && { details: this.details })
    };
  }
}

module.exports = ApiError;
