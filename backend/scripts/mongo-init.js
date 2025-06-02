// MongoDB initialization script for Docker
db = db.getSiblingDB('armed_forces_welfare');

// Create collections
db.createCollection('users');
db.createCollection('welfareschemes');
db.createCollection('applications');
db.createCollection('emergencyalerts');
db.createCollection('marketplaceitems');
db.createCollection('grievances');
db.createCollection('messages');
db.createCollection('notifications');

// Create initial admin user
db.users.insertOne({
  email: 'admin@afwms.gov.in',
  firebaseUid: 'admin-uid-placeholder',
  role: 'admin',
  profile: {
    firstName: 'System',
    lastName: 'Administrator',
    phoneNumber: '+91-9999999999',
    serviceNumber: 'ADM001',
    rank: 'Administrator',
    unit: 'Headquarters',
    address: 'Armed Forces Headquarters, New Delhi'
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Database initialized successfully!');
