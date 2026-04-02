const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const User = {
  // Map a DB row to a plain object, adding virtual helpers
  _map(row) {
    if (!row) return null;
    return {
      ...row,
      _id: row.id,
      fullName: `${row.first_name} ${row.last_name}`,
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth,
      kycLevel: row.kyc_level,
      kycStatus: row.kyc_status,
      profileImage: row.profile_image || row.avatar,
      avatar: row.avatar || row.profile_image,
      address: row.address_street,
      addressStreet: row.address_street,
      addressCity: row.address_city,
      addressState: row.address_state,
      addressCountry: row.address_country,
      isEmailVerified: !!row.is_email_verified,
      isPhoneVerified: !!row.is_phone_verified,
      bvnVerified: !!row.bvn_verified,
      ninVerified: !!row.nin_verified,
      isActive: !!row.is_active,
      accountFrozen: !!row.account_frozen,
      isBiometricEnabled: !!row.is_biometric_enabled,
      fingerprintEnabled: !!row.fingerprint_enabled,
      faceIdEnabled: !!row.face_id_enabled,
      twoFactorEnabled: !!row.two_factor_enabled,
      pushEnabled: !!row.push_enabled,
      smsEnabled: !!row.sms_enabled,
      promoEnabled: !!row.promo_enabled,
      dailyTransferLimit: row.daily_transfer_limit,
      dailyWithdrawalLimit: row.daily_withdrawal_limit,
      hasPIN: !!row.pin_hash || !!row.transaction_pin_hash,
      referralCode: row.referral_code,
      referredBy: row.referred_by,
      loginAttempts: row.login_attempts,
      lockUntil: row.lock_until,
      lastLogin: row.last_login,
      // Never expose hashes by default
      password_hash: undefined,
      pin_hash: undefined,
      comparePassword: async (candidate) => candidate && row.password_hash ? bcrypt.compare(candidate, row.password_hash) : false,
      comparePIN: async (candidate) => {
        if (!candidate) return false;
        const hash = row.pin_hash || row.transaction_pin_hash;
        return hash ? bcrypt.compare(candidate, hash) : false;
      },
      isLocked: () => !!(row.lock_until && new Date(row.lock_until) > new Date()),
    };
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return this._map(rows[0]);
  },

  async findByIdWithSecrets(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null; // raw row with hashes
  },

  async findOne(conditions) {
    const keys = Object.keys(conditions);
    if (keys.length === 0) return null;

    // Support $or
    if (conditions.$or) {
      const clauses = conditions.$or.map((c) => {
        const k = Object.keys(c)[0];
        return `${k} = ?`;
      });
      const vals = conditions.$or.map((c) => Object.values(c)[0]);
      const [rows] = await pool.query(`SELECT * FROM users WHERE ${clauses.join(' OR ')} LIMIT 1`, vals);
      return this._map(rows[0]);
    }

    const whereClause = keys.map((k) => `${k} = ?`).join(' AND ');
    const [rows] = await pool.query(`SELECT * FROM users WHERE ${whereClause} LIMIT 1`, Object.values(conditions));
    return this._map(rows[0]);
  },

  async find(conditions = {}, opts = {}) {
    const keys = Object.keys(conditions);
    let sql = 'SELECT * FROM users';
    const vals = [];

    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      phone: 'phone',
      id: 'id',
      _id: 'id',
    };

    if (keys.length > 0) {
      const whereParts = [];
      for (const k of keys) {
        const col = fieldMap[k] || k;
        if (k === '$or') {
          const clauses = [];
          for (const c of conditions.$or) {
            const orKey = Object.keys(c)[0];
            const orCol = fieldMap[orKey] || orKey;
            const orVal = c[orKey];
            
            if (typeof orVal === 'object' && orVal !== null && orVal.$regex !== undefined) {
              clauses.push(`${orCol} LIKE ?`);
              vals.push(`%${orVal.$regex}%`);
            } else {
              clauses.push(`${orCol} = ?`);
              vals.push(orVal);
            }
          }
          whereParts.push(`(${clauses.join(' OR ')})`);
        } else if (typeof conditions[k] === 'object' && conditions[k] !== null) {
          if (conditions[k].$regex !== undefined) {
            whereParts.push(`${col} LIKE ?`);
            vals.push(`%${conditions[k].$regex}%`);
          } else if (conditions[k].$ne !== undefined) {
            whereParts.push(`${col} != ?`);
            vals.push(conditions[k].$ne);
          }
        } else {
          whereParts.push(`${col} = ?`);
          vals.push(conditions[k]);
        }
      }
      if (whereParts.length) sql += ` WHERE ${whereParts.join(' AND ')}`;
    }

    if (opts.sort) {
      const sortKey = Object.keys(opts.sort)[0];
      const dir = opts.sort[sortKey] === -1 ? 'DESC' : 'ASC';
      sql += ` ORDER BY ${sortKey} ${dir}`;
    } else {
      sql += ' ORDER BY created_at DESC';
    }
    if (opts.limit) { sql += ' LIMIT ?'; vals.push(opts.limit); }
    if (opts.skip) { sql += ' OFFSET ?'; vals.push(opts.skip); }

    const [rows] = await pool.query(sql, vals);
    return rows.map((r) => this._map(r));
  },

  async countDocuments(conditions = {}) {
    const keys = Object.keys(conditions);
    let sql = 'SELECT COUNT(*) AS cnt FROM users';
    const vals = [];

    if (keys.length > 0) {
      const whereParts = [];
      for (const k of keys) {
        if (k === '$or') {
          const clauses = conditions.$or.map((c) => { vals.push(Object.values(c)[0]); return `${Object.keys(c)[0]} = ?`; });
          whereParts.push(`(${clauses.join(' OR ')})`);
        } else {
          whereParts.push(`${k} = ?`);
          vals.push(conditions[k]);
        }
      }
      sql += ` WHERE ${whereParts.join(' AND ')}`;
    }

    const [rows] = await pool.query(sql, vals);
    return rows[0].cnt;
  },

  async create(data) {
    const passwordHash = data.password ? await bcrypt.hash(data.password, 12) : null;
    const pinHash = data.pin ? await bcrypt.hash(data.pin, 12) : null;
    const id = uuidv4();

    await pool.query(
      `INSERT INTO users (id, first_name, last_name, email, phone, password_hash, pin_hash,
        avatar, date_of_birth, gender, address_street, address_city, address_state, address_country,
        bvn, nin, kyc_level, kyc_status, is_email_verified, is_phone_verified, is_active,
        is_biometric_enabled, role, referral_code, referred_by, last_login, login_attempts, lock_until, refresh_token)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        data.firstName || data.first_name,
        data.lastName || data.last_name,
        data.email ? data.email.toLowerCase() : null,
        data.phone,
        passwordHash,
        pinHash,
        data.avatar || '',
        data.dateOfBirth || data.date_of_birth || null,
        data.gender || null,
        data.address?.street || null,
        data.address?.city || null,
        data.address?.state || null,
        data.address?.country || 'Nigeria',
        data.bvn || null,
        data.nin || null,
        data.kycLevel ?? data.kyc_level ?? 0,
        data.kycStatus || data.kyc_status || 'pending',
        data.isEmailVerified ?? data.is_email_verified ?? 0,
        data.isPhoneVerified ?? data.is_phone_verified ?? 0,
        data.isActive ?? data.is_active ?? 1,
        data.isBiometricEnabled ?? data.is_biometric_enabled ?? 0,
        data.role || 'user',
        data.referralCode || data.referral_code || null,
        data.referredBy || data.referred_by || null,
        data.lastLogin || data.last_login || null,
        data.loginAttempts ?? data.login_attempts ?? 0,
        data.lockUntil || data.lock_until || null,
        data.refreshToken || data.refresh_token || null,
      ]
    );
    return this.findById(id);
  },

  async findByIdAndUpdate(id, updates) {
    await this.update(id, updates);
    return this.findById(id);
  },

  async update(id, updates) {
    const fieldMap = {
      firstName: 'first_name', lastName: 'last_name', email: 'email', phone: 'phone',
      dateOfBirth: 'date_of_birth', gender: 'gender', address: 'address_street',
      addressStreet: 'address_street', addressCity: 'address_city', 
      addressState: 'address_state', addressCountry: 'address_country',
      avatar: 'avatar', profileImage: 'profile_image', bvn: 'bvn', nin: 'nin',
      kycLevel: 'kyc_level', kycStatus: 'kyc_status',
      isEmailVerified: 'is_email_verified', isPhoneVerified: 'is_phone_verified',
      bvnVerified: 'bvn_verified', ninVerified: 'nin_verified',
      isActive: 'is_active', accountFrozen: 'account_frozen',
      isBiometricEnabled: 'is_biometric_enabled', fingerprintEnabled: 'fingerprint_enabled',
      faceIdEnabled: 'face_id_enabled', twoFactorEnabled: 'two_factor_enabled',
      pushEnabled: 'push_enabled', smsEnabled: 'sms_enabled', promoEnabled: 'promo_enabled',
      dailyTransferLimit: 'daily_transfer_limit', dailyWithdrawalLimit: 'daily_withdrawal_limit',
      role: 'role', referralCode: 'referral_code', referredBy: 'referred_by',
      lastLogin: 'last_login', loginAttempts: 'login_attempts', lockUntil: 'lock_until',
      refreshToken: 'refresh_token',
    };

    const data = { ...updates };
    // Handle $set wrapper
    if (data.$set) { Object.assign(data, data.$set); delete data.$set; }
    if (data.$inc) {
      // Handle increments separately
      for (const [k, v] of Object.entries(data.$inc)) {
        const col = fieldMap[k] || k;
        await pool.query(`UPDATE users SET ${col} = ${col} + ? WHERE id = ?`, [v, id]);
      }
      delete data.$inc;
    }

    const setClauses = [];
    const vals = [];

    for (const [k, v] of Object.entries(data)) {
      let value = v;
      if (k === 'password') {
        setClauses.push('password_hash = ?');
        vals.push(await bcrypt.hash(v, 12));
        continue;
      }
      if (k === 'pin') {
        setClauses.push('pin_hash = ?');
        vals.push(await bcrypt.hash(v, 12));
        continue;
      }
      const col = fieldMap[k] || k;
      // Skip unknown/virtual fields
      if (!col) continue;
      setClauses.push(`${col} = ?`);
      vals.push(value);
    }

    if (setClauses.length > 0) {
      vals.push(id);
      await pool.query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`, vals);
    }
  },

  async save(row) {
    // Called on raw row object returned from findByIdWithSecrets
    await this.update(row.id, row);
  },
};

module.exports = User;

