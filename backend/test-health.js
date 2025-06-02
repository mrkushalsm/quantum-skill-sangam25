// Comprehensive Health Check Script for Armed Forces Welfare Backend Testing
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🔍 Running Comprehensive Backend Health Check...\n');

// Test Infrastructure Health Check
async function checkTestInfrastructure() {
  console.log('🧪 Checking Test Infrastructure...');
  
  // Check test files exist
  const testFiles = [
    '__tests__/unit/models/User.test.js',
    '__tests__/unit/models/WelfareScheme.test.js',
    '__tests__/unit/models/Application.test.js',
    '__tests__/unit/middleware/auth.test.js',
    '__tests__/unit/middleware/errorHandler.test.js',
    '__tests__/unit/utils/emailService.test.js',
    '__tests__/unit/utils/notification.test.js',
    '__tests__/unit/utils/scheduler.test.js',
    '__tests__/unit/utils/socket.test.js',
    '__tests__/integration/routes/auth.test.js',
    '__tests__/integration/routes/welfare.test.js',
    '__tests__/integration/routes/emergency.test.js',
    '__tests__/integration/routes/grievance.test.js',
    '__tests__/integration/routes/marketplace.test.js',
    '__tests__/performance/api.test.js',
    'test-setup.js'
  ];

  let missingTestFiles = [];
  testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      missingTestFiles.push(file);
    }
  });

  if (missingTestFiles.length > 0) {
    console.log(`\n⚠️  Missing ${missingTestFiles.length} test files`);
    return false;
  }

  console.log('\n✅ All test files present');
  return true;
}

// Check package.json for test dependencies
async function checkTestDependencies() {
  console.log('\n📦 Checking Test Dependencies...');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredTestDeps = {
    'jest': '^29.7.0',
    'supertest': '^7.1.1',
    'mongodb-memory-server': '^10.1.4',
    '@types/jest': '^29.5.14',
    'jest-environment-node': '^30.0.0-beta.3'
  };

  let missingDeps = [];
  Object.entries(requiredTestDeps).forEach(([dep, version]) => {
    if (packageJson.devDependencies?.[dep]) {
      console.log(`✅ ${dep}: ${packageJson.devDependencies[dep]}`);
    } else {
      console.log(`❌ ${dep}: MISSING`);
      missingDeps.push(dep);
    }
  });

  // Check test scripts
  const requiredScripts = [
    'test',
    'test:watch',
    'test:coverage',
    'test:integration',
    'test:unit'
  ];

  let missingScripts = [];
  requiredScripts.forEach(script => {
    if (packageJson.scripts?.[script]) {
      console.log(`✅ Script ${script}: ${packageJson.scripts[script]}`);
    } else {
      console.log(`❌ Script ${script}: MISSING`);
      missingScripts.push(script);
    }
  });

  if (missingDeps.length > 0 || missingScripts.length > 0) {
    console.log(`\n⚠️  Missing ${missingDeps.length} dependencies and ${missingScripts.length} scripts`);
    return false;
  }

  console.log('\n✅ All test dependencies and scripts configured');
  return true;
}

// Run a quick test suite to verify setup
async function runQuickTestSuite() {
  console.log('\n🏃 Running Quick Test Suite...');
  
  return new Promise((resolve) => {
    const testProcess = spawn('npm', ['test', '--', '--testTimeout=10000', '--maxWorkers=1'], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    let output = '';
    let errorOutput = '';

    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    testProcess.on('close', (code) => {
      console.log(`Test process exited with code: ${code}`);
      
      if (code === 0) {
        console.log('✅ Quick test suite passed');
        
        // Extract test results
        const lines = output.split('\n');
        const testSummaryLine = lines.find(line => line.includes('Tests:'));
        if (testSummaryLine) {
          console.log(`📊 ${testSummaryLine.trim()}`);
        }
        
        const coverageLine = lines.find(line => line.includes('Coverage:'));
        if (coverageLine) {
          console.log(`📈 ${coverageLine.trim()}`);
        }
        
        resolve(true);
      } else {
        console.log('❌ Quick test suite failed');
        console.log('Error output:', errorOutput);
        resolve(false);
      }
    });

    // Set timeout for test execution
    setTimeout(() => {
      testProcess.kill();
      console.log('⚠️  Test suite timed out');
      resolve(false);
    }, 60000); // 60 second timeout
  });
}

// Check Jest configuration
async function checkJestConfiguration() {
  console.log('\n⚙️  Checking Jest Configuration...');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const jestConfig = packageJson.jest;
  if (!jestConfig) {
    console.log('❌ Jest configuration not found in package.json');
    return false;
  }

  const requiredJestConfig = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
    testMatch: [
      '**/__tests__/**/*.test.js',
      '**/tests/**/*.test.js'
    ],
    collectCoverageFrom: [
      '**/*.js',
      '!**/node_modules/**',
      '!**/tests/**',
      '!**/coverage/**',
      '!**/uploads/**',
      '!**/logs/**',
      '!jest.config.js',
      '!test-*.js'
    ]
  };

  let configIssues = [];
  Object.entries(requiredJestConfig).forEach(([key, expectedValue]) => {
    const actualValue = jestConfig[key];
    if (JSON.stringify(actualValue) === JSON.stringify(expectedValue)) {
      console.log(`✅ ${key}: correctly configured`);
    } else {
      console.log(`❌ ${key}: configuration issue`);
      configIssues.push(key);
    }
  });

  if (configIssues.length > 0) {
    console.log(`\n⚠️  ${configIssues.length} Jest configuration issues found`);
    return false;
  }

  console.log('\n✅ Jest configuration is correct');
  return true;
}

