// API Trainer Login Endpoint
const { getCollection, COLLECTIONS } = require('../utils/database');

// Mock JWT token generator
const generateToken = (trainer) => {
  // In a real app, use a proper JWT library
  return Buffer.from(JSON.stringify({
    id: trainer._id.toString(),
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

    // Get the trainers collection from MongoDB
    const trainersCollection = await getCollection(COLLECTIONS.TRAINERS);
    console.log('Connected to trainers collection');

    // Find the trainer by email and password
    const trainer = await trainersCollection.findOne({ 
      email,
      password // Note: In a real app, you'd compare hashed passwords
    });
    
    if (!trainer) {
      console.log(`Trainer not found for email: ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    console.log(`Trainer found: ${trainer.name} (${trainer.email})`);
    
    // Generate a token
    const token = generateToken(trainer);
    
    return res.status(200).json({
      token,
      trainer: {
        id: trainer._id.toString(),
        name: trainer.name,
        email: trainer.email,
        role: trainer.role,
        specialization: trainer.specialization || 'General Fitness',
        experience: trainer.experience || '0 years'
      }
    });
  } catch (error) {
    console.error('Trainer login error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}; 