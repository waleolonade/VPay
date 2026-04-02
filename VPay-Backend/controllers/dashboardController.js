const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

/**
 * @desc    Get user dashboard data
 * @route   GET /api/v1/users/dashboard
 * @access  Private
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch data in parallel
    const [wallet, recentTransactions, unreadNotifications] = await Promise.all([
      Wallet.findOne({ user: userId }),
      Transaction.find({ 
        user: userId 
      }, { 
        limit: 5, 
        orderBy: 'created_at DESC' 
      }),
      Notification.countDocuments({ user: userId, is_read: false }),
    ]);

    // Smart AI Suggestions based on user activity
    const suggestions = [];
    
    // Check if user has low balance
    if (wallet && wallet.balance < 1000) {
      suggestions.push({
        id: 'fund_wallet',
        text: 'Your balance is low. Fund your wallet to continue enjoying our services.',
        icon: 'wallet-outline',
        action: 'fund',
      });
    }

    // Check if user hasn't made a transaction recently
    if (!recentTransactions || recentTransactions.length === 0) {
      suggestions.push({
        id: 'first_transaction',
        text: 'Make your first transaction and get ₦100 cashback!',
        icon: 'gift-outline',
        action: 'transfer',
      });
    }

    // Savings suggestion
    if (wallet && wallet.balance > 5000) {
      suggestions.push({
        id: 'save_now',
        text: 'Start saving today and earn up to 15% interest per annum.',
        icon: 'trending-up-outline',
        action: 'savings',
      });
    }

    // Promotions data
    const promotions = [
      {
        id: 'cashback_promo',
        title: 'Get 5% Cashback',
        subtitle: 'On all bill payments this month',
        action: 'cashback',
        gradient: ['#FFD700', '#FFA500'],
        icon: 'gift-outline',
      },
      {
        id: 'referral_promo',
        title: 'Refer & Earn ₦500',
        subtitle: 'For every friend you invite',
        action: 'referral',
        gradient: ['#4CAF50', '#2E7D32'],
        icon: 'people-outline',
      },
      {
        id: 'savings_promo',
        title: 'Smart Savings',
        subtitle: 'Earn up to 15% interest per annum',
        action: 'savings',
        gradient: ['#2196F3', '#1565C0'],
        icon: 'wallet-outline',
      },
      {
        id: 'loan_promo',
        title: 'Quick Loans',
        subtitle: 'Get instant loans up to ₦500,000',
        action: 'loan',
        gradient: ['#9C27B0', '#6A1B9A'],
        icon: 'cash-outline',
      },
    ];

    // Format response
    const dashboardData = {
      balance: wallet ? parseFloat(wallet.balance) : 0,
      accountNumber: wallet ? wallet.account_number : '...',
      recentTransactions: recentTransactions.map(txn => ({
        id: txn.reference || txn.id,
        reference: txn.reference,
        description: txn.description || 'Transaction',
        amount: parseFloat(txn.amount),
        type: txn.type, // credit or debit
        status: txn.status,
        category: txn.category,
        created_at: txn.created_at,
      })),
      suggestions,
      promotions,
      unreadCount: unreadNotifications,
      user: {
        firstName: req.user.firstName || req.user.first_name,
        lastName: req.user.lastName || req.user.last_name,
        avatar: req.user.avatar,
        phone: req.user.phone,
      },
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    next(error);
  }
};
