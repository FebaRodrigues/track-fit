// API Trainer Register Endpoint
const { getCollection, COLLECTIONS } = require('../utils/database');
const { ObjectId } = require('mongodb');

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
    console.log('Received OPTIONS request for trainer register endpoint');
    return res.status(200).end();
  }

  // Handle GET request for health check
  if (req.method === 'GET') {
    console.log('Received GET request for trainer register endpoint (health check)');
    return res.status(200).json({ 
      status: 'ok',
      message: 'Trainer register endpoint is working',
      endpoint: '/api/trainers/register',
      methods: ['POST', 'OPTIONS', 'GET']
    });
  }

  // Only allow POST requests for actual registration
  if (req.method !== 'POST') {
    console.log(`Received unsupported method ${req.method} for trainer register endpoint`);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Trainer registration request received');
    console.log('Request method:', req.method);
    console.log('Request headers:', req.headers);
    
    // Parse request body
    const trainerData = await parseBody(req);
    console.log('Parsed request body:', trainerData);
    
    if (!trainerData.email || !trainerData.password || !trainerData.name) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Get the trainers collection from MongoDB
    const trainersCollection = await getCollection(COLLECTIONS.TRAINERS);
    console.log('Connected to trainers collection');

    // Check if email already exists
    const existingTrainer = await trainersCollection.findOne({ email: trainerData.email });
    if (existingTrainer) {
      console.log(`Email already exists: ${trainerData.email}`);
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Create a new trainer document
    const newTrainer = {
      _id: new ObjectId(),
      name: trainerData.name,
      email: trainerData.email,
      password: trainerData.password, // Note: In a real app, you'd hash this password
      role: 'trainer',
      specialization: trainerData.specialization || 'General Fitness',
      experience: trainerData.experience || '0 years',
      createdAt: new Date()
    };
    
    // Insert the new trainer into the database
    const result = await trainersCollection.insertOne(newTrainer);
    console.log(`New trainer created: ${newTrainer.name} (${newTrainer.email})`);
    
    // Generate a token
    const token = generateToken(newTrainer);
    
    return res.status(201).json({
      token,
      trainer: {
        id: newTrainer._id.toString(),
        name: newTrainer.name,
        email: newTrainer.email,
        role: newTrainer.role,
        specialization: newTrainer.specialization,
        experience: newTrainer.experience
      }
    });
  } catch (error) {
    console.error('Trainer registration error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}; 