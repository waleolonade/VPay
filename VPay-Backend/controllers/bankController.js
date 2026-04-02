const BankAccount = require('../models/BankAccount');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const bankService = require('../services/bankService');

// @desc    Get saved bank accounts and cards
// @route   GET /api/v1/banks
const getBanksAndCards = async (req, res, next) => {
    try {
        const banks = await BankAccount.find({ user: req.user.id });

        // Fetch cards directly using pool since we don't have a rigid Card model yet
        const [cards] = await pool.query('SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);

        // Format cards response
        const formattedCards = cards.map(c => ({
            id: c.id,
            card_token: c.card_token,
            last4: c.last4digits,
            type: c.card_type,
            expiry: `${c.expiry_month}/${c.expiry_year}`,
            isDefault: !!c.is_default
        }));

        res.status(200).json({ success: true, data: { banks, cards: formattedCards } });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all Nigerian banks
// @route   GET /api/v1/banks/list
const listBanks = async (req, res, next) => {
    try {
        const banks = await bankService.getBanks();
        res.status(200).json({ success: true, data: banks });
    } catch (error) {
        next(error);
    }
};

// @desc    Add a bank account
// @route   POST /api/v1/banks
const addBankAccount = async (req, res, next) => {
    try {
        const { accountName, accountNumber, bankCode, bankName } = req.body;

        // Ensure we have a name (verify if not provided)
        let resolvedName = accountName;
        if (!resolvedName) {
            const resolution = await bankService.verifyAccountNumber(accountNumber, bankCode);
            resolvedName = resolution.accountName;
        }

        const account = await BankAccount.create({
            user: req.user.id,
            accountName: resolvedName,
            accountNumber,
            bankCode,
            bankName,
        });
        res.status(201).json({ success: true, message: 'Bank account added', data: account });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: 'Bank account already linked' });
        }
        next(error);
    }
};

// @desc    Resolve bank account name
// @route   GET /api/v1/banks/resolve
const resolveAccount = async (req, res, next) => {
    try {
        const { accountNumber, bankCode } = req.query;
        if (!accountNumber || !bankCode) {
            return res.status(400).json({ success: false, message: 'Account number and bank code are required' });
        }

        const result = await bankService.verifyAccountNumber(accountNumber, bankCode);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message || 'Account resolution failed' });
    }
};

// @desc    Set a bank account as default
// @route   PATCH /api/v1/banks/:id/default
const setDefaultAccount = async (req, res, next) => {
    try {
        const accountId = req.params.id;
        const userId = req.user.id;

        const account = await BankAccount.findOne({ id: accountId, user: userId });
        if (!account) return res.status(404).json({ success: false, message: 'Bank account not found' });

        // Unset any previous default
        await pool.query('UPDATE bank_accounts SET is_default = 0 WHERE user_id = ?', [userId]);

        // Set this one as default
        const updated = await BankAccount.update(accountId, { isDefault: 1 });

        res.status(200).json({ success: true, message: 'Bank account set as default', data: updated });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove a bank account
// @route   DELETE /api/v1/banks/:id
const removeBankAccount = async (req, res, next) => {
    try {
        const account = await BankAccount.findOneAndDelete({ id: req.params.id, user: req.user.id });
        if (!account) return res.status(404).json({ success: false, message: 'Bank account not found' });
        res.status(200).json({ success: true, message: 'Bank account removed' });
    } catch (error) {
        next(error);
    }
};

// @desc    Add a fake demo card (Tokenization normally happens on frontend via Paystack/Flutterwave)
// @route   POST /api/v1/banks/cards
const addCard = async (req, res, next) => {
    try {
        const { cardNumber, cardType, expiryMonth, expiryYear } = req.body;

        const last4 = cardNumber.slice(-4);
        const token = `tok_${uuidv4().replace(/-/g, '').slice(0, 16)}`; // Fake token
        const id = uuidv4();

        await pool.query(
            'INSERT INTO cards (id, user_id, card_token, last4digits, card_type, expiry_month, expiry_year) VALUES (?,?,?,?,?,?,?)',
            [id, req.user.id, token, last4, cardType || 'Visa', expiryMonth, expiryYear]
        );

        res.status(201).json({ success: true, message: 'Card added successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Remove a card
// @route   DELETE /api/v1/banks/cards/:id
const removeCard = async (req, res, next) => {
    try {
        const [result] = await pool.query('DELETE FROM cards WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Card not found' });
        res.status(200).json({ success: true, message: 'Card removed' });
    } catch (error) {
        next(error);
    }
};

module.exports = { 
    getBanksAndCards, 
    listBanks,
    addBankAccount, 
    removeBankAccount, 
    resolveAccount, 
    setDefaultAccount,
    addCard, 
    removeCard 
};
