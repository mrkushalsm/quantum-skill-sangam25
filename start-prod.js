#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Armed Forces Welfare Management System (Production)...\n');

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

// Function to run command and wait for completion
function runCommand(command, args, options, name) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 ${name}...`);
    
    const process = spawn(command, args, {
      ...options,
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(`[${name}] ${text.trim()}`);
    });

    process.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      if (!text.includes('warning')) {
        console.error(`[${name} ERROR] ${text.trim()}`);
      }
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${name} completed successfully`);
        resolve(output);
      } else {
        console.error(`❌ ${name} failed with code ${code}`);
        reject(new Error(`${name} failed: ${errorOutput}`));
      }
    });

    process.on('error', (err) => {
      console.error(`❌ Failed to run ${name}:`, err.message);
      reject(err);
    });
  });
}

// Function to spawn long-running process
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

async function buildAndStart() {
  try {
    // Install backend dependencies
    await runCommand('npm', ['install'], { cwd: backendPath }, 'Installing backend dependencies');

    // Install frontend dependencies
    await runCommand('npm', ['install'], { cwd: frontendPath }, 'Installing frontend dependencies');

    // Build frontend
    await runCommand('npm', ['run', 'build'], { cwd: frontendPath }, 'Building frontend');

    // Start backend in production mode
    console.log('🔧 Starting backend server in production mode...');
    const backendProcess = spawnProcess(
      'npm',
      ['start'],
      { 
        cwd: backendPath,
        env: { ...process.env, NODE_ENV: 'production' }
      },
      'BACKEND'
    );

    // Start frontend in production mode
    setTimeout(() => {
      console.log('🎨 Starting frontend server in production mode...');
      const frontendProcess = spawnProcess(
        'npm',
        ['start'],
        { 
          cwd: frontendPath,
          env: { ...process.env, NODE_ENV: 'production' }
        },
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

    }, 2000);

    console.log('\n📋 Production Services Information:');
    console.log('🔗 Backend API: http://localhost:3001');
    console.log('🌐 Frontend App: http://localhost:3000');
    console.log('📊 API Health: http://localhost:3001/health');
    console.log('📚 API Docs: http://localhost:3001/api/docs');
    console.log('\n💡 Press Ctrl+C to stop all services\n');

  } catch (error) {
    console.error('❌ Build and start failed:', error.message);
    process.exit(1);
  }
}

buildAndStart();
