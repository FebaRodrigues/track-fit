// API Register Endpoint

// Mock database for users - should match the one in login.js
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

// Helper to parse request body
const parseBody = async (req) => {
  return new Promise((resolve) => {
    let data = '';
    
    // If body is already parsed by Vercel
    if (req.body) {
      return resolve(
        typeof req.body === 'string' 
          ? JSON.parse(req.body) 
          : req.body
      );
    }
    
    req.on('data', chunk => {
      data += chunk;
    });
    
    req.on('end', () => {
      try {
        if (data) {
          resolve(JSON.parse(data));
        } else {
          resolve({});
        }
      } catch (e) {
        console.error('Error parsing request body:', e);
        resolve({});
      }
    });
  });
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('Received OPTIONS request for register endpoint');
    return res.status(200).end();
  }

  // Handle GET request for health check
  if (req.method === 'GET') {
    console.log('Received GET request for register endpoint (health check)');
    return res.status(200).json({ 
      status: 'ok',
      message: 'Register endpoint is working',
      endpoint: '/api/users/register',
      methods: ['POST', 'OPTIONS', 'GET']
    });
  }

  // Only allow POST requests for actual registration
  if (req.method !== 'POST') {
    console.log(`Received unsupported method ${req.method} for register endpoint`);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Registration request received');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    
    // Parse request body
    const userData = await parseBody(req);
    console.log('Parsed request body:', userData);
    
    if (!userData.email || !userData.password || !userData.name) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if email already exists
    if (users.some(u => u.email === userData.email)) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Create a new user
    const newUser = {
      id: users.length + 1,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: 'user'
    };
    
    // Add the user to the mock database
    users.push(newUser);
    
    // Generate a token
    const token = generateToken(newUser);
    
    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 