#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Armed Forces Welfare Management System...\n');

// Check if we're in the correct directory
const projectRoot = path.resolve(__dirname);
const backendPath = path.join(projectRoot, 'backend');
const frontendPath = path.join(projectRoot, 'frontend');

// Verify directories exist
if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend directory not found at:', backendPath);
  process.exit(1);
}

if (!fs.existsSync(frontendPath)) {
  console.error('❌ Frontend directory not found at:', frontendPath);
  process.exit(1);
}

// Function to spawn process with proper error handling
function spawnProcess(command, args, options, name) {
  const process = spawn(command, args, {
    ...options,
    stdio: 'pipe',
    shell: true
  });

  process.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[${name}] ${output}`);
    }
  });

  process.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('warning')) {
      console.error(`[${name} ERROR] ${output}`);
    }
  });

  process.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ ${name} process exited with code ${code}`);
    } else {
      console.log(`✅ ${name} process completed successfully`);
    }
  });

  process.on('error', (err) => {
    console.error(`❌ Failed to start ${name}:`, err.message);
  });

  return process;
}

// Start backend server
console.log('🔧 Starting backend server...');
const backendProcess = spawnProcess(
  'npm',
  ['run', 'dev'],
  { cwd: backendPath },
  'BACKEND'
);

// Wait a bit for backend to start, then start frontend
setTimeout(() => {
  console.log('🎨 Starting frontend development server...');
  const frontendProcess = spawnProcess(
    'npm',
    ['run', 'dev'],
    { cwd: frontendPath },
    'FRONTEND'
  );

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    
    backendProcess.kill('SIGTERM');
    frontendProcess.kill('SIGTERM');
    
    setTimeout(() => {
      backendProcess.kill('SIGKILL');
      frontendProcess.kill('SIGKILL');
      process.exit(0);
    }, 5000);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down servers...');
    backendProcess.kill('SIGTERM');
    frontendProcess.kill('SIGTERM');
    process.exit(0);
  });

}, 3000);

console.log('\n📋 Services Information:');
console.log('🔗 Backend API: http://localhost:3001');
console.log('🌐 Frontend App: http://localhost:3000');
console.log('📊 API Health: http://localhost:3001/health');
console.log('📚 API Docs: http://localhost:3001/api/docs');
console.log('\n💡 Press Ctrl+C to stop all services\n');
