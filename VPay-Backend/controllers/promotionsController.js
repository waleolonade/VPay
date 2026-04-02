const User = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * @desc    Get all active promotions
 * @route   GET /api/v1/promotions
 * @access  Private
 */
exports.getPromotions = async (req, res, next) => {
  try {
    const promotions = [
      {
        id: 'cashback_promo',
        title: 'Get 5% Cashback',
        subtitle: 'On all bill payments this month',
        description: 'Pay any bill and get 5% cashback instantly credited to your wallet',
        action: 'cashback',
        gradient: ['#FFD700', '#FFA500'],
        icon: 'gift-outline',
        active: true,
        validUntil: new Date('2026-04-30'),
      },
      {
        id: 'referral_promo',
        title: 'Refer & Earn ₦500',
        subtitle: 'For every friend you invite',
        description: 'Invite friends and earn ₦500 for each successful referral',
        action: 'referral',
        gradient: ['#4CAF50', '#2E7D32'],
        icon: 'people-outline',
        active: true,
      },
      {
        id: 'savings_promo',
        title: 'Smart Savings',
        subtitle: 'Earn up to 15% interest per annum',
        description: 'Lock your savings for 6 months and earn competitive interest rates',
        action: 'savings',
        gradient: ['#2196F3', '#1565C0'],
        icon: 'wallet-outline',
        active: true,
      },
      {
        id: 'loan_promo',
        title: 'Quick Loans',
        subtitle: 'Get instant loans up to ₦500,000',
        description: 'Apply for a loan and get approved within minutes',
        action: 'loan',
        gradient: ['#9C27B0', '#6A1B9A'],
        icon: 'cash-outline',
        active: true,
      },
    ];

    res.status(200).json({
      success: true,
      data: promotions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get personalized offers based on user activity
 * @route   GET /api/v1/promotions/personalized
 * @access  Private
 */
exports.getPersonalizedOffers = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch user transaction history
    const transactions = await Transaction.find({ user: userId }, { limit: 10 });
    
    const offers = [];

    // Analyze user behavior and create personalized offers
    const hasAirtimePurchase = transactions.some(t => t.category === 'airtime');
    const hasDataPurchase = transactions.some(t => t.category === 'data');
    const hasBillPayment = transactions.some(t => t.category === 'bill');

    if (hasAirtimePurchase) {
      offers.push({
        id: 'airtime_bonus',
        title: 'Airtime Bonus',
        subtitle: 'Get 2% extra on airtime recharge',
        action: 'airtime',
      });
    }

    if (hasDataPurchase) {
      offers.push({
        id: 'data_discount',
        title: 'Data Bundle Discount',
        subtitle: 'Save 10% on all data bundles',
        action: 'data',
      });
    }

    if (hasBillPayment) {
      offers.push({
        id: 'bill_cashback',
        title: 'Bill Payment Cashback',
        subtitle: 'Get 5% cashback on your next bill payment',
        action: 'bills',
      });
    }

    res.status(200).json({
      success: true,
      data: offers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get cashback offers
 * @route   GET /api/v1/promotions/cashback
 * @access  Private
 */
exports.getCashbackOffers = async (req, res, next) => {
  try {
    const cashbackOffers = [
      {
        id: 'bills_cashback',
        title: '5% Cashback on Bills',
        description: 'Pay electricity, water, or TV bills and get 5% back',
        percentage: 5,
        maxAmount: 500,
      },
      {
        id: 'transfer_cashback',
        title: '2% Cashback on Transfers',
        description: 'Send money to friends and family, get 2% back',
        percentage: 2,
        maxAmount: 200,
      },
    ];

    res.status(200).json({
      success: true,
      data: cashbackOffers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Track promotion interaction
 * @route   POST /api/v1/promotions/track
 * @access  Private
 */
exports.trackPromotion = async (req, res, next) => {
  try {
    const { promotionId, action } = req.body;
    const userId = req.user.id;

    // Log the interaction (you can expand this to store in database)
    console.log(`User ${userId} ${action} promotion ${promotionId}`);

    // You could store this in an analytics table for future insights
    // await PromotionAnalytics.create({ userId, promotionId, action });

    res.status(200).json({
      success: true,
      message: 'Promotion tracked',
    });
  } catch (error) {
    next(error);
  }
};
