// routes/users.js
const express = require('express');
const upload = require('../middleware/multer');
const {
    register,
    login,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getConfirmedAppointments,
    updateUserFields  
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/register', upload.single('image'), register);
router.post('/login', login);
router.get('/', auth(['admin']), getAllUsers);
router.get('/profile', auth(['user']), getUserById);
router.get('/:userId', auth(['admin', 'trainer']), getUserById);
router.put('/profile', auth(['user']), upload.single('image'), updateUser); 
router.put('/update-fields', auth(['user']), updateUserFields);
router.delete('/:userId', auth(['admin']), deleteUser);
router.get('/:userId/confirmed-appointments', auth(['user']), getConfirmedAppointments);

module.exports = router;