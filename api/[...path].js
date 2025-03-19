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

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the path from the request
  const path = req.query.path || [];
  const apiPath = path.join('/');
  
  console.log(`Handling API request: ${req.method} ${apiPath}`);

  try {
    // Health check endpoint
    if (apiPath === 'health') {
      return res.status(200).json({ status: 'ok', message: 'API is healthy' });
    }
    
    // Login endpoint
    if (apiPath === 'users/login' && req.method === 'POST') {
      const { email, password } = req.body;
      
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
    }
    
    // Register endpoint
    if (apiPath === 'users/register' && req.method === 'POST') {
      const userData = req.body;
      
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
    }
    
    // For any other endpoint, return a 404 for now
    return res.status(404).json({ message: 'Endpoint not implemented yet' });
  } catch (error) {
    console.error('Error in API handler:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}; 