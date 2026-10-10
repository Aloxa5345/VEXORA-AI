const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

// GET  /api/user/profile
router.get('/profile', getProfile);

// PUT  /api/user/profile
router.put('/profile', updateProfile);

// PUT  /api/user/change-password
router.put('/change-password', changePassword);

module.exports = router;
