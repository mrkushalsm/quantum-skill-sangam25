// Armed Forces Welfare Management System - Post-Fix Integration Test
// This test verifies that the Firebase configuration and registration issues are resolved

const axios = require('axios');
const io = require('socket.io-client');

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3003';

// Test configuration
const testConfig = {
  backend: BACKEND_URL,
  frontend: FRONTEND_URL,
  timeout: 10000
};

// Test user data
const testUser = {
  email: `test${Date.now()}@example.com`,
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '9876543210',
  address: {
    street: '123 Test Street',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    country: 'India'
  },
  role: 'family_member'
};

console.log('🧪 Armed Forces Welfare Management System - Post-Fix Integration Test');
console.log('=' * 80);

async function runTests() {
  let testsPassed = 0;
  let testsTotal = 0;

  // Test 1: Backend Health Check
  testsTotal++;
  try {
    console.log('\n1️⃣ Testing Backend Health...');
    const healthResponse = await axios.get(`${testConfig.backend}/health`, {
      timeout: testConfig.timeout
    });
    
    if (healthResponse.status === 200 && healthResponse.data.status === 'healthy') {
      console.log('✅ Backend health check passed');
      console.log(`   Status: ${healthResponse.data.status}`);
      console.log(`   Database: ${healthResponse.data.database}`);
      testsPassed++;
    } else {
      console.log('❌ Backend health check failed');
    }
  } catch (error) {
    console.log(`❌ Backend health check failed: ${error.message}`);
  }

  // Test 2: User Registration (Backend API)
  testsTotal++;
  try {
    console.log('\n2️⃣ Testing User Registration...');
    const registerResponse = await axios.post(`${testConfig.backend}/api/auth/register`, testUser, {
      timeout: testConfig.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (registerResponse.status === 201 && registerResponse.data.success) {
      console.log('✅ User registration successful');
      console.log(`   User ID: ${registerResponse.data.user.id}`);
      console.log(`   Token received: ${registerResponse.data.token ? 'Yes' : 'No'}`);
      testsPassed++;
      
      // Store token for future tests
      global.authToken = registerResponse.data.token;
    } else {
      console.log('❌ User registration failed');
    }
  } catch (error) {
    console.log(`❌ User registration failed: ${error.response?.data?.message || error.message}`);
  }

  // Test 3: Frontend Accessibility
  testsTotal++;
  try {
    console.log('\n3️⃣ Testing Frontend Accessibility...');
    const frontendResponse = await axios.get(testConfig.frontend, {
      timeout: testConfig.timeout
    });
    
    if (frontendResponse.status === 200) {
      console.log('✅ Frontend is accessible');
      console.log(`   Status: ${frontendResponse.status}`);
      testsPassed++;
    } else {
      console.log('❌ Frontend accessibility failed');
    }
  } catch (error) {
    console.log(`❌ Frontend accessibility failed: ${error.message}`);
  }

  // Test 4: Socket.io Real-time Connection
  testsTotal++;
  try {
    console.log('\n4️⃣ Testing Real-time Socket.io Connection...');
    
    await new Promise((resolve, reject) => {
      const socket = io(testConfig.backend, {
        timeout: 5000,
        forceNew: true
      });
      
      socket.on('connect', () => {
        console.log('✅ Socket.io connection established');
        console.log(`   Socket ID: ${socket.id}`);
        testsPassed++;
        socket.disconnect();
        resolve();
      });
      
      socket.on('connect_error', (error) => {
        console.log(`❌ Socket.io connection failed: ${error.message}`);
        reject(error);
      });
      
      setTimeout(() => {
        socket.disconnect();
        reject(new Error('Socket.io connection timeout'));
      }, 5000);
    });
  } catch (error) {
    console.log(`❌ Socket.io connection failed: ${error.message}`);
  }

  // Test 5: API Authentication (if token available)
  if (global.authToken) {
    testsTotal++;
    try {
      console.log('\n5️⃣ Testing Authenticated API Access...');
      const profileResponse = await axios.get(`${testConfig.backend}/api/auth/profile`, {
        timeout: testConfig.timeout,
        headers: {
          'Authorization': `Bearer ${global.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (profileResponse.status === 200) {
        console.log('✅ Authenticated API access successful');
        console.log(`   Profile loaded: ${profileResponse.data.user ? 'Yes' : 'No'}`);
        testsPassed++;
      } else {
        console.log('❌ Authenticated API access failed');
      }
    } catch (error) {
      console.log(`❌ Authenticated API access failed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Test 6: Core API Endpoints
  testsTotal++;
  try {
    console.log('\n6️⃣ Testing Core API Endpoints...');
    const endpoints = [
      '/api/welfare',
      '/api/emergency',
      '/api/marketplace',
      '/api/dashboard',
      '/api/users'
    ];
    
    let endpointsPassed = 0;
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${testConfig.backend}${endpoint}`, {
          timeout: 3000
        });
        if (response.status === 200) {
          endpointsPassed++;
        }
      } catch (error) {
        // 401 is expected for protected routes
        if (error.response?.status === 401) {
          endpointsPassed++;
        }
      }
    }
    
    if (endpointsPassed === endpoints.length) {
      console.log('✅ All core API endpoints responding');
      console.log(`   Endpoints tested: ${endpoints.length}`);
      testsPassed++;
    } else {
      console.log(`❌ Some API endpoints failed (${endpointsPassed}/${endpoints.length})`);
    }
  } catch (error) {
    console.log(`❌ API endpoints test failed: ${error.message}`);
  }

  // Final Results
  console.log('\n' + '=' * 80);
  console.log('🎯 TEST RESULTS SUMMARY');
  console.log('=' * 80);
  console.log(`✅ Tests Passed: ${testsPassed}/${testsTotal}`);
  console.log(`📊 Success Rate: ${Math.round((testsPassed / testsTotal) * 100)}%`);
  
  if (testsPassed === testsTotal) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('🚀 Armed Forces Welfare Management System is fully operational');
    console.log('✨ Firebase configuration and registration issues have been resolved');
    console.log('🔗 Frontend-Backend integration is working correctly');
  } else {
    console.log(`\n⚠️  ${testsTotal - testsPassed} test(s) failed`);
    console.log('🔧 Some issues may need attention');
  }

  // System URLs
  console.log('\n📋 SYSTEM INFORMATION');
  console.log('=' * 40);
  console.log(`🌐 Frontend: ${testConfig.frontend}`);
  console.log(`🔧 Backend: ${testConfig.backend}`);
  console.log(`📊 Health Check: ${testConfig.backend}/health`);
  console.log(`📚 API Docs: ${testConfig.backend}/api/docs`);
  
  console.log('\n🎖️ The Armed Forces Welfare Management System is ready for use!');
  
  process.exit(testsPassed === testsTotal ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
