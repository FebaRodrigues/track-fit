// Root index.js - redirects to the actual server
console.log('Starting from root index.js');
console.log('Redirecting to fitness-tracker/Server/index.js');

// Check if the .env file exists in the server directory
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, 'fitness-tracker', 'Server', '.env');

if (!fs.existsSync(envPath)) {
  console.log('Creating .env file for the server...');
  const envContent = `
PORT=7001
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

// Simply require the actual server file
try {
  require('./fitness-tracker/Server/index.js');
} catch (error) {
  console.error('Error starting server:', error.message);
  process.exit(1);
} 