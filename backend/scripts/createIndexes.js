const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure schemas are registered
require('../models/User');
require('../models/WelfareScheme');
require('../models/Application');
require('../models/EmergencyAlert');
require('../models/MarketplaceItem');
require('../models/Grievance');
require('../models/Message');
require('../models/Notification');

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/armed_forces_welfare');
    
    console.log('🔗 Connected to MongoDB');
    console.log('📊 Creating database indexes...');

    // User indexes
    const User = mongoose.model('User');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ firebaseUid: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ 'profile.serviceNumber': 1 });
    await User.collection.createIndex({ 'profile.unit': 1 });
    await User.collection.createIndex({ 'profile.rank': 1 });
    await User.collection.createIndex({ createdAt: -1 });
    console.log('✅ User indexes created');

    // WelfareScheme indexes
    const WelfareScheme = mongoose.model('WelfareScheme');
    await WelfareScheme.collection.createIndex({ status: 1 });
    await WelfareScheme.collection.createIndex({ category: 1 });
    await WelfareScheme.collection.createIndex({ applicationDeadline: 1 });
    await WelfareScheme.collection.createIndex({ createdAt: -1 });
    await WelfareScheme.collection.createIndex({ 
      name: 'text', 
      description: 'text' 
    }, { 
      name: 'welfare_scheme_text_index' 
    });
    console.log('✅ WelfareScheme indexes created');

    // Application indexes
    const Application = mongoose.model('Application');
    await Application.collection.createIndex({ user: 1 });
    await Application.collection.createIndex({ scheme: 1 });
    await Application.collection.createIndex({ status: 1 });
    await Application.collection.createIndex({ user: 1, scheme: 1 }, { unique: true });
    await Application.collection.createIndex({ submittedAt: -1 });
    await Application.collection.createIndex({ updatedAt: -1 });
    console.log('✅ Application indexes created');

    // EmergencyAlert indexes
    const EmergencyAlert = mongoose.model('EmergencyAlert');
    await EmergencyAlert.collection.createIndex({ severity: 1 });
    await EmergencyAlert.collection.createIndex({ status: 1 });
    await EmergencyAlert.collection.createIndex({ location: '2dsphere' });
    await EmergencyAlert.collection.createIndex({ createdBy: 1 });
    await EmergencyAlert.collection.createIndex({ createdAt: -1 });
    await EmergencyAlert.collection.createIndex({ 
      severity: 1, 
      status: 1, 
      createdAt: -1 
    });
    console.log('✅ EmergencyAlert indexes created');

    // MarketplaceItem indexes
    const MarketplaceItem = mongoose.model('MarketplaceItem');
    await MarketplaceItem.collection.createIndex({ seller: 1 });
    await MarketplaceItem.collection.createIndex({ category: 1 });
    await MarketplaceItem.collection.createIndex({ status: 1 });
    await MarketplaceItem.collection.createIndex({ price: 1 });
    await MarketplaceItem.collection.createIndex({ createdAt: -1 });
    await MarketplaceItem.collection.createIndex({ 
      status: 1, 
      category: 1, 
      createdAt: -1 
    });
    await MarketplaceItem.collection.createIndex({ 
      title: 'text', 
      description: 'text' 
    }, { 
      name: 'marketplace_text_index' 
    });
    console.log('✅ MarketplaceItem indexes created');

    // Grievance indexes
    const Grievance = mongoose.model('Grievance');
    await Grievance.collection.createIndex({ user: 1 });
    await Grievance.collection.createIndex({ ticketNumber: 1 }, { unique: true });
    await Grievance.collection.createIndex({ status: 1 });
    await Grievance.collection.createIndex({ category: 1 });
    await Grievance.collection.createIndex({ priority: 1 });
    await Grievance.collection.createIndex({ assignedTo: 1 });
    await Grievance.collection.createIndex({ createdAt: -1 });
    await Grievance.collection.createIndex({ 
      status: 1, 
      priority: 1, 
      createdAt: -1 
    });
    console.log('✅ Grievance indexes created');

    // Message indexes
    const Message = mongoose.model('Message');
    await Message.collection.createIndex({ sender: 1 });
    await Message.collection.createIndex({ recipient: 1 });
    await Message.collection.createIndex({ conversationId: 1 });
    await Message.collection.createIndex({ createdAt: -1 });
    await Message.collection.createIndex({ 
      conversationId: 1, 
      createdAt: -1 
    });
    console.log('✅ Message indexes created');

    // Notification indexes
    const Notification = mongoose.model('Notification');
    await Notification.collection.createIndex({ userId: 1 });
    await Notification.collection.createIndex({ read: 1 });
    await Notification.collection.createIndex({ type: 1 });
    await Notification.collection.createIndex({ priority: 1 });
    await Notification.collection.createIndex({ createdAt: -1 });
    await Notification.collection.createIndex({ 
      userId: 1, 
      read: 1, 
      createdAt: -1 
    });
    await Notification.collection.createIndex({ 
      relatedModel: 1, 
      relatedId: 1 
    });
    console.log('✅ Notification indexes created');

    // Compound indexes for common queries
    await User.collection.createIndex({ 
      role: 1, 
      'profile.serviceStatus': 1 
    });
    
    await Application.collection.createIndex({ 
      scheme: 1, 
      status: 1, 
      submittedAt: -1 
    });
    
    await Grievance.collection.createIndex({ 
      assignedTo: 1, 
      status: 1, 
      createdAt: -1 
    });

    console.log('✅ Compound indexes created');
    console.log('🎉 All database indexes created successfully!');
    
    // Show index information
    const collections = [
      'users', 'welfareschemes', 'applications', 
      'emergencyalerts', 'marketplaceitems', 'grievances', 
      'messages', 'notifications'
    ];
    
    for (const collectionName of collections) {
      const indexes = await mongoose.connection.db.collection(collectionName).indexes();
      console.log(`📋 ${collectionName} indexes:`, indexes.length);
    }

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  createIndexes();
}

module.exports = createIndexes;
