const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

console.log('Starting Fitness Management System...');

// Determine the command to use based on the OS
const isWindows = os.platform() === 'win32';
const command = isWindows ? 'cmd.exe' : 'bash';
const args = isWindows ? ['/c'] : ['-c'];

// Create a .env file for the server if it doesn't exist
const envPath = path.join(__dirname, 'fitness-tracker', 'Server', '.env');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file for the server...');
  const envContent = `
PORT=8001
MONGODB_URI=mongodb+srv://your-mongodb-uri
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
SESSION_SECRET=your-session-secret
`;
  fs.writeFileSync(envPath, envContent);
  console.log('.env file created. Please update it with your actual credentials.');
}

// Start the server
console.log('Starting Server...');
const serverProcess = spawn(
  command,
  [...args, 'cd fitness-tracker/Server && node index.js'],
  {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  }
);

// Start the client
console.log('Starting Client...');
const clientProcess = spawn(
  command,
  [...args, 'cd fitness-tracker/Client/gym && npm run dev'],
  {
    stdio: 'inherit',
    shell: true
  }
);

console.log('Both server and client should be starting now.');
console.log('Server is running at http://localhost:8001');
console.log('Client is running at http://localhost:5173');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
});

// Handle child process errors
serverProcess.on('error', (error) => {
  console.error('Server process error:', error);
});

clientProcess.on('error', (error) => {
  console.error('Client process error:', error);
});

// Handle child process exit
serverProcess.on('exit', (code) => {
  console.log(`Server process exited with code ${code}`);
});

clientProcess.on('exit', (code) => {
  console.log(`Client process exited with code ${code}`);
}); 