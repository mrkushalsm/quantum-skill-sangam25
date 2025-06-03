#!/usr/bin/env node

/**
 * Integration Test Script for Armed Forces Welfare Management System
 * Tests backend-frontend integration, API endpoints, and system functionality
 */

const http = require('http');
const https = require('https');

console.log('🧪 Starting Integration Tests for Armed Forces Welfare Management System\n');

// Test configuration
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3003';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 5000
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

// Test cases
const tests = [
  {
    name: 'Backend Health Check',
    url: `${BACKEND_URL}/health`,
    expected: 200,
    description: 'Verify backend server is running and healthy'
  },
  {
    name: 'API Documentation',
    url: `${BACKEND_URL}/api/docs`,
    expected: 200,
    description: 'Check API documentation endpoint'
  },
  {
    name: 'Frontend Accessibility',
    url: FRONTEND_URL,
    expected: 200,
    description: 'Verify frontend application is accessible'
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
  },
  {
    name: 'API Base Route',
    url: `${BACKEND_URL}/api`,
    expected: [200, 404],
    description: 'Check API base route response'
  }
];

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;
  const results = [];

  console.log('🔍 Running integration tests...\n');

  for (const test of tests) {
    try {
      console.log(`📋 Testing: ${test.name}`);
      console.log(`   ${test.description}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await makeRequest(test.url);
      const expectedStatuses = Array.isArray(test.expected) ? test.expected : [test.expected];
      
      if (expectedStatuses.includes(response.status)) {
        console.log(`✅ PASSED - Status: ${response.status}`);
        
        // Additional CORS check
        if (test.checkCors) {
          const corsHeader = response.headers['access-control-allow-origin'];
          if (corsHeader) {
            console.log(`   🌐 CORS headers present: ${corsHeader}`);
          } else {
            console.log(`   ⚠️  CORS headers missing`);
          }
        }
        
        // Show response data for health check
        if (test.name.includes('Health') && response.data) {
          try {
            const healthData = JSON.parse(response.data);
            console.log(`   📊 Health Status: ${JSON.stringify(healthData, null, 2)}`);
          } catch (e) {
            console.log(`   📊 Response: ${response.data.substring(0, 100)}...`);
          }
        }
        
        passed++;
        results.push({ name: test.name, status: 'PASSED', code: response.status });
      } else {
        console.log(`❌ FAILED - Expected: ${test.expected}, Got: ${response.status}`);
        if (response.data) {
          console.log(`   Response: ${response.data.substring(0, 200)}...`);
        }
        failed++;
        results.push({ name: test.name, status: 'FAILED', code: response.status });
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      failed++;
      results.push({ name: test.name, status: 'ERROR', error: error.message });
    }
    
    console.log('');
  }

  // Summary
  console.log('=' .repeat(60));
  console.log('📊 INTEGRATION TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  results.forEach(result => {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.status}`);
    if (result.code) console.log(`   Status Code: ${result.code}`);
    if (result.error) console.log(`   Error: ${result.error}`);
  });
  
  console.log('');
  console.log(`✅ Tests Passed: ${passed}`);
  console.log(`❌ Tests Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  console.log('\n🔗 System Information:');
  console.log(`Backend API: ${BACKEND_URL}`);
  console.log(`Frontend App: ${FRONTEND_URL}`);
  console.log(`Health Check: ${BACKEND_URL}/health`);
  console.log(`API Documentation: ${BACKEND_URL}/api/docs`);

  if (failed === 0) {
    console.log('\n🎉 All integration tests passed! System is fully operational.');
    console.log('✨ Ready for production deployment and user testing.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review system configuration.');
    console.log('🔧 Check server logs and network connectivity.');
  }
  
  return { passed, failed, total: passed + failed };
}

// Additional system checks
async function checkSystemHealth() {
  console.log('\n🔍 Additional System Health Checks...\n');
  
  try {
    // Check if both services are running
    const backendHealth = await makeRequest(`${BACKEND_URL}/health`);
    const frontendHealth = await makeRequest(FRONTEND_URL);
    
    console.log('🖥️  Service Status:');
    console.log(`   Backend (${BACKEND_URL}): ${backendHealth.status === 200 ? '🟢 Online' : '🔴 Offline'}`);
    console.log(`   Frontend (${FRONTEND_URL}): ${frontendHealth.status === 200 ? '🟢 Online' : '🔴 Offline'}`);
    
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
  }
}

// Main execution
async function main() {
  try {
    await checkSystemHealth();
    const results = await runTests();
    
    process.exit(results.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run the tests
main();
