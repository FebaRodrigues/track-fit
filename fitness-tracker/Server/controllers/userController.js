// controllers/userController.js
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uploadToCloudinary = require("../utilities/imageUpload");
const { createWelcomeNotification } = require('./notificationController');
const fs = require('fs');
const path = require('path');

// Default profile image URL
const DEFAULT_PROFILE_IMAGE = "https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/gfo0vamcfcurte2gc4jk.jpg";

// Function to save image locally as a fallback when Cloudinary fails
const saveImageLocally = async (file) => {
    try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generate a unique filename
        const filename = `${Date.now()}-${path.basename(file)}`;
        const destPath = path.join(uploadsDir, filename);
        
        // Copy the file
        fs.copyFileSync(file, destPath);
        
        // Return the relative URL
        return `/uploads/${filename}`;
    } catch (error) {
        console.error('Error saving image locally:', error);
        return null;
    }
};

// Register a new user
exports.register = async (req, res) => {
    try {
        console.log('Registration request received:', req.body);
        console.log('File received:', req.file);
        
        const { name, email, password } = req.body;
        let image = req.file ? req.file.path : null;

        // Validate required fields
        if (!name || !email || !password) {
            console.log('Missing required fields');
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: "User with this email already exists" });
        }

        let imageUrl = null;
        if (image) {
            try {
                console.log('Uploading image to Cloudinary:', image);
                
                // Try Cloudinary upload first
                const cloudinaryRes = await uploadToCloudinary(image);
                
                if (cloudinaryRes && cloudinaryRes.secure_url) {
                    // Cloudinary upload successful
                    imageUrl = cloudinaryRes.secure_url;
                    console.log('Image uploaded to Cloudinary:', imageUrl);
                } else {
                    // Cloudinary upload failed, try local fallback
                    console.log('Cloudinary upload failed, trying local fallback');
                    imageUrl = await saveImageLocally(image);
                    
                    if (imageUrl) {
                        console.log('Image saved locally:', imageUrl);
                    } else {
                        console.log('Failed to save image locally');
                        // Continue registration with default image
                    }
                }
            } catch (uploadError) {
                console.error('Image upload error:', uploadError);
                
                // Try local fallback on error
                try {
                    imageUrl = await saveImageLocally(image);
                    if (imageUrl) {
                        console.log('Image saved locally after error:', imageUrl);
                    } else {
                        console.log('Failed to save image locally');
                        // Continue registration with default image
                    }
                } catch (localError) {
                    console.error('Local fallback error:', localError);
                    // Continue registration with default image
                }
            }
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with default role
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            image: imageUrl || DEFAULT_PROFILE_IMAGE,
            role: 'user',
            registrationDate: new Date()
        });

        await newUser.save();
        console.log('User registered successfully:', newUser._id);
        
        // Create a welcome notification for the new user
        await createWelcomeNotification(newUser._id);
        
        // Create JWT token for immediate login
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: "User registered successfully",
            userId: newUser._id,
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                image: newUser.image
            }
        });
    } catch (error) {
        console.error("Error in register:", error);
        res.status(500).json({ 
            message: "Registration failed",
            error: error.message || "Internal server error"
        });
    }
};

// Login user
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Check if user is suspended
        if (user.isSuspended) {
            return res.status(403).json({ 
                message: 'Your account has been suspended. Please contact support for assistance.',
                isSuspended: true
            });
        }
        
        user.lastLogin = new Date(); // Update lastLogin
        await user.save(); // Save the updated user document
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ 
            message: 'Login successful', 
            token, 
            user: { id: user._id, name: user.name, email: user.email, role: user.role, image: user.image } 
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: error.message });
    }
};



// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Get a user by ID or current user
exports.getUserById = async (req, res) => {
    const userId = req.user.id; // Use the ID from the authenticated user

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User  not found' });

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: error.message });
    }
};


