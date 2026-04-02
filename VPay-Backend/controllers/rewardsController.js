const { pool } = require('../config/database');
const User = require('../models/User');

// @desc    Get user's rewards and referral stats
// @route   GET /api/v1/rewards
const getRewardsSummary = async (req, res, next) => {
    try {
        // Fetch cashback balance from wallets
        const [walletRows] = await pool.query(
            'SELECT cashback_balance FROM wallets WHERE user_id = ?',
            [req.user.id]
        );
        const cashbackBalance = walletRows.length ? walletRows[0].cashback_balance : 0.00;

        // Fetch referred users count
        const [referralRows] = await pool.query(
            'SELECT COUNT(*) as referred_count FROM users WHERE referred_by = ?',
            [req.user.id] // Note: in a real app, referred_by might be the referral code, assuming ID for now
        );
        const referredCount = referralRows[0].referred_count;

        res.status(200).json({
            success: true,
            data: {
                cashbackBalance,
                referralCode: req.user.referralCode || `VPAY-${req.user.phone.slice(-4)}`,
                referredUsersCount: referredCount,
                referralBonusAmount: 1000 // ₦1,000 explicitly per prompt
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { getRewardsSummary };
