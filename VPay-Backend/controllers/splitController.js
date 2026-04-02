const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// @desc    Create a new split group
// @route   POST /api/v1/splits
const createSplit = async (req, res, next) => {
    const connection = await pool.getConnection();
    try {
        const { title, totalAmount, members } = req.body;
        const creatorId = req.user.id;

        if (!title || !totalAmount || !members || !Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid split details' });
        }

        await connection.beginTransaction();

        const groupId = uuidv4();
        await connection.query(
            `INSERT INTO split_groups (id, creator_id, total_amount, title) VALUES (?, ?, ?, ?)`,
            [groupId, creatorId, totalAmount, title]
        );

    // Insert members
    for (const member of members) {
      const memberId = uuidv4();
      await connection.query(
        `INSERT INTO split_members (id, group_id, user_id, amount_owed) VALUES (?, ?, ?, ?)`,
        [memberId, groupId, member.userId, member.amountOwed]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'Split group created successfully', data: { id: groupId } });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

// @desc    Get split groups I am involved in
// @route   GET /api/v1/splits
const getMySplits = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Get groups I created or I am a member of
    const [rows] = await pool.query(
      `SELECT DISTINCT g.* 
       FROM split_groups g
       LEFT JOIN split_members m ON g.id = m.group_id
       WHERE g.creator_id = ? OR m.user_id = ?
       ORDER BY g.created_at DESC`,
      [userId, userId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed view of a split group
// @route   GET /api/v1/splits/:id
const getSplitDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [groups] = await pool.query('SELECT * FROM split_groups WHERE id = ? LIMIT 1', [id]);
    if (groups.length === 0) {
      return res.status(404).json({ success: false, message: 'Split group not found' });
    }

    const group = groups[0];

    const [members] = await pool.query(
      `SELECT m.*, u.first_name, u.last_name, u.phone 
       FROM split_members m
       JOIN users u ON m.user_id = u.id
       WHERE m.group_id = ?`,
      [id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...group,
        members
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Pay a split portion
// @route   POST /api/v1/splits/:id/pay
const paySplit = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { id: splitId } = req.params;
    const userId = req.user.id;

    await connection.beginTransaction();

    const [members] = await connection.query(
      'SELECT * FROM split_members WHERE group_id = ? AND user_id = ? LIMIT 1 FOR UPDATE',
      [splitId, userId]
    );

    if (members.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'You are not a member of this split group' });
    }

    const member = members[0];
    if (member.status === 'paid') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'You have already paid your portion' });
    }

    const { amount_owed: amount } = member;
    const { creator_id: creatorId } = members[0]; // Wait, creatorId is in split_groups

    const [groups] = await connection.query('SELECT creator_id FROM split_groups WHERE id = ?', [splitId]);
    const creatorIdReal = groups[0].creator_id;

    const Wallet = require('../models/Wallet');
    const senderWallet = await Wallet.findOne({ user: userId });
    const receiverWallet = await Wallet.findOne({ user: creatorIdReal });

    if (!senderWallet || senderWallet.balance < amount) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Process payment via internal wallet atomic updates
    await Wallet.atomicDebit(senderWallet.id, amount, 0);
    await Wallet.atomicCredit(receiverWallet.id, amount);

    await connection.query(
      'UPDATE split_members SET status = "paid", paid_at = NOW() WHERE id = ?',
      [member.id]
    );


    // Check if entire group is paid
    const [unpaid] = await connection.query(
      'SELECT COUNT(*) as count FROM split_members WHERE group_id = ? AND status = "pending"',
      [splitId]
    );

    if (unpaid[0].count === 0) {
      await connection.query('UPDATE split_groups SET status = "completed" WHERE id = ?', [splitId]);
    }

    await connection.commit();
    res.status(200).json({ success: true, message: 'Split portion paid successfully' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
};

module.exports = { createSplit, getMySplits, getSplitDetails, paySplit };
