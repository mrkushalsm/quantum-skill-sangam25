const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

module.exports = async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Start in-memory MongoDB instance
  const mongod = new MongoMemoryServer();
  await mongod.start();
  const uri = mongod.getUri();
  
  // Store the URI for use in tests
  global.__MONGOD__ = mongod;
  process.env.MONGODB_URI = uri;
  
  console.log('Global test setup complete');
};
