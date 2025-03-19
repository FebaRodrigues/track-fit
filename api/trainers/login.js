// API Trainer Login Endpoint

// Mock database for trainers
const trainers = [
  {
    id: 1,
    name: 'Demo Trainer',
    email: 'trainer@example.com',
    password: 'password123',
    role: 'trainer',
    specialization: 'Strength Training',
    experience: '5 years'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    role: 'trainer',
    specialization: 'Yoga',
    experience: '7 years'
  }
];

// Mock JWT token generator
const generateToken = (trainer) => {
  // In a real app, use a proper JWT library
  return Buffer.from(JSON.stringify({
    id: trainer.id,
    email: trainer.email,
    role: trainer.role,
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
    console.log('Received OPTIONS request for trainer login endpoint');
    return res.status(200).end();
  }

  // Handle GET request for health check
  if (req.method === 'GET') {
    console.log('Received GET request for trainer login endpoint (health check)');
    return res.status(200).json({ 
      status: 'ok',
      message: 'Trainer login endpoint is working',
      endpoint: '/api/trainers/login',
      methods: ['POST', 'OPTIONS', 'GET']
    });
  }

  // Only allow POST requests for actual login
  if (req.method !== 'POST') {
    console.log(`Received unsupported method ${req.method} for trainer login endpoint`);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Trainer login request received');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    
    // Parse request body
    const requestBody = await parseBody(req);
    console.log('Parsed request body:', requestBody);
    
    // Extract credentials
    const { email, password } = requestBody;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find the trainer
    const trainer = trainers.find(t => t.email === email && t.password === password);
    
    if (!trainer) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate a token
    const token = generateToken(trainer);
    
    return res.status(200).json({
      token,
      trainer: {
        id: trainer.id,
        name: trainer.name,
        email: trainer.email,
        role: trainer.role,
        specialization: trainer.specialization,
        experience: trainer.experience
      }
    });
  } catch (error) {
    console.error('Trainer login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}; 