const { pool } = require('../config/database');
const uuid = require('uuid');

// @desc    Submit a support ticket or chat message
// @route   POST /api/v1/support/ticket
const createSupportTicket = async (req, res, next) => {
    try {
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ success: false, message: 'Subject and message are required' });
        }

        // Technically, a real app would have a `support_tickets` table. 
        // We simulate saving it.
        const ticketId = uuid.v4();

        // await pool.query('INSERT INTO support_tickets (id, user_id, subject, message, status) VALUES (?, ?, ?, ?, ?)', [ticketId, req.user.id, subject, message, 'open']);

        res.status(201).json({
            success: true,
            message: 'Support ticket submitted successfully. A representative will contact you soon.',
            data: { ticketId, status: 'open' }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createSupportTicket };