// Main health check function
async function runHealthCheck() {
  console.log('🏥 ARMED FORCES WELFARE BACKEND - TEST HEALTH CHECK');
  console.log('='.repeat(60));
  
  const checks = [
    { name: 'Test Infrastructure', fn: checkTestInfrastructure },
    { name: 'Test Dependencies', fn: checkTestDependencies },
    { name: 'Jest Configuration', fn: checkJestConfiguration },
    { name: 'Quick Test Suite', fn: runQuickTestSuite }
  ];

  let passedChecks = 0;
  const totalChecks = checks.length;

  for (const check of checks) {
    try {
      const result = await check.fn();
      if (result) {
        passedChecks++;
      }
    } catch (error) {
      console.log(`❌ ${check.name} failed with error:`, error.message);
    }
    console.log('-'.repeat(40));
  }

  console.log('\n📋 HEALTH CHECK SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);
  console.log(`❌ Failed: ${totalChecks - passedChecks}/${totalChecks} checks`);
  
  if (passedChecks === totalChecks) {
    console.log('\n🎉 All health checks passed! Testing infrastructure is ready.');
    console.log('\n📚 Available test commands:');
    console.log('  npm test                 - Run all tests');
    console.log('  npm run test:unit        - Run unit tests only');
    console.log('  npm run test:integration - Run integration tests only');
    console.log('  npm run test:coverage    - Run tests with coverage report');
    console.log('  npm run test:watch       - Run tests in watch mode');
    console.log('  npm run test:health      - Run this health check');
    return process.exit(0);
  } else {
    console.log('\n⚠️  Some health checks failed. Please review and fix the issues above.');
    return process.exit(1);
  }
}

// Check required files exist
const requiredFiles = [
  'index.js',
  'config/database.js',
  'config/firebase.js',
  'config/logger.js',
  'middleware/errorHandler.js',
  'utils/scheduler.js',
  'utils/emailService.js',
  'docs/apiDocumentation.js'
];

console.log('📁 Checking required core files...');
let missingFiles = [];
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
});

// Check required directories
const requiredDirectories = [
  'models',
  'routes',
  'middleware',
  'utils',
  'config',
  '__tests__/unit',
  '__tests__/integration',
  '__tests__/performance'
];

if (missingFiles.length === 0) {
  console.log('\n📂 Checking required directories...');
  let missingDirectories = [];
  requiredDirectories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      console.log(`✅ ${dir}/`);
    } else {
      console.log(`❌ ${dir}/ - MISSING`);
      missingDirectories.push(dir);
    }
  });

  if (missingDirectories.length === 0) {
    console.log('\n🚀 Starting comprehensive health check...');
    runHealthCheck();
  } else {
    console.log(`\n❌ Missing ${missingDirectories.length} required directories`);
    console.log('Please ensure all required directories exist before running tests.');
    process.exit(1);
  }
} else {
  console.log(`\n❌ Missing ${missingFiles.length} required files`);
  console.log('Please ensure all required files exist before running tests.');
  process.exit(1);
}

// Check environment variables
console.log('\n🔐 Checking environment setup...');
require('dotenv').config();

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'FIREBASE_PROJECT_ID',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS'
];

let missingEnvVars = [];
requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}`);
  } else {
    console.log(`❌ ${envVar} - NOT SET`);
    missingEnvVars.push(envVar);
  }
});

// Test basic imports
console.log('\n📦 Testing module imports...');
try {
  require('./config/logger');
  console.log('✅ Logger module');
} catch (error) {
  console.log(`❌ Logger module: ${error.message}`);
}

try {
  require('./middleware/errorHandler');
  console.log('✅ Error handler module');
} catch (error) {
  console.log(`❌ Error handler module: ${error.message}`);
}

try {
  require('./utils/scheduler');
  console.log('✅ Scheduler module');
} catch (error) {
  console.log(`❌ Scheduler module: ${error.message}`);
}

try {
  require('./utils/emailService');
  console.log('✅ Email service module');
} catch (error) {
  console.log(`❌ Email service module: ${error.message}`);
}

// Summary
console.log('\n📊 Health Check Summary:');
if (missingFiles.length === 0 && missingEnvVars.length === 0) {
  console.log('🎉 All checks passed! Backend is ready to run.');
} else {
  console.log('⚠️  Issues found:');
  if (missingFiles.length > 0) {
    console.log(`   Missing files: ${missingFiles.join(', ')}`);
  }
  if (missingEnvVars.length > 0) {
    console.log(`   Missing environment variables: ${missingEnvVars.join(', ')}`);
  }
}

console.log('\n💡 Next steps:');
if (missingEnvVars.length > 0) {
  console.log('   1. Create .env file based on .env.example');
  console.log('   2. Configure MongoDB URI, JWT secret, and Firebase credentials');
}
console.log('   3. Run "npm run dev" to start the server');
console.log('   4. Test API endpoints at http://localhost:3001/api/docs');
