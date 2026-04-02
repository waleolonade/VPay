const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const upload = require('../middleware/upload');
const logger = require('../utils/logger');

// @desc    Get current user profile
// @route   GET /api/v1/users/me
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const wallet = await Wallet.findOne({ user: req.user.id });
    const walletData = wallet ? { balance: wallet.balance, accountNumber: wallet.accountNumber } : null;

    res.status(200).json({ success: true, data: { user, wallet: walletData } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/users/me
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'firstName', 'lastName', 'dateOfBirth', 'gender', 'address',
      'addressStreet', 'addressCity', 'addressState', 'addressCountry',
      'bvn', 'nin',
      'pushEnabled', 'smsEnabled', 'promoEnabled', 'isBiometricEnabled',
      'dailyTransferLimit', 'dailyWithdrawalLimit', 'accountFrozen'
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Profile updated', data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload avatar
// @route   POST /api/v1/users/avatar
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const user = await User.findByIdAndUpdate(req.user.id, { avatar: req.file.path }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'Avatar updated', data: { avatar: user.avatar || req.file.path } });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/v1/users/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    await User.update(req.user.id, { password: newPassword });
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Set/Change transaction PIN
// @route   PUT /api/v1/users/pin
const setPin = async (req, res, next) => {
  try {
    const { pin } = req.body;
    await User.update(req.user.id, { pin });
    res.status(200).json({ success: true, message: 'Transaction PIN set successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard overview
// @route   GET /api/v1/users/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const wallet = await Wallet.findOne({ user: req.user.id, walletType: 'personal' });
    const transactions = await Transaction.find({ user: req.user.id }, { limit: 5 });
    
    // Get unread notification count
    const unreadNotifications = await Notification.countDocuments({ user: req.user.id, isRead: false });

    res.status(200).json({
      success: true,
      data: {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          tier: user.kycLevel || 1,
          avatar: user.avatar,
          phoneNumber: user.phoneNumber
        },
        balance: wallet ? wallet.balance : 0,
        accountNumber: wallet ? wallet.accountNumber : 'N/A',
        unreadCount: unreadNotifications || 0,
        recentTransactions: transactions || [],
        suggestions: [
          { id: '1', text: 'Save for your next vacation', type: 'savings', icon: 'wallet-outline' },
          { id: '2', text: 'Top up your airtime', type: 'utility', icon: 'phone-portrait-outline' },
          { id: '3', text: 'Your spending in Groceries is up 15%', type: 'insight', icon: 'bar-chart-outline' },
          { id: '4', text: 'Get 10% cashback on your next data purchase', type: 'promo', icon: 'gift-outline' },
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, uploadAvatar, changePassword, setPin, getDashboard };

