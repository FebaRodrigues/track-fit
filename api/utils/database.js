// MongoDB Connection Utility
const { MongoClient } = require('mongodb');

// MongoDB connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://admin:admin@cluster0.vzk8sdw.mongodb.net/test?retryWrites=true&w=majority';

// Database and collection names
const DB_NAME = 'test'; // Using the 'test' database where your data resides
const COLLECTIONS = {
  USERS: 'users',
  TRAINERS: 'trainers',
  ADMINS: 'admins',
  MEMBERSHIPS: 'memberships',
  PAYMENTS: 'payments',
  WORKOUTS: 'workouts'
};

// MongoDB client instance
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // If no connection, create a new one
  if (!cachedClient) {
    console.log('Creating new MongoDB client connection');
    cachedClient = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  // Connect to the MongoDB server
  if (!cachedClient.isConnected) {
    console.log('Connecting to MongoDB server');
    await cachedClient.connect();
    console.log('Connected to MongoDB server');
  }

  // Get reference to the database
  cachedDb = cachedClient.db(DB_NAME);
  console.log(`Connected to database: ${DB_NAME}`);

  return { client: cachedClient, db: cachedDb };
}

// Function to get a collection from the database
async function getCollection(collectionName) {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

module.exports = {
  connectToDatabase,
  getCollection,
  COLLECTIONS
}; 