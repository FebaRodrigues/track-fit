// Simple API handler for Vercel

// Mock database for users
const users = [
  {
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'password123',
    role: 'user'
  },
  {
    id: 2,
    name: 'Demo Trainer',
    email: 'trainer@example.com',
    password: 'password123',
    role: 'trainer'
  },
  {
    id: 3,
    name: 'Demo Admin',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  }
];

// Mock JWT token generator
const generateToken = (user) => {
  // In a real app, use a proper JWT library
  return Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 86400000 // 24 hours
  })).toString('base64');
};

// Catch-all API handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get the path from the URL
  const path = req.url.split('/').filter(Boolean);
  
  console.log('Catch-all API handler received request:');
  console.log('URL:', req.url);
  console.log('Method:', req.method);
  console.log('Path segments:', path);

  // Return basic information for any unhandled routes
  return res.status(200).json({
    message: 'API catchall handler',
    path: req.url,
    method: req.method,
    availableRoutes: [
      '/api/health',
      '/api/users/login',
      '/api/users/register',
      '/api/trainers/login',
      '/api/trainers/register',
      '/api/admin/login'
    ]
  });
}; 