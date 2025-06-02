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
    coreData: {
      role: 'Admin',
      contactInfo: {
        email: 'admin@armedforces.gov.in',
        phone: '9876543210'
      }
    },
    name: 'System Administrator',
    address: {
      street: 'South Block',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India'
    },
    isActive: true,
    isVerified: true,
    notificationPreferences: {
      email: true,
      push: true,
      sms: true
    },
    preferences: {
      language: 'en'
    },
    extensions: {}
  },
  {
    firebaseUid: 'test-officer-001',
    coreData: {
      role: 'Officer',
      contactInfo: {
        email: 'colonel.sharma@army.gov.in',
        phone: '9876543211'
      }
    },
    name: 'Colonel Rajesh Sharma',
    address: {
      street: 'Officers Mess, Cantonment',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      country: 'India'
    },
    isActive: true,
    isVerified: true,
    notificationPreferences: {
      email: true,
      push: true,
      sms: false
    },
    preferences: {
      language: 'en'
    },
    extensions: {
      officer: {
        serviceNumber: 'IC-12345',
        rank: 'Colonel',
        unit: '1st Battalion, Maratha Light Infantry',
        postingLocation: 'Pune Cantonment',
        joiningDate: new Date('1995-06-01')
      },
      emergency: {
        bloodGroup: 'B+',
        allergies: ['None'],
        medicalConditions: ['None'],
        emergencyContacts: [
          {
            name: 'Mrs. Sunita Sharma',
            relationship: 'spouse',
            phone: '9876543212',
            email: 'sunita.sharma@gmail.com',
            priority: 1
          }
        ]
      }
    }
  },
  {
    firebaseUid: 'test-family-001',
    coreData: {
      role: 'Family',
      contactInfo: {
        email: 'sunita.sharma@gmail.com',
        phone: '9876543212'
      }
    },
    name: 'Mrs. Sunita Sharma',
    address: {
      street: 'Type III Quarters, Cantonment',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
      country: 'India'
    },
    isActive: true,
    isVerified: true,
    notificationPreferences: {
      email: true,
      push: true,
      sms: true
    },
    preferences: {
      language: 'hi'
    },
    extensions: {
      family: {
        relationToOfficer: 'spouse',
        officerServiceNumber: 'IC-12345',
        dependentId: 'DEP-001'
      },
      emergency: {
        bloodGroup: 'A+',
        allergies: ['None'],
        medicalConditions: ['None'],
        emergencyContacts: [
          {
            name: 'Colonel Rajesh Sharma',
            relationship: 'spouse',
            phone: '9876543211',
            email: 'colonel.sharma@army.gov.in',
            priority: 1
          }
        ]
      }
    }
  }
];

const seedWelfareSchemes = [
  {
    name: 'Armed Forces Medical Assistance Scheme',
    title: 'Armed Forces Medical Assistance Scheme',
    description: 'Comprehensive medical assistance for serving and retired personnel including their families.',
    category: 'healthcare',
    eligibilityType: 'both',
    eligibilityCriteria: [
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
      phone: '1123792204',
      email: 'medical@dgafms.gov.in',
      office: 'Directorate General Armed Forces Medical Services'
    }
  },
  {
    name: 'Education Scholarship for Children',
    title: 'Education Scholarship for Children',
    description: 'Educational financial assistance for children of armed forces personnel.',
    category: 'education',
    eligibilityType: 'family_member',
    eligibilityCriteria: [
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
      phone: '1123792205',
      email: 'education@kendriyasainikboard.gov.in',
      office: 'Kendriya Sainik Board'
    }
  },
  {
    name: 'Emergency Financial Assistance',
    title: 'Emergency Financial Assistance',
    description: 'Immediate financial support for armed forces families in distress.',
    category: 'financial_assistance',
    eligibilityType: 'both',
    eligibilityCriteria: [
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
      phone: '1123792206',
      email: 'emergency@afwwa.org',
      office: 'Armed Forces Wives Welfare Association'
    }
  }
];

