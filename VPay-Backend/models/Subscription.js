const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const Subscription = {
    _map(row) {
        if (!row) return null;
        return {
            ...row,
            _id: row.id,
            user: row.user_id,
            serviceName: row.service_name,
            amount: row.amount,
            billingCycle: row.billing_cycle,
            nextBillingDate: row.next_billing_date,
            status: row.status,
            remindMe: !!row.remind_me,
            async save() { await Subscription.updateRaw(this.id, this); },
        };
    },

    async findOne(conditions) {
        const colMap = { user: 'user_id', user_id: 'user_id', id: 'id', _id: 'id', status: 'status' };
        const keys = Object.keys(conditions);
        const whereParts = keys.map((k) => `${colMap[k] || k} = ?`);
        const vals = keys.map((k) => conditions[k]);
        const [rows] = await pool.query(`SELECT * FROM subscriptions WHERE ${whereParts.join(' AND ')} LIMIT 1`, vals);
        return this._map(rows[0]);
    },

    async find(conditions = {}, opts = {}) {
        const colMap = { user: 'user_id', user_id: 'user_id', status: 'status' };
        let sql = 'SELECT * FROM subscriptions';
        const vals = [];
        const keys = Object.keys(conditions);
        if (keys.length > 0) {
            const whereParts = keys.map((k) => { vals.push(conditions[k]); return `${colMap[k] || k} = ?`; });
            sql += ` WHERE ${whereParts.join(' AND ')}`;
        }
        sql += ' ORDER BY next_billing_date ASC';
        if (opts.limit) { sql += ' LIMIT ?'; vals.push(opts.limit); }
        if (opts.skip) { sql += ' OFFSET ?'; vals.push(opts.skip); }
        const [rows] = await pool.query(sql, vals);
        return rows.map((r) => this._map(r));
    },

    async create(data) {
        const id = uuidv4();
        await pool.query(
            `INSERT INTO subscriptions (id, user_id, service_name, amount, billing_cycle, next_billing_date, status, remind_me)
       VALUES (?,?,?,?,?,?,?,?)`,
            [
                id,
                data.user || data.user_id,
                data.serviceName || data.service_name,
                data.amount,
                data.billingCycle || data.billing_cycle,
                data.nextBillingDate || data.next_billing_date,
                data.status || 'active',
                data.remindMe !== undefined ? data.remindMe : 1
            ]
        );
        return this.findOne({ id });
    },

    async updateRaw(id, data) {
        const fieldMap = {
            status: 'status',
            next_billing_date: 'next_billing_date',
            nextBillingDate: 'next_billing_date',
            remind_me: 'remind_me',
            remindMe: 'remind_me'
        };
        const setClauses = [];
        const vals = [];
        for (const [k, v] of Object.entries(data)) {
            const col = fieldMap[k];
            if (col) { setClauses.push(`${col} = ?`); vals.push(v); }
        }
        if (setClauses.length > 0) {
            vals.push(id);
            await pool.query(`UPDATE subscriptions SET ${setClauses.join(', ')} WHERE id = ?`, vals);
        }
    },
};

module.exports = Subscription;
