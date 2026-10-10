const express = require('express');
const router = express.Router();
const { register, login, adminLogin, forgotPassword, verifyOtp, resetPassword } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/admin/login
router.post('/admin/login', adminLogin);

// POST /api/auth/forgot-password  → generates & returns OTP
router.post('/forgot-password', forgotPassword);

// POST /api/auth/verify-otp       → checks OTP is valid (pre-check before password step)
router.post('/verify-otp', verifyOtp);

// POST /api/auth/reset-password   → verifies OTP + updates password
router.post('/reset-password', resetPassword);

module.exports = router;
