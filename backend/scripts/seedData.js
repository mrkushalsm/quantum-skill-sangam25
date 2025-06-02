const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const WelfareScheme = require('../models/WelfareScheme');
const Application = require('../models/Application');
const Grievance = require('../models/Grievance');
const MarketplaceItem = require('../models/MarketplaceItem');
const EmergencyAlert = require('../models/EmergencyAlert');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// Sample data
const seedUsers = [
  {
    firebaseUid: 'test-admin-001',
    email: 'admin@armedforces.gov.in',
    name: 'System Administrator',
    role: 'admin',
    verified: true,
    personalInfo: {
      dateOfBirth: new Date('1980-01-15'),
      phone: '+91-9876543210',
      address: {
        street: 'South Block',
        city: 'New Delhi',
        state: 'Delhi',
        zipCode: '110001',
        country: 'India'
      }
    },
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: true
      },
      language: 'en'
    }
  },
  {
    firebaseUid: 'test-officer-001',
    email: 'colonel.sharma@army.gov.in',
    name: 'Colonel Rajesh Sharma',
    role: 'officer',
    verified: true,
    personalInfo: {
      dateOfBirth: new Date('1975-06-20'),
      phone: '+91-9876543211',
      address: {
        street: 'Officers Mess, Cantonment',
        city: 'Pune',
        state: 'Maharashtra',
        zipCode: '411001',
        country: 'India'
      }
    },
    officerDetails: {
      serviceNumber: 'IC-12345',
      rank: 'Colonel',
      unit: '1st Battalion, Maratha Light Infantry',
      postingLocation: 'Pune Cantonment',
      joiningDate: new Date('1995-06-01'),
      specializations: ['Infantry Operations', 'Counter-Terrorism']
    },
    emergencyContacts: [
      {
        name: 'Mrs. Sunita Sharma',
        relationship: 'spouse',
        phone: '+91-9876543212',
        email: 'sunita.sharma@gmail.com',
        priority: 1
      }
    ],
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      language: 'en'
    }
  },
  {
    firebaseUid: 'test-family-001',
    email: 'sunita.sharma@gmail.com',
    name: 'Mrs. Sunita Sharma',
    role: 'family_member',
    verified: true,
    personalInfo: {
      dateOfBirth: new Date('1978-03-10'),
      phone: '+91-9876543212',
      address: {
        street: 'Type III Quarters, Cantonment',
        city: 'Pune',
        state: 'Maharashtra',
        zipCode: '411001',
        country: 'India'
      }
    },
    familyDetails: {
      relationship: 'spouse',
      officerServiceNumber: 'IC-12345',
      dependentId: 'DEP-001'
    },
    emergencyContacts: [
      {
        name: 'Colonel Rajesh Sharma',
        relationship: 'spouse',
        phone: '+91-9876543211',
        email: 'colonel.sharma@army.gov.in',
        priority: 1
      }
    ],
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: true
      },
      language: 'hi'
    }
  }
];

