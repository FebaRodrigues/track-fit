// index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

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

// Connect to MongoDB
const connectDB = require('./config/db');
connectDB();

// Validate critical environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY is not defined in .env file');
  // Don't use a dummy key in production - this will cause issues with real payments
  if (process.env.NODE_ENV !== 'production') {
    console.warn('Using a dummy Stripe key for development. Payments will not work!');
    process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
  }
}

if (!process.env.CLIENT_URL) {
  console.error('Warning: CLIENT_URL is not defined in .env, using default');
  process.env.CLIENT_URL = 'http://localhost:5173';
}

// Initialize Stripe with the secret key
let stripe;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16' // Specify the API version
  });
  console.log('Stripe initialized successfully with key:', process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...');
} catch (error) {
  console.error('Failed to initialize Stripe:', error.message);
}

const app = express();

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Parse raw body for Stripe webhooks
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Parse JSON body for other routes
app.use(express.json());

// Configure CORS
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173', 
      'http://localhost:5174', 
      'http://localhost:5175', 
      'http://localhost:5176', 
      'http://localhost:5177',
      'http://localhost:5178',
      'http://localhost:5179',
      'http://localhost:5180'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not allowed by CORS`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add a health endpoint at the beginning of the routes
app.get('/api/health', (req, res) => {
    // Get the port from the server address
    const port = 5050;
    res.status(200).json({ status: 'ok', port: port, serverTime: new Date().toISOString() });
});

// Add a fallback route for the root path
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Fitness Management System API is running', port: 5050 });
});

// Routes
const userRoutes = require('./routes/users');
const trainerRoutes = require('./routes/trainerRoutes');
const adminRoutes = require('./routes/adminRoutes2');
const workoutRoutes = require('./routes/workouts');
const nutritionRoutes = require('./routes/nutrition');
const membershipRoutes = require('./routes/memberships');
const paymentRoutes = require('./routes/payments');
const appointmentRoutes = require('./routes/appointments');
const goalRoutes = require('./routes/goals');
const healthRoutes = require('./routes/healthRoutes');
const notificationRoutes = require('./routes/notifications');
const announcementRoutes = require('./routes/announcements');
const reportRoutes = require('./routes/reports');
const workoutProgramRoutes = require('./routes/workout-programs');
const reminderRoutes = require('./routes/reminders');
const workoutLogRoutes = require('./routes/workoutLogs');
const nutritionPlanRoutes = require('./routes/nutritionPlans');
const analyticsRoutes = require('./routes/analytics');
const progressReportRoutes = require('./routes/progressReports');
const trainerPaymentRoutes = require('./routes/trainerPayments');
// Add food database and recipe routes
const foodDatabaseRoutes = require('./routes/foodDatabase');
const recipeRoutes = require('./routes/recipes');
// Add SPA routes
const spaRoutes = require('./routes/spa');

console.log('All routes loaded successfully');

// API routes
app.use('/api/users', userRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/workout-programs', workoutProgramRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/workout-logs', workoutLogRoutes);
app.use('/api/nutrition-plans', nutritionPlanRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/progress-reports', progressReportRoutes);
app.use('/api/trainer-payments', trainerPaymentRoutes);
// Add food database and recipe routes
app.use('/api/food-database', foodDatabaseRoutes);
app.use('/api/recipes', recipeRoutes);
// Add SPA routes
app.use('/api/spa', spaRoutes);

console.log('All routes registered successfully');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Update the server startup code to properly handle port conflicts
const startServer = (port, maxAttempts = 20) => {
  // Use port 5050 as requested
  port = 5050;
  console.log(`Using port 5050 as requested`);
  
  const server = app.listen(port)
    .on('listening', () => {
      console.log(`Server running on port ${port}`);
      console.log(`Client URL: ${process.env.CLIENT_URL}`);
      
      // Save the port to files that the client can read
      try {
        const fs = require('fs');
        const path = require('path');
        
        // Save to server directory
        const serverPortFilePath = path.join(__dirname, '..', 'current-port.txt');
        fs.writeFileSync(serverPortFilePath, port.toString());
        console.log(`Port ${port} saved to ${serverPortFilePath}`);
        
        // Save to client public directory if it exists
        const clientPublicPath = path.join(__dirname, '..', 'Client', 'gym', 'public', 'current-port.txt');
        try {
          fs.writeFileSync(clientPublicPath, port.toString());
          console.log(`Port ${port} saved to client public directory`);
        } catch (clientErr) {
          console.error('Failed to save port to client public directory:', clientErr);
        }
      } catch (err) {
        console.error('Failed to save port to file:', err);
      }
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Please free up this port and try again.`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
    
  return server;
};

// Start the server
const PORT = process.env.PORT || 5050;
try {
  startServer(PORT);
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}