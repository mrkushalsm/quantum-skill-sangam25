const mongoose = require('mongoose');

module.exports = async () => {
  // Close mongoose connection
  await mongoose.disconnect();
  
  // Stop the in-memory MongoDB instance
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }
  
  console.log('Global test teardown complete');
};