const seedWelfareSchemes = [
  {
    title: 'Armed Forces Medical Assistance Scheme',
    description: 'Comprehensive medical assistance for serving and retired personnel including their families.',
    category: 'healthcare',
    eligibilityRules: [
      'Must be serving or retired armed forces personnel',
      'Valid service records required',
      'Annual family income below Rs. 5 lakhs'
    ],
    benefits: [
      'Free medical consultation',
      'Medicine reimbursement up to Rs. 50,000 annually',
      'Emergency medical assistance',
      'Specialist consultation coverage'
    ],
    requiredDocuments: ['Service Certificate', 'Medical Records', 'Income Certificate', 'Aadhaar Card'],
    applicationDeadline: new Date('2024-12-31'),
    maxApplications: 1000,
    status: 'active',
    createdBy: null, // Will be set to admin user ID
    guidelines: 'Submit all required documents in original. Processing time: 15-30 days.',
    contactInfo: {
      phone: '+91-11-23792204',
      email: 'medical@dgafms.gov.in',
      office: 'Directorate General Armed Forces Medical Services'
    }
  },
  {
    title: 'Education Scholarship for Children',
    description: 'Educational financial assistance for children of armed forces personnel.',
    category: 'education',
    eligibilityRules: [
      'Child of serving/retired armed forces personnel',
      'Age between 5-25 years',
      'Minimum 60% marks in previous examination'
    ],
    benefits: [
      'Tuition fee assistance up to Rs. 1,00,000 per year',
      'Book and uniform allowance',
      'Hostel accommodation support',
      'Merit-based additional scholarships'
    ],
    requiredDocuments: ['Service Certificate', 'Academic Records', 'Age Proof', 'Bank Details'],
    applicationDeadline: new Date('2024-06-30'),
    maxApplications: 500,
    status: 'active',
    createdBy: null,
    guidelines: 'Scholarship renewable annually based on academic performance.',
    contactInfo: {
      phone: '+91-11-23792205',
      email: 'education@kendriyasainikboard.gov.in',
      office: 'Kendriya Sainik Board'
    }
  },
  {
    title: 'Emergency Financial Assistance',
    description: 'Immediate financial support for armed forces families in distress.',
    category: 'financial',
    eligibilityRules: [
      'Armed forces personnel or family member',
      'Genuine financial emergency',
      'No previous assistance in last 3 years'
    ],
    benefits: [
      'Interest-free loan up to Rs. 2,00,000',
      'Flexible repayment terms',
      'Processing within 72 hours',
      'No collateral required'
    ],
    requiredDocuments: ['Service Certificate', 'Emergency Proof', 'Income Statement', 'Bank Details'],
    applicationDeadline: new Date('2024-12-31'),
    maxApplications: 200,
    status: 'active',
    createdBy: null,
    guidelines: 'Only for genuine emergencies. Misuse will result in disciplinary action.',
    contactInfo: {
      phone: '+91-11-23792206',
      email: 'emergency@afwwa.org',
      office: 'Armed Forces Wives Welfare Association'
    }
  }
];

const seedMarketplaceItems = [
  {
    title: 'Military Uniform - Colonel Rank',
    description: 'Complete dress uniform for Colonel rank. Excellent condition, worn only for ceremonies.',
    category: 'uniforms',
    condition: 'excellent',
    price: 15000,
    images: [],
    seller: null, // Will be set to officer user ID
    location: {
      city: 'Pune',
      state: 'Maharashtra'
    },
    specifications: {
      size: 'Large',
      brand: 'Official Army Store',
      yearManufactured: 2020
    },
    status: 'available',
    deliveryOptions: ['pickup', 'shipping'],
    tags: ['uniform', 'colonel', 'dress', 'ceremony']
  },
  {
    title: 'Military History Books Collection',
    description: 'Comprehensive collection of military history books including Kargil War memoirs.',
    category: 'books',
    condition: 'good',
    price: 2500,
    images: [],
    seller: null,
    location: {
      city: 'Delhi',
      state: 'Delhi'
    },
    specifications: {
      quantity: '15 books',
      language: 'English',
      topics: 'Military History, Strategy, Memoirs'
    },
    status: 'available',
    deliveryOptions: ['pickup', 'shipping'],
    tags: ['books', 'history', 'military', 'strategy', 'memoirs']
  },
  {
    title: 'Army Surplus Backpack',
    description: 'Heavy-duty military backpack suitable for trekking and outdoor activities.',
    category: 'equipment',
    condition: 'very_good',
    price: 3500,
    images: [],
    seller: null,
    location: {
      city: 'Bangalore',
      state: 'Karnataka'
    },
    specifications: {
      capacity: '65 Liters',
      material: 'Canvas with waterproof coating',
      color: 'Olive Green'
    },
    status: 'available',
    deliveryOptions: ['pickup', 'shipping'],
    tags: ['backpack', 'army', 'surplus', 'trekking', 'outdoor']
  }
];

const seedGrievances = [
  {
    title: 'Delay in Medical Reimbursement',
    description: 'Medical reimbursement for my spouse\'s surgery has been pending for 6 months despite submitting all required documents.',
    category: 'medical',
    priority: 'high',
    submittedBy: null, // Will be set to family member user ID
    assignedTo: null, // Will be set to admin user ID
    status: 'in_progress',
    relatedDocuments: [],
    expectedResolutionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    tags: ['medical', 'reimbursement', 'delay', 'surgery'],
    communicationHistory: [
      {
        sender: null, // Will be set to family member user ID
        message: 'I submitted all documents on 15th May 2024 but haven\'t received any update.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        attachments: []
      }
    ]
  }
];

