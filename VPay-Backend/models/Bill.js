const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Bill = {
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      user: row.user_id,
      billType: row.bill_type,
      billerId: row.biller_id,
      billerName: row.biller_name,
      customerName: row.customer_name,
      customerNumber: row.customer_number,
      division: row.division,
      paymentItem: row.payment_item,
      productId: row.product_id,
      providerReference: row.provider_reference,
      completedAt: row.completed_at,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : null,
    };
  },

  async findOne(conditions) {
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', reference: 'reference', status: 'status' };
    const keys = Object.keys(conditions);
    const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
    const vals = keys.map((k) => conditions[k]);
    const [rows] = await pool.query(`SELECT * FROM bill_payments WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    return this._map(rows[0]);
  },

  async find(conditions = {}, opts = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id', status: 'status' };
    let sql = 'SELECT * FROM bill_payments';
    const vals = [];
    const keys = Object.keys(conditions);
    if (keys.length > 0) {
      const whereParts = keys.map((k) => { vals.push(conditions[k]); return `${colMap[k] || k} = ?`; });
      sql += ` WHERE ${whereParts.join(' AND ')}`;
    }
    sql += ' ORDER BY created_at DESC';
    if (opts.limit) { sql += ' LIMIT ?'; vals.push(opts.limit); }
    if (opts.skip) { sql += ' OFFSET ?'; vals.push(opts.skip); }
    const [rows] = await pool.query(sql, vals);
    return rows.map((r) => this._map(r));
  },

  async countDocuments(conditions = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id' };
    let sql = 'SELECT COUNT(*) AS cnt FROM bill_payments';
    const vals = [];
    const keys = Object.keys(conditions);
    if (keys.length > 0) {
      const whereParts = keys.map((k) => { vals.push(conditions[k]); return `${colMap[k] || k} = ?`; });
      sql += ` WHERE ${whereParts.join(' AND ')}`;
    }
    const [rows] = await pool.query(sql, vals);
    return rows[0].cnt;
  },

  async create(data) {
    const [result] = await pool.query(
      `INSERT INTO bill_payments (user_id, reference, bill_type, biller_id, biller_name, customer_name,
        customer_number, division, payment_item, product_id, amount, fee, status, provider_reference, token, metadata, completed_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [data.user || data.user_id, data.reference, data.billType || data.bill_type,
      data.billerId || data.biller_id, data.billerName || data.biller_name,
      data.customerName || data.customer_name || null,
      data.customerNumber || data.customer_number,
      data.division || null, data.paymentItem || data.payment_item || null,
      data.productId || data.product_id || null,
      data.amount, data.fee ?? 0,
      data.status || 'pending', data.providerReference || data.provider_reference || null,
      data.token || null, data.metadata ? JSON.stringify(data.metadata) : null,
      data.completedAt || data.completed_at || null]
    );
    return this.findOne({ reference: data.reference });
  },
};

module.exports = Bill;

