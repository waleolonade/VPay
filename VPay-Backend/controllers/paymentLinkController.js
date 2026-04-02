const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Generate a random slug
const generateSlug = () => Math.random().toString(36).substring(2, 10);

// @desc    Create a new payment link
// @route   POST /api/v1/payment-links
const createLink = async (req, res, next) => {
    try {
        const { amount, description, expiresAt } = req.body;
        const userId = req.user.id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Valid amount is required' });
        }

        const id = uuidv4();
        const slug = generateSlug();

        await pool.query(
            `INSERT INTO payment_links (id, user_id, amount, description, slug, expires_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [id, userId, amount, description || null, slug, expiresAt || null]
        );

        res.status(201).json({
            success: true,
            message: 'Payment link created successfully',
            data: {
                id,
                amount,
                description,
                slug,
                linkUrl: `https://vpay.app/pay/${slug}` // Sample public URL
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all payment links for a user
// @route   GET /api/v1/payment-links
const getMyLinks = async (req, res, next) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM payment_links WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        next(error);
    }
};

// @desc    Get a specific payment link details by slug (Public)
// @route   GET /api/v1/payment-links/:slug
const getLinkBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const [rows] = await pool.query(
            `SELECT p.*, u.first_name, u.last_name, u.avatar 
             FROM payment_links p 
             JOIN users u ON p.user_id = u.id 
             WHERE p.slug = ? LIMIT 1`,
            [slug]
        );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Payment link not found' });
    }

    const link = rows[0];

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Payment link has expired' });
    }
    if (link.status !== 'active') {
      return res.status(400).json({ success: false, message: `Payment link is ${link.status}` });
    }

    res.status(200).json({
      success: true,
      data: {
        id: link.id,
        amount: link.amount,
        description: link.description,
        status: link.status,
        recipient: {
          firstName: link.first_name,
          lastName: link.last_name,
          avatar: link.avatar
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate a payment link
// @route   PUT /api/v1/payment-links/:id/deactivate
const deactivateLink = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      'UPDATE payment_links SET status = "inactive" WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Payment link not found or unauthorized' });
    }

    res.status(200).json({ success: true, message: 'Payment link deactivated' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createLink, getMyLinks, getLinkBySlug, deactivateLink };