const seedEmergencyAlerts = [
  {
    title: 'Medical Emergency - Immediate Assistance Required',
    description: 'Officer collapsed during training exercise. Requesting immediate medical assistance.',
    type: 'medical',
    severity: 'critical',
    reportedBy: null, // Will be set to officer user ID
    location: {
      latitude: 18.5204,
      longitude: 73.8567,
      address: 'Training Ground, Pune Cantonment'
    },
    status: 'active',
    responseTeam: [],
    estimatedResponseTime: 15 // minutes
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await WelfareScheme.deleteMany({});
    await Application.deleteMany({});
    await Grievance.deleteMany({});
    await MarketplaceItem.deleteMany({});
    await EmergencyAlert.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = await User.insertMany(seedUsers);
    const adminUser = createdUsers.find(user => user.role === 'admin');
    const officerUser = createdUsers.find(user => user.role === 'officer');
    const familyUser = createdUsers.find(user => user.role === 'family_member');

    // Link family member to officer
    familyUser.familyDetails.officerId = officerUser._id;
    await familyUser.save();

    // Add family member to officer's family
    officerUser.familyMembers = [familyUser._id];
    await officerUser.save();

    // Create welfare schemes
    console.log('🏥 Creating welfare schemes...');
    const welfareSchemes = seedWelfareSchemes.map(scheme => ({
      ...scheme,
      createdBy: adminUser._id
    }));
    const createdSchemes = await WelfareScheme.insertMany(welfareSchemes);

    // Create marketplace items
    console.log('🛒 Creating marketplace items...');
    const marketplaceItems = seedMarketplaceItems.map(item => ({
      ...item,
      seller: officerUser._id
    }));
    await MarketplaceItem.insertMany(marketplaceItems);

    // Create grievances
    console.log('📝 Creating grievances...');
    const grievances = seedGrievances.map(grievance => ({
      ...grievance,
      submittedBy: familyUser._id,
      assignedTo: adminUser._id,
      communicationHistory: grievance.communicationHistory.map(comm => ({
        ...comm,
        sender: familyUser._id
      }))
    }));
    await Grievance.insertMany(grievances);

    // Create emergency alerts
    console.log('🚨 Creating emergency alerts...');
    const emergencyAlerts = seedEmergencyAlerts.map(alert => ({
      ...alert,
      reportedBy: officerUser._id
    }));
    await EmergencyAlert.insertMany(emergencyAlerts);

    // Create sample applications
    console.log('📋 Creating sample applications...');
    const sampleApplication = {
      scheme: createdSchemes[0]._id,
      applicant: familyUser._id,
      formData: {
        personalDetails: {
          name: familyUser.name,
          email: familyUser.email,
          phone: familyUser.personalInfo.phone,
          address: familyUser.personalInfo.address
        },
        medicalDetails: {
          condition: 'Cardiac Surgery',
          hospital: 'Command Hospital',
          estimatedCost: 250000,
          urgency: 'high'
        }
      },
      status: 'submitted',
      submissionDate: new Date(),
      workflow: {
        currentStage: 'initial_review',
        stages: [
          {
            name: 'initial_review',
            status: 'pending',
            assignedTo: adminUser._id,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      documents: []
    };
    await Application.create(sampleApplication);

    // Create sample notifications
    console.log('🔔 Creating sample notifications...');
    const sampleNotifications = [
      {
        recipient: familyUser._id,
        title: 'Application Submitted Successfully',
        message: 'Your application for Armed Forces Medical Assistance Scheme has been submitted.',
        type: 'application',
        priority: 'medium',
        channels: ['push', 'email'],
        metadata: {
          applicationId: sampleApplication._id,
          schemeId: createdSchemes[0]._id
        }
      },
      {
        recipient: officerUser._id,
        title: 'Welcome to Armed Forces Welfare System',
        message: 'Your profile has been verified. You can now access all welfare schemes.',
        type: 'system',
        priority: 'low',
        channels: ['push'],
        read: false
      }
    ];
    await Notification.insertMany(sampleNotifications);

    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Seeded Data Summary:
- ${createdUsers.length} Users (1 Admin, 1 Officer, 1 Family Member)
- ${createdSchemes.length} Welfare Schemes
- ${marketplaceItems.length} Marketplace Items
- ${grievances.length} Grievances
- ${emergencyAlerts.length} Emergency Alerts
- 1 Application
- ${sampleNotifications.length} Notifications

🔑 Test Credentials:
Admin: admin@armedforces.gov.in
Officer: colonel.sharma@army.gov.in  
Family: sunita.sharma@gmail.com

⚠️  Remember to set up Firebase Authentication with these email addresses!
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
