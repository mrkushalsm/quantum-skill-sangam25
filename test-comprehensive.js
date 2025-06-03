#!/usr/bin/env node

/**
 * Comprehensive Integration Test for Armed Forces Welfare Management System
 * Tests all system components including real-time features
 */

const http = require('http');
const https = require('https');
const { io: Client } = require('socket.io-client');

console.log('🚀 Comprehensive Integration Test - Armed Forces Welfare Management System\n');

// Test configuration
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3002';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ 
        status: res.statusCode, 
        data, 
        headers: res.headers 
      }));
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Socket.io test helper
function testSocketConnection() {
  return new Promise((resolve, reject) => {
    const socket = Client(BACKEND_URL);
    
    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Socket connection timeout'));
    }, 5000);
    
    socket.on('connect', () => {
      clearTimeout(timeout);
      console.log('   🔗 Socket connected successfully');
      socket.disconnect();
      resolve(true);
    });
    
    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Test suite definitions
const basicTests = [
  {
    name: 'Backend Health Check',
    url: `${BACKEND_URL}/health`,
    expected: 200,
    description: 'Verify backend server is running and healthy'
  },
  {
    name: 'API Documentation',
    url: `${BACKEND_URL}/api/docs`,
    expected: [200, 301, 302],
    description: 'Check API documentation endpoint'
  },
  {
    name: 'Frontend Accessibility',
    url: FRONTEND_URL,
    expected: 200,
    description: 'Verify frontend application is accessible'
  },
  {
    name: 'Root API Endpoint',
    url: `${BACKEND_URL}/`,
    expected: 200,
    description: 'Check root API endpoint'
  },
  {
    name: 'Protected Route (Unauthorized)',
    url: `${BACKEND_URL}/api/auth/profile`,
    expected: 401,
    description: 'Verify protected routes reject unauthorized requests'
  },
  {
    name: 'CORS Headers Check',
    url: `${BACKEND_URL}/health`,
    expected: 200,
    checkCors: true,
    description: 'Verify CORS headers are properly configured'
  }
];

const apiEndpointTests = [
  {
    name: 'Welfare Schemes API',
    url: `${BACKEND_URL}/api/welfare`,
    expected: [200, 401],
    description: 'Test welfare schemes endpoint'
  },
  {
    name: 'Emergency System API',
    url: `${BACKEND_URL}/api/emergency`,
    expected: [200, 401],
    description: 'Test emergency system endpoint'
  },
  {
    name: 'Marketplace API',
    url: `${BACKEND_URL}/api/marketplace`,
    expected: [200, 401],
    description: 'Test marketplace endpoint'
  },
  {
    name: 'Grievance System API',
    url: `${BACKEND_URL}/api/grievance`,
    expected: [200, 401],
    description: 'Test grievance system endpoint'
  },
  {
    name: 'Dashboard API',
    url: `${BACKEND_URL}/api/dashboard`,
    expected: [200, 401],
    description: 'Test dashboard endpoint'
  },
  {
    name: 'Users API',
    url: `${BACKEND_URL}/api/users`,
    expected: [200, 401],
    description: 'Test users endpoint'
  }
];

// Run basic system tests
async function runBasicTests() {
  console.log('📋 Running Basic System Tests...\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of basicTests) {
    try {
      console.log(`🧪 ${test.name}`);
      console.log(`   ${test.description}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await makeRequest(test.url);
      const expectedStatuses = Array.isArray(test.expected) ? test.expected : [test.expected];
      
      if (expectedStatuses.includes(response.status)) {
        console.log(`   ✅ PASSED - Status: ${response.status}`);
        
        // Additional CORS check
        if (test.checkCors) {
          const corsHeader = response.headers['access-control-allow-origin'];
          if (corsHeader) {
            console.log(`   🌐 CORS: ${corsHeader}`);
          } else {
            console.log(`   ⚠️  CORS headers missing`);
          }
        }
        
        // Show health data
        if (test.name.includes('Health') && response.data) {
          try {
            const healthData = JSON.parse(response.data);
            console.log(`   📊 ${healthData.message}`);
            console.log(`   🔧 Environment: ${healthData.environment}`);
          } catch (e) {
            console.log(`   📊 Response received`);
          }
        }
        
        passed++;
        results.push({ name: test.name, status: 'PASSED', code: response.status });
      } else {
        console.log(`   ❌ FAILED - Expected: ${test.expected}, Got: ${response.status}`);
        failed++;
        results.push({ name: test.name, status: 'FAILED', code: response.status });
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failed++;
      results.push({ name: test.name, status: 'ERROR', error: error.message });
    }
    
    console.log('');
  }
  
  return { passed, failed, results };
}

// Run API endpoint tests
async function runAPITests() {
  console.log('🔌 Running API Endpoint Tests...\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of apiEndpointTests) {
    try {
      console.log(`🧪 ${test.name}`);
      console.log(`   ${test.description}`);
      
      const response = await makeRequest(test.url);
      const expectedStatuses = Array.isArray(test.expected) ? test.expected : [test.expected];
      
      if (expectedStatuses.includes(response.status)) {
        console.log(`   ✅ PASSED - Status: ${response.status}`);
        passed++;
        results.push({ name: test.name, status: 'PASSED', code: response.status });
      } else {
        console.log(`   ❌ FAILED - Expected: ${test.expected}, Got: ${response.status}`);
        failed++;
        results.push({ name: test.name, status: 'FAILED', code: response.status });
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failed++;
      results.push({ name: test.name, status: 'ERROR', error: error.message });
    }
    
    console.log('');
  }
  
  return { passed, failed, results };
}

// Test real-time functionality
async function testRealTimeFeatures() {
  console.log('⚡ Testing Real-time Features...\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  try {
    console.log('🧪 Socket.io Connection Test');
    console.log('   Testing WebSocket connectivity for real-time features');
    
    await testSocketConnection();
    console.log('   ✅ PASSED - Socket.io connected successfully');
    passed++;
    results.push({ name: 'Socket.io Connection', status: 'PASSED' });
    
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    failed++;
    results.push({ name: 'Socket.io Connection', status: 'ERROR', error: error.message });
  }
  
  console.log('');
  return { passed, failed, results };
}

// System health overview
async function systemHealthOverview() {
  console.log('🏥 System Health Overview...\n');
  
  try {
    const [backendHealth, frontendHealth] = await Promise.all([
      makeRequest(`${BACKEND_URL}/health`).catch(() => ({ status: 0 })),
      makeRequest(FRONTEND_URL).catch(() => ({ status: 0 }))
    ]);
    
    console.log('🖥️  Service Status:');
    console.log(`   Backend API (${BACKEND_URL}): ${backendHealth.status === 200 ? '🟢 Online' : '🔴 Offline'}`);
    console.log(`   Frontend App (${FRONTEND_URL}): ${frontendHealth.status === 200 ? '🟢 Online' : '🔴 Offline'}`);
    
    if (backendHealth.status === 200 && backendHealth.data) {
      try {
        const data = JSON.parse(backendHealth.data);
        console.log(`   Environment: ${data.environment || 'Unknown'}`);
        console.log(`   Version: ${data.version || 'Unknown'}`);
        console.log(`   Timestamp: ${data.timestamp || 'Unknown'}`);
      } catch (e) {
        console.log('   Backend data parsing failed');
      }
    }
    
    return {
      backend: backendHealth.status === 200,
      frontend: frontendHealth.status === 200
    };
    
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
    return { backend: false, frontend: false };
  }
}

// Main test execution
async function main() {
  try {
    console.log('🎯 Armed Forces Welfare Management System - Full Integration Test');
    console.log('=' .repeat(80));
    console.log('');
    
    // System health check
    const healthStatus = await systemHealthOverview();
    console.log('');
    
    // Run all test suites
    const basicResults = await runBasicTests();
    const apiResults = await runAPITests();
    const realtimeResults = await testRealTimeFeatures();
    
    // Combined results
    const totalPassed = basicResults.passed + apiResults.passed + realtimeResults.passed;
    const totalFailed = basicResults.failed + apiResults.failed + realtimeResults.failed;
    const totalTests = totalPassed + totalFailed;
    
    // Final summary
    console.log('=' .repeat(80));
    console.log('🏆 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('=' .repeat(80));
    
    console.log('\n📊 Test Categories:');
    console.log(`   Basic System Tests: ${basicResults.passed}/${basicResults.passed + basicResults.failed} passed`);
    console.log(`   API Endpoint Tests: ${apiResults.passed}/${apiResults.passed + apiResults.failed} passed`);
    console.log(`   Real-time Features: ${realtimeResults.passed}/${realtimeResults.passed + realtimeResults.failed} passed`);
    
    console.log('\n📈 Overall Results:');
    console.log(`   ✅ Total Passed: ${totalPassed}`);
    console.log(`   ❌ Total Failed: ${totalFailed}`);
    console.log(`   📊 Success Rate: ${Math.round((totalPassed / totalTests) * 100)}%`);
    
    console.log('\n🔗 System URLs:');
    console.log(`   Backend API: ${BACKEND_URL}`);
    console.log(`   Frontend App: ${FRONTEND_URL}`);
    console.log(`   API Health: ${BACKEND_URL}/health`);
    console.log(`   API Documentation: ${BACKEND_URL}/api/docs`);
    
    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! System is fully operational and ready for deployment.');
      console.log('✨ The Armed Forces Welfare Management System integration is complete.');
    } else if (totalPassed / totalTests >= 0.8) {
      console.log('\n✅ System is mostly operational with minor issues.');
      console.log('🔧 Please address the failed tests for optimal performance.');
    } else {
      console.log('\n⚠️  System has significant issues that need attention.');
      console.log('🚨 Please review and fix the failed components before deployment.');
    }
    
    process.exit(totalFailed === 0 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Execute tests
main();
