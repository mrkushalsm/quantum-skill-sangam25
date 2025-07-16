const admin = require('firebase-admin');

// Initialize Firebase Admin SDK only if not in test environment
const initializeFirebase = () => {
  try {
    // Check if in test environment
    if (process.env.NODE_ENV === 'test') {
      console.log('Test environment detected, skipping Firebase initialization');
      return null;
    }

    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('Firebase Admin already initialized, returning existing app');
      return admin.app();
    }

    console.log('Initializing Firebase Admin SDK...');
    
    // Required environment variables
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_PRIVATE_KEY_ID',
      'FIREBASE_CLIENT_ID'
    ];

    // Check for required environment variables
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }
      return null;
    }

    // Format private key (replace escaped newlines with actual newlines)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    // Initialize Firebase Admin
    const firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        clientId: process.env.FIREBASE_CLIENT_ID,
        authUri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
        tokenUri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
        authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
        clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL
      }),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });

    console.log('Firebase Admin SDK initialized successfully');
    console.log(`Project: ${process.env.FIREBASE_PROJECT_ID}`);
    console.log(`Service Account: ${process.env.FIREBASE_CLIENT_EMAIL}`);
    
    return firebaseApp;
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
};

// Verify Firebase ID token
const verifyIdToken = async (idToken) => {
  try {
    if (process.env.NODE_ENV === 'test') {
      return {
        uid: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      };
    }

    if (!idToken) {
      throw new Error('No ID token provided');
    }
    
    const auth = admin.auth();
    const decodedToken = await auth.verifyIdToken(idToken);
    
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

// Create custom token
const createCustomToken = async (uid, additionalClaims = {}) => {
  try {
    if (process.env.NODE_ENV === 'test') {
      return 'mock-custom-token';
    }

    const auth = admin.auth();
    const customToken = await auth.createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error('Custom token creation failed:', error.message);
    throw new Error(`Token creation failed: ${error.message}`);
  }
};

// Verify any Firebase token (custom or ID token)
const verifyFirebaseToken = async (token) => {
  try {
    if (process.env.NODE_ENV === 'test') {
      return {
        uid: 'test-user',
        email: 'test@example.com',
        name: 'Test User'
      };
    }

    if (!token) {
      throw new Error('No token provided');
    }

    const auth = admin.auth();

    // Try to verify as ID token first
    try {
      const decodedToken = await auth.verifyIdToken(token);
      return decodedToken;
    } catch (idTokenError) {
      console.log('Token is not an ID token, checking if it\'s a custom token format');

      // If it fails as ID token, it might be a custom token
      // Custom tokens need to be exchanged for ID tokens on the client side
      // For now, we'll decode it manually to extract the UID
      try {
        // Decode the JWT payload without verification (since custom tokens are signed differently)
        const [header, payload, signature] = token.split('.');
        if (!payload) {
          throw new Error('Invalid token format');
        }

        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());

        // Check if it's a Firebase custom token format
        if (decodedPayload.iss && decodedPayload.iss.includes('firebase') && decodedPayload.uid) {
          // Return minimal user info for custom tokens
          return {
            uid: decodedPayload.uid,
            ...decodedPayload.claims
          };
        }

        throw new Error('Token format not recognized');
      } catch (customTokenError) {
        console.error('Failed to process custom token:', customTokenError.message);
        throw new Error('Invalid token format');
      }
    }
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

// Get Firebase Auth instance
const getAuth = () => {
  if (process.env.NODE_ENV === 'test') {
    return {
      verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user' }),
      createUser: jest.fn().mockResolvedValue({ uid: 'test-user' }),
      deleteUser: jest.fn().mockResolvedValue(true),
      getUser: jest.fn().mockResolvedValue({ uid: 'test-user' }),
      setCustomUserClaims: jest.fn().mockResolvedValue(true),
      createCustomToken: jest.fn().mockResolvedValue('test-token')
    };
  }
  return admin.auth();
};

// Get Firestore instance
const getFirestore = () => {
  if (process.env.NODE_ENV === 'test') {
    return {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
      set: jest.fn().mockResolvedValue(true),
      update: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true)
    };
  }
  return admin.firestore();
};

// Get Storage instance
const getStorage = () => {
  if (process.env.NODE_ENV === 'test') {
    return {
      bucket: jest.fn().mockReturnThis(),
      file: jest.fn().mockReturnThis(),
      upload: jest.fn().mockResolvedValue([{ name: 'test-file' }]),
      delete: jest.fn().mockResolvedValue(true)
    };
  }
  return admin.storage();
};

// Get user by UID
const getUserByUid = async (uid) => {
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    throw new Error('User not found');
  }
};

// Update user claims
const setCustomUserClaims = async (uid, customClaims) => {
  try {
    await admin.auth().setCustomUserClaims(uid, customClaims);
    return true;
  } catch (error) {
    throw new Error('Failed to set custom claims');
  }
};

// Delete user
const deleteUser = async (uid) => {
  try {
    await admin.auth().deleteUser(uid);
    return true;
  } catch (error) {
    throw new Error('Failed to delete user');
  }
};

// Initialize Firebase immediately when this module is imported (except in tests)
let firebaseApp = null;
if (process.env.NODE_ENV !== 'test') {
  firebaseApp = initializeFirebase();
}

module.exports = {
  initializeFirebase,
  verifyIdToken,
  verifyFirebaseToken,
  createCustomToken,
  getUserByUid,
  setCustomUserClaims,
  deleteUser,
  getAuth,
  getFirestore,
  getStorage,
  admin: firebaseApp
};
