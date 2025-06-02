const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;
let mongoUri;

/**
 * Connect to the in-memory database
 * @returns {Promise<void>}
 */
const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

/**
 * Close the database connection
 * @returns {Promise<void>}
 */
const close = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

/**
 * Clear all test data from the database
 * @returns {Promise<void>}
 */
const clear = async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * Setup test database connection before tests
 * @param {Object} [options] - Test setup options
 * @param {boolean} [options.clearAfterEach=false] - Whether to clear database after each test
 * @returns {Object} Test hooks
 */
const setupTestDB = (options = {}) => {
  const { clearAfterEach = false } = options;
  
  // Connect to a new in-memory database before running any tests
  beforeAll(async () => {
    await connect();
  });
  
  // Clear all test data after each test
  if (clearAfterEach) {
    afterEach(async () => {
      await clear();
    });
  }
  
  // Disconnect from the in-memory database after all tests are done
  afterAll(async () => {
    await close();
  });
  
  return { connect, close, clear };
};

module.exports = {
  connect,
  close,
  clear,
  setupTestDB,
  getMongoUri: () => mongoUri,
};
