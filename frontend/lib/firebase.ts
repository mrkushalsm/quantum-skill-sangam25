import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration with fallback values for better error handling
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Debug environment variables only in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase Config Debug:', {
    apiKey: firebaseConfig.apiKey ? '✅ Set' : '❌ Missing',
    authDomain: firebaseConfig.authDomain ? '✅ Set' : '❌ Missing',
    projectId: firebaseConfig.projectId ? '✅ Set' : '❌ Missing',
    appId: firebaseConfig.appId ? '✅ Set' : '❌ Missing'
  });
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Set auth persistence
try {
  setPersistence(auth, browserLocalPersistence);
} catch (error) {
  console.error('Error setting auth persistence:', error);
}

// Initialize Analytics if in browser and supported
let analytics: any;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, analytics };
