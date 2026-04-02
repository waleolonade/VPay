const express = require('express');
const router = express.Router();
const { register, login, loginOtp, verifyOtp, verifyAdminOtp, resendOtp, verifyPhone, forgotPassword, resetPassword, refreshToken, logout, getProfile, getPublicProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.get('/profile/:phone', getPublicProfile);
router.post('/login-otp', loginOtp);

router.post('/verify-otp', verifyOtp);
router.post('/verify-admin-otp', verifyAdminOtp);
router.post('/resend-otp', resendOtp);
router.post('/verify-phone', verifyPhone);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);

module.exports = router;
