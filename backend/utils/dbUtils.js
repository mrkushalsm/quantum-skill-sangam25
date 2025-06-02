const { toObjectId } = require('./transaction');
const ApiError = require('../utils/ApiError');

/**
 * Paginate MongoDB query results
 * @param {Model} model - Mongoose model
 * @param {Object} query - MongoDB query object
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=10] - Number of items per page
 * @param {Object|string} [options.sort] - Sort criteria
 * @param {string} [options.populate] - Fields to populate
 * @param {Object} [select] - Fields to select/return
 * @returns {Promise<Object>} Paginated results
 */
const paginate = async (model, query = {}, options = {}, select = null) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const skip = (page - 1) * limit;
  
  // Handle sort
  let sort = {};
  if (options.sort) {
    if (typeof options.sort === 'string') {
      // Handle string sort format: 'field:asc' or 'field:desc'
      const [field, order] = options.sort.split(':');
      sort[field] = order === 'desc' ? -1 : 1;
    } else {
      sort = options.sort;
    }
  } else {
    // Default sort by createdAt descending
    sort = { createdAt: -1 };
  }

  // Build query
  let queryBuilder = model.find(query);
  
  // Apply population if specified
  if (options.populate) {
    queryBuilder = queryBuilder.populate(options.populate);
  }
  
  // Apply field selection
  if (select) {
    queryBuilder = queryBuilder.select(select);
  }
  
  // Execute queries in parallel
  const [data, total] = await Promise.all([
    queryBuilder
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    model.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      limit
    }
  };
};

/**
 * Find a document by ID or throw a 404 error
 * @param {Model} model - Mongoose model
 * @param {string|ObjectId} id - Document ID
 * @param {Object} [options] - Options
 * @param {string|Object} [options.populate] - Fields to populate
 * @param {string|Object} [options.select] - Fields to select/return
 * @param {string} [errorMessage] - Custom error message
 * @returns {Promise<Document>} Found document
 * @throws {ApiError} If document not found
 */
const findByIdOrFail = async (model, id, options = {}, errorMessage) => {
  if (!id) {
    throw new ApiError(400, 'ID is required');
  }

  let query = model.findById(toObjectId(id));
  
  if (options.populate) {
    query = query.populate(options.populate);
  }
  
  if (options.select) {
    query = query.select(options.select);
  }
  
  const doc = await query.lean();
  
  if (!doc) {
    const modelName = model.modelName || 'Resource';
    throw new ApiError(
      404, 
      errorMessage || `${modelName} not found`,
      { resource: modelName, id }
    );
  }
  
  return doc;
};

/**
 * Check if a document with the given query exists
 * @param {Model} model - Mongoose model
 * @param {Object} query - Query conditions
 * @param {string} errorMessage - Error message if document exists
 * @param {string|ObjectId} [excludeId] - ID to exclude from the check
 * @throws {ApiError} If document exists
 */
const checkDuplicate = async (model, query, errorMessage, excludeId = null) => {
  if (excludeId) {
    query._id = { $ne: toObjectId(excludeId) };
  }
  
  const exists = await model.exists(query);
  if (exists) {
    throw new ApiError(409, errorMessage);
  }
};

/**
 * Soft delete a document by ID
 * @param {Model} model - Mongoose model
 * @param {string|ObjectId} id - Document ID
 * @returns {Promise<Document>} Updated document
 */
const softDelete = async (model, id) => {
  return model.findByIdAndUpdate(
    toObjectId(id),
    { 
      isDeleted: true,
      deletedAt: new Date()
    },
    { new: true }
  );
};

/**
 * Toggle a boolean field on a document
 * @param {Model} model - Mongoose model
 * @param {string|ObjectId} id - Document ID
 * @param {string} field - Field to toggle
 * @returns {Promise<Document>} Updated document
 */
const toggleField = async (model, id, field) => {
  const doc = await model.findById(toObjectId(id));
  if (!doc) {
    throw new ApiError(404, `${model.modelName} not found`);
  }
  
  doc[field] = !doc[field];
  await doc.save();
  return doc;
};

module.exports = {
  paginate,
  findByIdOrFail,
  checkDuplicate,
  softDelete,
  toggleField
};
