const mongoose = require('mongoose');

// Hardcode the MongoDB URI
const MONGO_URI = 'mongodb+srv://febarodrigues88:nhPqFzat4hq2crm1@cluster0.mvvdq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define schemas
const spaServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: "https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/spa-default.jpg" },
});

const spaBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SpaService', required: true },
  serviceName: { type: String, default: 'Unknown Service' },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'], 
    default: 'Pending' 
  },
  isFreeSession: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create models
const SpaService = mongoose.model('SpaService', spaServiceSchema);
const SpaBooking = mongoose.model('SpaBooking', spaBookingSchema);

const updateBookings = async () => {
  try {
    console.log('Starting to update SPA bookings...');
    
    // Get all services for reference
    const services = await SpaService.find();
    console.log(`Found ${services.length} services`);
    
    // Create an array of service names for each booking
    const serviceNames = [
      { name: "Swedish Massage", status: ["Pending", "Cancelled"] },
      { name: "Deep Tissue Massage", status: ["Confirmed", "Completed"] },
      { name: "Hot Stone Massage", status: ["Cancelled"] },
      { name: "Sports Massage", status: ["Pending"] },
      { name: "Aromatherapy Massage", status: ["Cancelled"] },
      { name: "Reflexology", status: ["Confirmed"] }
    ];
    
    let updatedCount = 0;
    
    // Update all bookings with random service names based on status
    for (const service of serviceNames) {
      const result = await SpaBooking.updateMany(
        { status: { $in: service.status }, serviceName: { $exists: false } },
        { $set: { serviceName: service.name } }
      );
      
      console.log(`Updated ${result.modifiedCount} bookings with service name: ${service.name}`);
      updatedCount += result.modifiedCount;
    }
    
    console.log(`Updated ${updatedCount} bookings with service names`);
    console.log('Migration completed successfully');
    
    // Close the connection
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating bookings:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the migration
updateBookings(); 