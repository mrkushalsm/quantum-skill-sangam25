const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import models
require('../models/User');
require('../models/WelfareScheme');
require('../models/Application');
require('../models/EmergencyAlert');
require('../models/MarketplaceItem');
require('../models/Grievance');
require('../models/Message');
require('../models/Notification');

const createBackup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/armed_forces_welfare');
    console.log('🔗 Connected to MongoDB for backup');

    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    fs.mkdirSync(backupPath);

    const collections = [
      'users', 'welfareschemes', 'applications', 
      'emergencyalerts', 'marketplaceitems', 'grievances', 
      'messages', 'notifications'
    ];

    const backupData = {};

    for (const collectionName of collections) {
      console.log(`📦 Backing up ${collectionName}...`);
      const Model = mongoose.model(collectionName === 'welfareschemes' ? 'WelfareScheme' : 
                                 collectionName === 'emergencyalerts' ? 'EmergencyAlert' :
                                 collectionName === 'marketplaceitems' ? 'MarketplaceItem' :
                                 collectionName.charAt(0).toUpperCase() + collectionName.slice(1, -1));
      
      const data = await Model.find({}).lean();
      backupData[collectionName] = data;
      
      // Save individual collection backup
      fs.writeFileSync(
        path.join(backupPath, `${collectionName}.json`),
        JSON.stringify(data, null, 2)
      );
      
      console.log(`✅ ${collectionName}: ${data.length} documents backed up`);
    }

    // Create combined backup file
    fs.writeFileSync(
      path.join(backupPath, 'complete-backup.json'),
      JSON.stringify(backupData, null, 2)
    );

    // Create metadata file
    const metadata = {
      timestamp: new Date().toISOString(),
      databaseName: mongoose.connection.name,
      totalCollections: collections.length,
      totalDocuments: Object.values(backupData).reduce((sum, coll) => sum + coll.length, 0),
      collections: collections.map(name => ({
        name,
        count: backupData[name].length
      }))
    };

    fs.writeFileSync(
      path.join(backupPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    console.log(`🎉 Backup completed successfully!`);
    console.log(`📁 Backup location: ${backupPath}`);
    console.log(`📊 Total documents backed up: ${metadata.totalDocuments}`);

  } catch (error) {
    console.error('❌ Backup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

const restoreBackup = async (backupPath) => {
  try {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup path does not exist: ${backupPath}`);
    }

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/armed_forces_welfare');
    console.log('🔗 Connected to MongoDB for restore');

    const metadataPath = path.join(backupPath, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Metadata file not found in backup');
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log(`📋 Restoring backup from: ${metadata.timestamp}`);
    
    // Confirm before proceeding
    console.log('⚠️  WARNING: This will replace existing data!');
    
    for (const collection of metadata.collections) {
      const collectionPath = path.join(backupPath, `${collection.name}.json`);
      if (!fs.existsSync(collectionPath)) {
        console.log(`⚠️  Skipping ${collection.name}: backup file not found`);
        continue;
      }

      console.log(`📥 Restoring ${collection.name}...`);
      const data = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
      
      // Clear existing data
      await mongoose.connection.db.collection(collection.name).deleteMany({});
      
      // Insert backup data
      if (data.length > 0) {
        await mongoose.connection.db.collection(collection.name).insertMany(data);
      }
      
      console.log(`✅ ${collection.name}: ${data.length} documents restored`);
    }

    console.log('🎉 Restore completed successfully!');

  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

const listBackups = () => {
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    console.log('📁 No backup directory found');
    return;
  }

  const backups = fs.readdirSync(backupDir).filter(dir => 
    fs.statSync(path.join(backupDir, dir)).isDirectory()
  );

  if (backups.length === 0) {
    console.log('📁 No backups found');
    return;
  }

  console.log('📋 Available backups:');
  backups.forEach(backup => {
    const metadataPath = path.join(backupDir, backup, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      console.log(`  • ${backup} (${metadata.timestamp}) - ${metadata.totalDocuments} documents`);
    } else {
      console.log(`  • ${backup} (metadata missing)`);
    }
  });
};

// CLI interface
const command = process.argv[2];
const backupPath = process.argv[3];

switch (command) {
  case 'create':
    createBackup();
    break;
  case 'restore':
    if (!backupPath) {
      console.log('❌ Please provide backup path: npm run backup restore <backup-path>');
      process.exit(1);
    }
    restoreBackup(backupPath);
    break;
  case 'list':
    listBackups();
    break;
  default:
    console.log('Usage:');
    console.log('  npm run backup create         - Create a new backup');
    console.log('  npm run backup restore <path> - Restore from backup');
    console.log('  npm run backup list           - List available backups');
    break;
}

module.exports = { createBackup, restoreBackup, listBackups };
