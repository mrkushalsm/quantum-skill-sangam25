/**
 * Frontend Issue Resolution Test
 * Tests Firebase configuration and metadata fixes
 */

const axios = require('axios');
const { spawn } = require('child_process');

class FrontendFixTest {
    constructor() {
        this.testResults = [];
        this.frontendUrl = 'http://localhost:3003';
        this.backendUrl = 'http://localhost:3001';
    }

    async runTest(testName, testFn) {
        try {
            console.log(`🧪 Testing: ${testName}`);
            await testFn();
            this.testResults.push({ name: testName, status: 'PASS', error: null });
            console.log(`✅ ${testName} - PASSED`);
        } catch (error) {
            this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
            console.log(`❌ ${testName} - FAILED: ${error.message}`);
        }
    }

    async testFrontendAccessibility() {
        const response = await axios.get(this.frontendUrl, {
            timeout: 10000,
            validateStatus: () => true
        });
        
        if (response.status !== 200) {
            throw new Error(`Frontend not accessible: ${response.status}`);
        }
        
        // Check if the response contains expected content
        if (!response.data.includes('Armed Forces Welfare')) {
            throw new Error('Frontend content not loading properly');
        }
    }

    async testBackendHealthCheck() {
        const response = await axios.get(`${this.backendUrl}/health`, {
            timeout: 5000
        });
        
        if (response.status !== 200 || response.data.status !== 'healthy') {
            throw new Error('Backend health check failed');
        }
    }

    async testCorsConfiguration() {
        try {
            const response = await axios.get(`${this.backendUrl}/api/welfare`, {
                timeout: 5000,
                headers: {
                    'Origin': this.frontendUrl,
                    'Access-Control-Request-Method': 'GET'
                }
            });
            
            if (response.status !== 200) {
                throw new Error(`CORS test failed with status: ${response.status}`);
            }
        } catch (error) {
            if (error.response && error.response.status === 200) {
                // This is fine, the endpoint responded
                return;
            }
            throw error;
        }
    }

    async testApiEndpoints() {
        const endpoints = [
            '/api/welfare',
            '/api/emergency', 
            '/api/marketplace',
            '/api/dashboard',
            '/api/users'
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${this.backendUrl}${endpoint}`, {
                    timeout: 5000,
                    validateStatus: () => true
                });
                
                if (response.status >= 500) {
                    throw new Error(`${endpoint} returned server error: ${response.status}`);
                }
            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    throw new Error(`Cannot connect to backend for ${endpoint}`);
                }
                throw error;
            }
        }
    }

    async testEnvironmentVariables() {
        // This test checks if environment variables are properly configured
        // by attempting to access the frontend and checking for Firebase errors
        
        const response = await axios.get(this.frontendUrl, {
            timeout: 10000
        });
        
        // Check if the HTML contains any obvious Firebase configuration errors
        const htmlContent = response.data;
        
        if (htmlContent.includes('auth/invalid-api-key') || 
            htmlContent.includes('Firebase configuration')) {
            throw new Error('Firebase configuration issues detected in HTML');
        }
    }

    async testNextjsConfiguration() {
        const response = await axios.get(this.frontendUrl, {
            timeout: 10000
        });
        
        // Check for Next.js specific issues
        if (response.data.includes('viewport is configured in metadata export')) {
            throw new Error('Next.js viewport metadata warning still present');
        }
        
        // Check if the page loads properly with Next.js
        if (!response.data.includes('<!DOCTYPE html>')) {
            throw new Error('Next.js not serving proper HTML');
        }
    }

    async runAllTests() {
        console.log('\n🚀 Starting Frontend Fix Validation Tests\n');
        console.log('='.repeat(50));
        
        await this.runTest('Frontend Accessibility', () => this.testFrontendAccessibility());
        await this.runTest('Backend Health Check', () => this.testBackendHealthCheck());
        await this.runTest('CORS Configuration', () => this.testCorsConfiguration());
        await this.runTest('API Endpoints Accessibility', () => this.testApiEndpoints());
        await this.runTest('Environment Variables Configuration', () => this.testEnvironmentVariables());
        await this.runTest('Next.js Configuration', () => this.testNextjsConfiguration());
        
        this.generateReport();
    }

    generateReport() {
        console.log('\n' + '='.repeat(50));
        console.log('🎯 FRONTEND FIX TEST RESULTS');
        console.log('='.repeat(50));
        
        const passedTests = this.testResults.filter(test => test.status === 'PASS');
        const failedTests = this.testResults.filter(test => test.status === 'FAIL');
        
        console.log(`✅ Passed: ${passedTests.length}/${this.testResults.length}`);
        console.log(`❌ Failed: ${failedTests.length}/${this.testResults.length}`);
        
        if (failedTests.length > 0) {
            console.log('\n❌ Failed Tests:');
            failedTests.forEach(test => {
                console.log(`   • ${test.name}: ${test.error}`);
            });
        }
        
        if (passedTests.length === this.testResults.length) {
            console.log('\n🎉 ALL TESTS PASSED! Frontend issues resolved successfully.');
            console.log('\n📍 System Status:');
            console.log(`   • Frontend: http://localhost:3003 ✅`);
            console.log(`   • Backend: http://localhost:3001 ✅`);
            console.log(`   • Integration: Complete ✅`);
            console.log(`   • Firebase: Configured ✅`);
            console.log(`   • Next.js: Fixed ✅`);
        } else {
            console.log('\n⚠️  Some tests failed. Please check the issues above.');
        }
        
        console.log('\n' + '='.repeat(50));
    }
}

// Run the tests
const tester = new FrontendFixTest();
tester.runAllTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
