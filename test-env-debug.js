#!/usr/bin/env node

// Test script to debug environment variable loading issues
const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Variable Debug Test');
console.log('=====================================\n');

// Check frontend .env.local file
const frontendEnvPath = path.join(__dirname, 'frontend', '.env.local');
console.log('1. Checking frontend .env.local file:');
console.log(`   Path: ${frontendEnvPath}`);

if (fs.existsSync(frontendEnvPath)) {
  console.log('   ✅ File exists');
  const envContent = fs.readFileSync(frontendEnvPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log(`   📝 Found ${lines.length} environment variables:`);
  lines.forEach(line => {
    const [key] = line.split('=');
    console.log(`      - ${key}`);
  });
  
  // Check for Firebase variables specifically
  const firebaseVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
  ];
  
  console.log('\n   🔥 Firebase variables check:');
  firebaseVars.forEach(varName => {
    const found = lines.some(line => line.startsWith(varName + '='));
    console.log(`      ${found ? '✅' : '❌'} ${varName}`);
  });
} else {
  console.log('   ❌ File does not exist');
}

// Check backend .env file
const backendEnvPath = path.join(__dirname, 'backend', '.env');
console.log('\n2. Checking backend .env file:');
console.log(`   Path: ${backendEnvPath}`);

if (fs.existsSync(backendEnvPath)) {
  console.log('   ✅ File exists');
  const envContent = fs.readFileSync(backendEnvPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log(`   📝 Found ${lines.length} environment variables:`);
  lines.forEach(line => {
    const [key] = line.split('=');
    console.log(`      - ${key}`);
  });
} else {
  console.log('   ❌ File does not exist');
}

// Test Next.js configuration
const nextConfigPath = path.join(__dirname, 'frontend', 'next.config.mjs');
console.log('\n3. Checking Next.js configuration:');
console.log(`   Path: ${nextConfigPath}`);

if (fs.existsSync(nextConfigPath)) {
  console.log('   ✅ File exists');
  const configContent = fs.readFileSync(nextConfigPath, 'utf8');
  console.log('   📝 Content preview:');
  console.log(configContent.split('\n').slice(0, 10).map(line => `      ${line}`).join('\n'));
} else {
  console.log('   ❌ File does not exist');
}

// Check for any additional .env files
console.log('\n4. Checking for additional .env files:');
const envFiles = [
  'frontend/.env',
  'frontend/.env.development',
  'frontend/.env.production',
  'backend/.env.local',
  'backend/.env.development',
  'backend/.env.production'
];

envFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n🎯 Recommendations:');
console.log('   1. Ensure all NEXT_PUBLIC_ variables are in frontend/.env.local');
console.log('   2. Restart Next.js dev server after environment changes');
console.log('   3. Check browser console for actual loaded variables');
console.log('   4. Verify Next.js is reading from correct .env file');

console.log('\n✅ Environment debug complete!');
