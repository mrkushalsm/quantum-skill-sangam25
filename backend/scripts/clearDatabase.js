const mongoose = require('mongoose');
require('dotenv').config();

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop the entire database
    console.log('🧨 Dropping database...');
    await mongoose.connection.dropDatabase();
    console.log('✅ Database dropped successfully');

    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the clear function if this script is executed directly
if (require.main === module) {
  clearDatabase();
}

module.exports = { clearDatabase };
