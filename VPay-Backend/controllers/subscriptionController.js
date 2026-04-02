const Subscription = require('../models/Subscription');

// @desc    Create a new subscription tracker
// @route   POST /api/v1/subscriptions
exports.createSubscription = async (req, res, next) => {
    try {
        const { serviceName, amount, billingCycle, nextBillingDate, remindMe } = req.body;

        if (!serviceName || !amount || !billingCycle || !nextBillingDate) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const subscription = await Subscription.create({
            user: req.user.id,
            serviceName,
            amount,
            billingCycle,
            nextBillingDate,
            remindMe: remindMe !== undefined ? remindMe : true
        });

        res.status(201).json({ success: true, message: 'Subscription added', data: subscription });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user subscriptions
// @route   GET /api/v1/subscriptions
exports.getSubscriptions = async (req, res, next) => {
    try {
        const subscriptions = await Subscription.find({ user: req.user.id, status: 'active' });

        // Calculate total monthly spend (rough estimate)
        const monthlyTotal = subscriptions.reduce((acc, sub) => {
            let amt = parseFloat(sub.amount);
            if (sub.billingCycle === 'yearly') amt = amt / 12;
            if (sub.billingCycle === 'weekly') amt = amt * 4;
            return acc + amt;
        }, 0);

        res.status(200).json({
            success: true,
            data: {
                subscriptions,
                monthlyTotal: monthlyTotal.toFixed(2)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel/Pause subscription tracker
// @route   POST /api/v1/subscriptions/:id/cancel
exports.cancelSubscription = async (req, res, next) => {
    try {
        const subscription = await Subscription.findOne({ id: req.params.id, user: req.user.id });

        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }

        subscription.status = 'cancelled';
        await subscription.save();

        res.status(200).json({ success: true, message: 'Subscription cancelled', data: subscription });
    } catch (error) {
        next(error);
    }
};
