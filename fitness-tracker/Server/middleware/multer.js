// middleware/multer.js
const multer = require("multer");
const path = require("path");
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log("Created uploads directory:", uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log("Multer saving to:", uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + path.extname(file.originalname);
        console.log("Multer filename:", filename);
        cb(null, filename);
    }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

module.exports = upload;

// // middleware/multer.js
// const multer = require("multer");
// const path = require("path");

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         console.log("Multer saving to: uploads/");
//         cb(null, "uploads/"); // Ensure this folder exists
//     },
//     filename: (req, file, cb) => {
//         const filename = Date.now() + path.extname(file.originalname);
//         console.log("Multer filename:", filename);
//         cb(null, filename);
//     },
// });

// const upload = multer({ storage });
// module.exports = upload;