// Update a user or current user
exports.updateUser = async (req, res) => {
    const userId = req.user.id;
    const updates = {};

    try {
        console.log("==== UPDATE USER REQUEST ====");
        console.log("User ID:", userId);
        console.log("Request body:", JSON.stringify(req.body, null, 2));
        console.log("Request file:", req.file ? req.file.path : "No file");

        // Extract fields from req.body
        if (req.body.name) {
            updates.name = req.body.name;
            console.log("Setting name to:", updates.name);
        }
        
        if (req.body.email) {
            updates.email = req.body.email;
            console.log("Setting email to:", updates.email);
        }
        
        // Properly handle numeric values
        if (req.body.age !== undefined && req.body.age !== '') {
            updates.age = Number(req.body.age);
            console.log("Parsed age:", updates.age, "from input:", req.body.age);
            // Check if conversion resulted in NaN
            if (isNaN(updates.age)) {
                console.log("Age is NaN, setting to undefined");
                updates.age = undefined;
            }
        } else {
            console.log("Age not provided or empty string");
        }
        
        if (req.body.height !== undefined && req.body.height !== '') {
            updates.height = Number(req.body.height);
            console.log("Parsed height:", updates.height, "from input:", req.body.height);
            // Check if conversion resulted in NaN
            if (isNaN(updates.height)) {
                console.log("Height is NaN, setting to undefined");
                updates.height = undefined;
            }
        } else {
            console.log("Height not provided or empty string");
        }
        
        if (req.body.weight !== undefined && req.body.weight !== '') {
            updates.weight = Number(req.body.weight);
            console.log("Parsed weight:", updates.weight, "from input:", req.body.weight);
            // Check if conversion resulted in NaN
            if (isNaN(updates.weight)) {
                console.log("Weight is NaN, setting to undefined");
                updates.weight = undefined;
            }
        } else {
            console.log("Weight not provided or empty string");
        }
        
        if (req.body.gender) {
            updates.gender = req.body.gender;
            console.log("Setting gender to:", updates.gender);
        }
        
        // Handle goals
        if (req.body.goals) {
            try {
                updates.goals = JSON.parse(req.body.goals);
                console.log("Parsed goals:", updates.goals);
            } catch (e) {
                console.error("Error parsing goals:", e);
                // If parsing fails, try to use it as is
                updates.goals = req.body.goals;
                console.log("Using goals as is:", updates.goals);
            }
        }

        // Handle image upload
        if (req.file) {
            console.log("Processing image upload:", req.file.path);
            try {
                // Try Cloudinary upload first
                const cloudinaryRes = await uploadToCloudinary(req.file.path);
                
                if (cloudinaryRes && cloudinaryRes.secure_url) {
                    // Cloudinary upload successful
                    updates.image = cloudinaryRes.secure_url;
                    console.log("Image uploaded to Cloudinary:", updates.image);
                } else {
                    // Cloudinary upload failed, try local fallback
                    console.log("Cloudinary upload failed, trying local fallback");
                    const localImageUrl = await saveImageLocally(req.file.path);
                    
                    if (localImageUrl) {
                        updates.image = localImageUrl;
                        console.log("Image saved locally:", localImageUrl);
                    } else {
                        return res.status(500).json({ 
                            error: "Failed to save image. Please try again later." 
                        });
                    }
                }
            } catch (uploadError) {
                console.error("Image upload error:", uploadError);
                
                // Try local fallback on error
                try {
                    const localImageUrl = await saveImageLocally(req.file.path);
                    if (localImageUrl) {
                        updates.image = localImageUrl;
                        console.log("Image saved locally after error:", localImageUrl);
                    } else {
                        return res.status(500).json({ 
                            error: "Failed to save image. Please try again later." 
                        });
                    }
                } catch (localError) {
                    console.error("Local fallback error:", localError);
                    return res.status(500).json({ 
                        error: "Error saving image: " + (uploadError.message || "Unknown error") 
                    });
                }
            }
        }

        console.log("Final updates to apply:", JSON.stringify(updates, null, 2));

        // Find the user before update to log the changes
        const userBefore = await User.findById(userId);
        console.log("User before update:", JSON.stringify(userBefore, null, 2));

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!user) {
            console.log("User not found with ID:", userId);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log("User after update:", JSON.stringify(user, null, 2));
        res.status(200).json(user);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: error.message || "An unknown error occurred" });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.getConfirmedAppointments = async (req, res) => {
    const { userId } = req.params;
    try {
        const appointments = await Appointment.find({ userId, status: 'confirmed' }).populate('trainerId');
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update specific user fields
exports.updateUserFields = async (req, res) => {
    const userId = req.user.id;
    
    try {
        console.log("==== UPDATE USER FIELDS REQUEST ====");
        console.log("User ID:", userId);
        console.log("Request body:", JSON.stringify(req.body, null, 2));
        
        // Get the current user data
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            console.log("User not found with ID:", userId);
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log("Current user data:", JSON.stringify(currentUser, null, 2));
        
        // Extract fields from req.body
        const updates = {};
        
        // Handle each field explicitly
        if ('name' in req.body) {
            updates.name = req.body.name;
            console.log("Setting name to:", updates.name);
        }
        
        if ('email' in req.body) {
            updates.email = req.body.email;
            console.log("Setting email to:", updates.email);
        }
        
        // Handle numeric values explicitly
        if ('age' in req.body) {
            // Convert to number or set to null if empty
            updates.age = req.body.age === '' ? null : Number(req.body.age);
            console.log("Setting age to:", updates.age);
        }
        
        if ('height' in req.body) {
            // Convert to number or set to null if empty
            updates.height = req.body.height === '' ? null : Number(req.body.height);
            console.log("Setting height to:", updates.height);
        }
        
        if ('weight' in req.body) {
            // Convert to number or set to null if empty
            updates.weight = req.body.weight === '' ? null : Number(req.body.weight);
            console.log("Setting weight to:", updates.weight);
        }
        
        if ('gender' in req.body) {
            updates.gender = req.body.gender || null;
            console.log("Setting gender to:", updates.gender);
        }
        
        console.log("Final updates to apply:", JSON.stringify(updates, null, 2));
        
        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true }
        );
        
        console.log("User after update:", JSON.stringify(updatedUser, null, 2));
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating user fields:", error);
        res.status(500).json({ error: error.message });
    }
};