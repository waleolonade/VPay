const { pool } = require('../config/database');

const BusinessRequest = {
  async create(userId, data) {
    const {
      businessName,
      businessCategory,
      cacNumber,
      cacCertificate,
      businessEmail,
      businessPhone,
      businessAddress,
      estimatedMonthlyRevenue,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO business_requests 
      (user_id, business_name, business_category, cac_number, cac_certificate, 
       business_email, business_phone, business_address, estimated_monthly_revenue, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        userId,
        businessName,
        businessCategory,
        cacNumber,
        cacCertificate,
        businessEmail,
        businessPhone,
        businessAddress,
        estimatedMonthlyRevenue || 0,
      ]
    );

    return this.findById(result.insertId);
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM business_requests WHERE id = ?`,
      [id]
    );
    return this._map(rows[0]);
  },

  async findByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT * FROM business_requests WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows.map(this._map);
  },

  async findAll(filters = {}) {
    let query = `SELECT br.*, 
                 u.first_name, u.last_name, u.email as user_email, u.phone as user_phone
                 FROM business_requests br
                 LEFT JOIN users u ON br.user_id = u.id
                 WHERE 1=1`;
    const params = [];

    if (filters.status) {
      query += ` AND br.status = ?`;
      params.push(filters.status);
    }

    if (filters.limit) {
      query += ` ORDER BY br.created_at DESC LIMIT ?`;
      params.push(parseInt(filters.limit));
    } else {
      query += ` ORDER BY br.created_at DESC`;
    }

    const [rows] = await pool.query(query, params);
    return rows.map((row) => ({
      ...this._map(row),
      userFirstName: row.first_name,
      userLastName: row.last_name,
      userEmail: row.user_email,
      userPhone: row.user_phone,
    }));
  },

  async updateStatus(id, status, reviewedBy, rejectionReason = null) {
    await pool.query(
      `UPDATE business_requests 
       SET status = ?, reviewed_by = ?, rejection_reason = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [status, reviewedBy, rejectionReason, id]
    );

    // If approved, update user's business status
    if (status === 'approved') {
      const request = await this.findById(id);
      await pool.query(
        `UPDATE users 
         SET is_business = 1, business_name = ?, business_category = ?
         WHERE id = ?`,
        [request.businessName, request.businessCategory, request.userId]
      );
    }

    return this.findById(id);
  },

  async getStats() {
    const [rows] = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today
       FROM business_requests`
    );
    return rows[0];
  },

  _map(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id,
      businessName: row.business_name,
      businessCategory: row.business_category,
      cacNumber: row.cac_number,
      cacCertificate: row.cac_certificate,
      businessEmail: row.business_email,
      businessPhone: row.business_phone,
      businessAddress: row.business_address,
      estimatedMonthlyRevenue: parseFloat(row.estimated_monthly_revenue || 0),
      status: row.status,
      rejectionReason: row.rejection_reason,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },
};

module.exports = BusinessRequest;
