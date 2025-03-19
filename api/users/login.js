// API Login Endpoint

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
    
    console.log('Login request received', requestBody);
    
    // Extract credentials from request body
    const { email, password } = requestBody;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find the user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate a token
    const token = generateToken(user);
    
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 