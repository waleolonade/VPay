const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Card = {
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      user: row.user_id,
      cardType: row.card_type,
      expiryMonth: row.expiry_month,
      expiryYear: row.expiry_year,
      cardholderName: row.cardholder_name,
      authorizationCode: row.authorization_code,
      isDefault: !!row.is_default,
      isActive: !!row.is_active,
    };
  },

  async findOne(conditions) {
    const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', _id: 'id' };
    const keys = Object.keys(conditions);
    const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
    const vals = keys.map((k) => conditions[k]);
    const [rows] = await pool.query(`SELECT * FROM cards WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
    return this._map(rows[0]);
  },

  async find(conditions = {}) {
    const colMap = { user: 'user_id', user_id: 'user_id' };
    let sql = 'SELECT * FROM cards';
    const vals = [];
    const keys = Object.keys(conditions);
    if (keys.length > 0) {
      const whereParts = keys.map((k) => { vals.push(conditions[k]); return `${colMap[k] || k} = ?`; });
      sql += ` WHERE ${whereParts.join(' AND ')}`;
    }
    const [rows] = await pool.query(sql, vals);
    return rows.map((r) => this._map(r));
  },

  async create(data) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO cards (id, user_id, card_type, last4, expiry_month, expiry_year, cardholder_name, bank, authorization_code, signature, is_default, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, data.user || data.user_id, data.cardType || data.card_type, data.last4,
        data.expiryMonth || data.expiry_month, data.expiryYear || data.expiry_year,
        data.cardholderName || data.cardholder_name, data.bank || null,
        data.authorizationCode || data.authorization_code || null,
        data.signature || null, data.isDefault ?? data.is_default ?? 0, data.isActive ?? data.is_active ?? 1]
    );
    return this.findOne({ id });
  },

  async findOneAndDelete(conditions) {
    const card = await this.findOne(conditions);
    if (!card) return null;
    await pool.query('DELETE FROM cards WHERE id = ?', [card.id]);
    return card;
  },
};

module.exports = Card;

