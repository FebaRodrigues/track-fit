// API Login Endpoint
const { getCollection, COLLECTIONS } = require('../utils/database');

// Mock JWT token generator
const generateToken = (user) => {
  // In a real app, use a proper JWT library
  return Buffer.from(JSON.stringify({
    id: user._id.toString(),
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
      console.log('Body already parsed:', typeof req.body);
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
  console.log('===============================');
  console.log('API LOGIN ENDPOINT ACCESSED');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('===============================');

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Handle OPTIONS request - CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request - CORS preflight');
    return res.status(200).end();
  }

  // Handle GET request for health check
  if (req.method === 'GET') {
    console.log('Handling GET request - Health check');
    return res.status(200).json({ 
      status: 'ok',
      message: 'Login endpoint is working',
      endpoint: '/api/users/login',
      methods: ['POST', 'OPTIONS', 'GET']
    });
  }

  // Handle POST request for login
  if (req.method === 'POST') {
    console.log('Handling POST request - Login attempt');
    
    try {
      // Parse request body
      const requestBody = await parseBody(req);
      console.log('Parsed request body:', JSON.stringify(requestBody, null, 2));
      
      // Extract credentials
      const { email, password } = requestBody;
      
      if (!email || !password) {
        console.log('Missing credentials');
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Mock data for testing
      const mockUsers = [
        {
          _id: '1',
          name: 'Demo User',
          email: 'demo@example.com',
          password: 'password123',
          role: 'user'
        }
      ];

      // Use mock data or try to get from database
      let user;
      try {
        const usersCollection = await getCollection(COLLECTIONS.USERS);
        console.log('Connected to users collection');
        user = await usersCollection.findOne({ email, password });
      } catch (dbError) {
        console.error('Database error:', dbError);
        console.log('Falling back to mock data');
        // Fall back to mock data if DB connection fails
        user = mockUsers.find(u => u.email === email && u.password === password);
      }
      
      if (!user) {
        console.log(`User not found for email: ${email}`);
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      console.log(`User found: ${user.name} (${user.email})`);
      
      // Generate a token
      const token = generateToken(user);
      
      return res.status(200).json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ 
        message: 'Internal server error', 
        error: error.message,
        stack: error.stack
      });
    }
  }

  // For any other method
  console.log(`Method ${req.method} not allowed`);
  return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
}; 