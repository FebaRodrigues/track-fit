// start-server.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Try to load environment variables from multiple locations
console.log('=== Loading Environment Variables ===');

// First try the server .env file
const serverEnvPath = path.resolve(__dirname, '.env');
if (fs.existsSync(serverEnvPath)) {
  console.log(`Loading .env from: ${serverEnvPath}`);
  dotenv.config({ path: serverEnvPath });
} else {
  console.log(`Server .env file not found at: ${serverEnvPath}`);
}

// If MONGO_URI is still not defined, try the root .env file
if (!process.env.MONGO_URI) {
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  if (fs.existsSync(rootEnvPath)) {
    console.log(`Loading .env from: ${rootEnvPath}`);
    dotenv.config({ path: rootEnvPath });
  } else {
    console.log(`Root .env file not found at: ${rootEnvPath}`);
  }
}

// Check for critical environment variables
const criticalVars = ['MONGO_URI', 'STRIPE_SECRET_KEY', 'JWT_SECRET'];
const missingVars = criticalVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('ERROR: The following critical environment variables are missing:');
  missingVars.forEach(varName => console.error(`- ${varName}`));
  console.error('Please check your .env file and try again.');
  process.exit(1);
}

// Determine which server file to run
const serverFile = process.argv[2] === 'index' ? 'index.js' : 'server.js';
console.log(`Starting server using ${serverFile}...`);

// Get the port from environment variables or use default
const port = process.env.PORT || 5050;

// Start the server
const server = spawn('node', [serverFile], {
  env: process.env,
  stdio: 'inherit'
});

console.log(`Server starting on port ${port}`);

// Handle server process events
server.on('error', (error) => {
  console.error('Failed to start server:', error.message);
});

server.on('exit', (code, signal) => {
  if (code) {
    console.error(`Server process exited with code ${code}`);
  } else if (signal) {
    console.error(`Server process was killed with signal ${signal}`);
  } else {
    console.log('Server process exited');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.kill('SIGTERM');
}); 