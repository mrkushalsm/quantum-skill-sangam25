const mongoose = require('mongoose');
const { Types: { ObjectId } } = mongoose;

/**
 * Executes a function within a MongoDB transaction
 * @param {Function} fn - The function to execute within the transaction
 * @param {Object} [sessionOptions={}] - Optional session options
 * @returns {Promise<*>} The result of the function
 * @throws {Error} If the transaction fails
 * 
 * @example
 * const result = await withTransaction(async (session) => {
 *   const user = await User.create([{ name: 'John' }], { session });
 *   await Profile.create([{ userId: user[0]._id }], { session });
 *   return user;
 * });
 */
const withTransaction = async (fn, sessionOptions = {}) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Converts a string ID to MongoDB ObjectId
 * @param {string|ObjectId} id - The ID to convert
 * @returns {ObjectId} The MongoDB ObjectId
 * @throws {Error} If the ID is invalid
 */
const toObjectId = (id) => {
  if (!id) return null;
  return typeof id === 'string' ? new ObjectId(id) : id;
};

/**
 * Checks if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid, false otherwise
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
};

module.exports = {
  withTransaction,
  toObjectId,
  isValidObjectId
};
