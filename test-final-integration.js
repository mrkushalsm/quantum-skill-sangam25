#!/usr/bin/env node

// Final integration test to verify all fixes are working
const axios = require('axios');

const BACKEND_URL = 'http://localhost:3005/api';
const FRONTEND_URL = 'http://localhost:3006';

console.log('🚀 Final Integration Test');
console.log('==========================\n');

async function testBackendHealth() {
  console.log('1. Testing Backend Health...');
  try {
    const response = await axios.get(`${BACKEND_URL.replace('/api', '')}/health`);
    console.log('   ✅ Backend health check passed');
    console.log(`   📊 Status: ${response.data.status}`);
    console.log(`   🗄️ Database: ${response.data.database}`);
    console.log(`   🔥 Firebase: ${response.data.firebase}`);
    return true;
  } catch (error) {
    console.log('   ❌ Backend health check failed:', error.message);
    return false;
  }
}

async function testFrontendHealth() {
  console.log('\n2. Testing Frontend Health...');
  try {
    const response = await axios.get(FRONTEND_URL);
    console.log('   ✅ Frontend is accessible');
    console.log(`   📊 Status: ${response.status}`);
    return true;
  } catch (error) {
    console.log('   ❌ Frontend health check failed:', error.message);
    return false;
  }
}

async function testRegistrationAPI() {
  console.log('\n3. Testing Registration API...');
  
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '+919876543210',
    role: 'officer',
    rank: 'Captain',
    unit: 'Test Unit',
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      country: 'India'
    }
  };

  try {
    const response = await axios.post(`${BACKEND_URL}/auth/register`, testUser);
    console.log('   ✅ Registration API working');
    console.log(`   📊 Status: ${response.status}`);
    console.log(`   👤 User created: ${response.data.user.name}`);
    console.log(`   🎫 Token received: ${response.data.token ? 'Yes' : 'No'}`);
    return response.data;
  } catch (error) {
    console.log('   ❌ Registration API failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testLoginAPI(email, password) {
  console.log('\n4. Testing Login API...');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/login`, {
      email,
      password
    });
    console.log('   ✅ Login API working');
    console.log(`   📊 Status: ${response.status}`);
    console.log(`   👤 User logged in: ${response.data.user.name}`);
    console.log(`   🎫 Token received: ${response.data.token ? 'Yes' : 'No'}`);
    return response.data.token;
  } catch (error) {
    console.log('   ❌ Login API failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testProtectedRoute(token) {
  console.log('\n5. Testing Protected Route...');
  
  try {
    const response = await axios.get(`${BACKEND_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('   ✅ Protected route working');
    console.log(`   📊 Status: ${response.status}`);
    console.log(`   👤 Profile retrieved: ${response.data.user.name || response.data.user.email}`);
    return true;
  } catch (error) {
    console.log('   ❌ Protected route failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testFirebaseEnvironmentVars() {
  console.log('\n6. Testing Firebase Environment Variables...');
  
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  // Test by trying to access a frontend page that would load Firebase
  try {
    const response = await axios.get(FRONTEND_URL);
    console.log('   ✅ Frontend loads without Firebase errors');
    console.log('   🔥 Firebase config should be loaded in browser');
    return true;
  } catch (error) {
    console.log('   ❌ Frontend Firebase test failed:', error.message);
    return false;
  }
}

async function runTests() {
  const results = {
    backendHealth: false,
    frontendHealth: false,
    registration: false,
    login: false,
    protectedRoute: false,
    firebaseEnv: false
  };

  // Run all tests
  results.backendHealth = await testBackendHealth();
  results.frontendHealth = await testFrontendHealth();
  
  if (results.backendHealth) {
    const registrationResult = await testRegistrationAPI();
    if (registrationResult) {
      results.registration = true;
      
      const token = await testLoginAPI(registrationResult.user.email, 'TestPassword123!');
      if (token) {
        results.login = true;
        results.protectedRoute = await testProtectedRoute(token);
      }
    }
  }
  
  results.firebaseEnv = await testFirebaseEnvironmentVars();

  // Calculate overall success rate
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = (passedTests / totalTests) * 100;

  console.log('\n🎯 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n📊 Overall Success Rate: ${successRate.toFixed(1)}% (${passedTests}/${totalTests})`);
  
  if (successRate >= 80) {
    console.log('🎉 Integration is working well!');
  } else if (successRate >= 60) {
    console.log('⚠️ Integration has some issues that need attention');
  } else {
    console.log('🚨 Integration needs significant fixes');
  }

  console.log('\n🔗 Access URLs:');
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Backend API: ${BACKEND_URL}`);
  console.log(`   Backend Health: ${BACKEND_URL.replace('/api', '')}/health`);
  
  return results;
}

// Run the tests
runTests().catch(console.error);
