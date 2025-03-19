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
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse request body
    let requestBody = {};
    
    try {
      // If req.body is a string, parse it as JSON
      if (typeof req.body === 'string') {
        requestBody = JSON.parse(req.body);
      } else if (req.body) {
        // If req.body exists and is an object, use it directly
        requestBody = req.body;
      } else if (req.rawBody) {
        // If req.rawBody exists, parse it as JSON
        requestBody = JSON.parse(req.rawBody);
      }
    } catch (e) {
      console.error('Error parsing request body:', e);
      return res.status(400).json({ message: 'Invalid request body' });
    }
    
    console.log('Registration request received', requestBody);
    
    // Extract user data from request body
    const userData = requestBody;
    
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