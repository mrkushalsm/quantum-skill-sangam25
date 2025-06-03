const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testGrievanceAPI() {
  console.log('🧪 Testing Grievance API Integration...\n');
  
  try {
    // Test 1: Health check
    console.log('1. Testing API Health...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test 2: Try to get tickets (without auth - should fail gracefully)
    console.log('\n2. Testing GET /api/grievance/tickets (no auth)...');
    try {
      const ticketsResponse = await axios.get(`${API_BASE}/grievance/tickets`);
      console.log('❓ Unexpected success (should require auth):', ticketsResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Authentication required (expected)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test 3: Check if routes exist
    console.log('\n3. Testing API endpoints availability...');
    
    const endpoints = [
      '/grievance/tickets',
      '/auth/register',
      '/auth/login',
      '/welfare/schemes',
      '/marketplace/items'
    ];
    
    for (const endpoint of endpoints) {
      try {
        await axios.get(`${API_BASE}${endpoint}`);
        console.log(`✅ ${endpoint} - accessible`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`✅ ${endpoint} - requires authentication (expected)`);
        } else if (error.response?.status === 404) {
          console.log(`❌ ${endpoint} - not found`);
        } else {
          console.log(`⚠️  ${endpoint} - ${error.response?.status || error.message}`);
        }
      }
    }
    
    console.log('\n🎉 API Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGrievanceAPI();
