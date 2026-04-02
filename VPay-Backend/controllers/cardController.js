const Card = require('../models/Card');
const Wallet = require('../models/Wallet');
const vfdCardService = require('../services/vfdCardService');
const logger = require('../utils/logger');

// @desc    Get user cards
// @route   GET /api/v1/cards
exports.getCards = async (req, res, next) => {
  try {
    const cards = await Card.find({ user: req.user.id });
    res.status(200).json({ success: true, data: cards });
  } catch (error) {
    next(error);
  }
};

// @desc    Request virtual card
// @route   POST /api/v1/cards/virtual
exports.requestVirtualCard = async (req, res, next) => {
  try {
    const { cardBrand } = req.body;
    const wallet = await Wallet.findOne({ user: req.user.id, wallet_type: 'personal' });
    
    if (!wallet || !wallet.accountNumber) {
      return res.status(400).json({ success: false, message: 'VFD account not found. Please complete KYC.' });
    }

    // VFD issuance fee (simulated ₦1000)
    const cardFee = 1000;
    if (wallet.balance < cardFee) {
      return res.status(400).json({ success: false, message: `Insufficient balance for card issuance fee (₦${cardFee})` });
    }

    // Call VFD Service
    const vfdCard = await vfdCardService.requestVirtualCard({
      accountNumber: wallet.accountNumber,
      cardBrand
    });

    // Atomic Debit for fee
    await Wallet.atomicDebit(wallet.id, cardFee);

    // Create local record
    const card = await Card.create({
      user: req.user.id,
      cardType: 'virtual',
      last4: vfdCard.cardNumber.slice(-4),
      expiryMonth: vfdCard.expiry.split('/')[0],
      expiryYear: vfdCard.expiry.split('/')[1],
      cardholderName: `${req.user.firstName} ${req.user.lastName}`,
      bank: 'VFD Bank',
      authorizationCode: vfdCard.cardId,
      isActive: true
    });

    res.status(201).json({ success: true, message: 'Virtual card issued successfully', data: card });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle card status
// @route   PATCH /api/v1/cards/:id/status
exports.toggleCardStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'active' | 'blocked'
    const card = await Card.findOne({ id: req.params.id, user: req.user.id });
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

    await vfdCardService.toggleCardStatus(card.authorizationCode, status);
    
    card.is_active = status === 'active';
    await card.save();

    res.status(200).json({ success: true, message: `Card ${status} successfully`, data: card });
  } catch (error) {
    next(error);
  }
};

// @desc    Get card details
// @route   GET /api/v1/cards/:id/details
exports.getCardDetails = async (req, res, next) => {
  try {
    const card = await Card.findOne({ id: req.params.id, user: req.user.id });
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });

    const details = await vfdCardService.getCardDetails(card.authorizationCode);
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    next(error);
  }
};