const seedMarketplaceItems = [
  {
    title: 'Military Uniform - Colonel Rank',
    description: 'Complete dress uniform for Colonel rank. Like new condition, worn only for ceremonies.',
    category: 'clothing',
    condition: 'like_new',
    price: 15000,
    images: [],
    seller: null, // Will be set to officer user ID
    location: {
      city: 'Pune',
      state: 'Maharashtra',
      area: 'Khadakwasla',
      coordinates: [73.7782, 18.5158]
    },
    contactInfo: {
      phoneNumber: '9876543210',
      email: 'seller@example.com',
      name: 'Col. Sharma'
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
      state: 'Delhi',
      area: 'Connaught Place',
      coordinates: [77.2167, 28.6139]
    },
    contactInfo: {
      phoneNumber: '9876543211',
      email: 'book.seller@example.com',
      name: 'Maj. Verma'
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
    category: 'sports_equipment',
    condition: 'good',
    price: 3500,
    images: [],
    seller: null,
    location: {
      city: 'Bangalore',
      state: 'Karnataka',
      area: 'Indiranagar',
      coordinates: [77.6401, 12.9716]
    },
    contactInfo: {
      phoneNumber: '9876543212',
      email: 'outdoor.gear@example.com',
      name: 'Lt. Nair'
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

// Function to generate a unique grievance ID
function generateGrievanceId() {
  const prefix = 'GRV';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${timestamp}${random}`;
}

const seedGrievances = [
  {
    grievanceId: generateGrievanceId(),
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
    submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    lastUpdated: new Date(),
    communicationHistory: [
      {
        sender: null, // Will be set to family member user ID
        message: 'I submitted all documents on 15th May 2024 but haven\'t received any update.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        isInternal: false,
        attachments: []
      }
    ]
  }
];

// Function to generate a unique alert ID
function generateAlertId() {
  const prefix = 'ALRT';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${timestamp}${random}`;
}

const seedEmergencyAlerts = [
  {
    alertId: generateAlertId(),
    title: 'Medical Emergency - Immediate Assistance Required',
    description: 'Officer collapsed during training exercise. Requesting immediate medical assistance.',
    type: 'medical',
    severity: 'critical',
    reportedBy: null, // Will be set to officer user ID
    location: {
      latitude: 18.5204,
      longitude: 73.8567,
      address: 'Training Ground, Pune Cantonment',
      landmark: 'Near Parade Ground',
      area: 'Pune Cantonment',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001'
    },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    responseTeam: [],
    estimatedResponseTime: 15, // minutes
    notes: 'Officer reported dizziness before collapsing. No known allergies. Medical history available in records.'
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
    const adminUser = createdUsers.find(user => user.coreData.role === 'Admin');
    const officerUser = createdUsers.find(user => user.coreData.role === 'Officer');
    const familyUser = createdUsers.find(user => user.coreData.role === 'Family');
    
    // Debug: Log the family user object to check its structure
    console.log('Family User Object:', JSON.stringify(familyUser, null, 2));
    console.log('Family User Name:', familyUser.name);

    // Link family member to officer
    familyUser.extensions.set('family', {
      ...familyUser.extensions.get('family'),
      officerId: officerUser._id
    });
    await familyUser.save();

    // Add family member to officer's family
    officerUser.extensions.set('officer', {
      ...officerUser.extensions.get('officer'),
      familyMembers: [familyUser._id]
    });
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

    // Function to generate a unique application ID
    function generateApplicationId() {
      const prefix = 'APP';
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}${timestamp}${random}`;
    }

    // Create sample applications
    console.log('📋 Creating sample applications...');
    const sampleApplication = {
      scheme: createdSchemes[0]._id,
      applicant: familyUser._id,
      applicationId: generateApplicationId(),
      status: 'submitted',
      submittedAt: new Date(),
      personalDetails: {
        fullName: `${familyUser.firstName} ${familyUser.lastName}`,
        dateOfBirth: new Date('1985-05-15'),
        gender: 'male',
        fatherName: 'Mr. Rajesh Kumar',
        motherName: 'Mrs. Sunita Kumar',
        spouseName: 'Mrs. Priya Sharma',
        address: {
          street: '123 Army Quarters',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          country: 'India',
          type: 'permanent'
        },
        phoneNumber: familyUser.coreData.contactInfo.phone,
        email: familyUser.coreData.contactInfo.email,
        aadharNumber: '123456789012',
        panNumber: 'ABCDE1234F'
      },
      additionalInfo: {
        medicalDetails: {
          condition: 'Cardiac Surgery',
          hospital: 'Command Hospital',
          estimatedCost: 250000,
          urgency: 'high',
          doctorName: 'Dr. Sharma',
          hospitalAddress: 'Command Hospital, Pune',
          treatmentStartDate: new Date('2024-06-01'),
          treatmentEndDate: new Date('2024-06-15'),
          isEmergency: true,
          previousTreatments: ['Angioplasty in 2022']
        }
      },
      documents: [
        {
          documentType: 'aadhar',
          fileName: 'aadhar.pdf',
          filePath: '/uploads/aadhar.pdf',
          fileSize: 1024 * 1024 * 2, // 2MB
          uploadedAt: new Date(),
          isVerified: true,
          verifiedBy: adminUser._id,
          verificationNote: 'Aadhar verified successfully'
        },
        {
          documentType: 'medical_reports',
          fileName: 'reports.pdf',
          filePath: '/uploads/reports.pdf',
          fileSize: 1024 * 1024 * 5, // 5MB
          uploadedAt: new Date(),
          isVerified: false
        }
      ],
      currentApprovalLevel: 1,
      approvalHistory: [
        {
          level: 1,
          approver: adminUser._id,
          action: 'approved',
          comments: 'Initial review completed',
          timestamp: new Date()
        }
      ],
      priority: 'high',
      requestedAmount: 250000,
      approvedAmount: 200000,
      paymentStatus: 'pending',
      applicantComments: 'Urgently need financial assistance for medical treatment',
      adminComments: 'Approved with reduced amount as per scheme guidelines',
      internalNotes: 'Verify medical reports and approve if all documents are in order'
    };
    await Application.create(sampleApplication);

    // Create sample notifications
    console.log('🔔 Creating sample notifications...');
    const sampleNotifications = [
      {
        recipient: familyUser._id,
        title: 'Application Submitted Successfully',
        message: 'Your application for Armed Forces Medical Assistance Scheme has been submitted.',
        type: 'application_status',
        priority: 'normal',
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
        type: 'system_announcement',
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
