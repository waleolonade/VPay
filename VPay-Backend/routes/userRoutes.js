const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, uploadAvatar, changePassword, setPin, getDashboard
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/me', getProfile);
router.get('/dashboard', getDashboard);
router.put('/me', updateProfile);
router.patch('/me/avatar', upload.single('avatar'), uploadAvatar);
router.patch('/me/change-password', changePassword);
router.patch('/me/pin', setPin);

module.exports = router;
