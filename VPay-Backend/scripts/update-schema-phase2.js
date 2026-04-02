const { pool } = require('../config/database');
const logger = require('../utils/logger');

async function updateSchemaPhase2() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        logger.info('Starting Phase 2 Database Migration...');

        // 1. Extend Users table
        logger.info('Extending users table...');
        await connection.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS kyc_level INT DEFAULT 1,
      ADD COLUMN IF NOT EXISTS profile_image VARCHAR(512) NULL,
      ADD COLUMN IF NOT EXISTS transaction_pin_hash VARCHAR(255) NULL,
      ADD COLUMN IF NOT EXISTS bvn_verified TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS nin_verified TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS fingerprint_enabled TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS face_id_enabled TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS two_factor_enabled TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS daily_transfer_limit DECIMAL(18,2) DEFAULT 50000,
      ADD COLUMN IF NOT EXISTS daily_withdrawal_limit DECIMAL(18,2) DEFAULT 50000,
      ADD COLUMN IF NOT EXISTS account_frozen TINYINT(1) DEFAULT 0;
    `);

        // 2. KYC Verification Table
        logger.info('Creating kyc_verification table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS kyc_verification (
        id CHAR(36) NOT NULL DEFAULT (UUID()),
        user_id CHAR(36) NOT NULL,
        bvn VARCHAR(20) NULL,
        nin VARCHAR(20) NULL,
        id_type VARCHAR(50) NULL,
        id_document VARCHAR(512) NULL,
        face_verification VARCHAR(512) NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_kyc_user (user_id),
        CONSTRAINT fk_kyc_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // 3. Devices Table
        logger.info('Creating devices table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id CHAR(36) NOT NULL DEFAULT (UUID()),
        user_id CHAR(36) NOT NULL,
        device_name VARCHAR(255) NOT NULL,
        device_id VARCHAR(255) NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        last_login DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_device_user (user_id, device_id),
        CONSTRAINT fk_device_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // 4. Bank Accounts Table
        logger.info('Creating bank_accounts table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id CHAR(36) NOT NULL DEFAULT (UUID()),
        user_id CHAR(36) NOT NULL,
        bank_name VARCHAR(100) NOT NULL,
        bank_code VARCHAR(20) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        is_default TINYINT(1) DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_bank_account (user_id, account_number),
        CONSTRAINT fk_bank_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // 5. Cards Table
        logger.info('Creating cards table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id CHAR(36) NOT NULL DEFAULT (UUID()),
        user_id CHAR(36) NOT NULL,
        card_token VARCHAR(255) NOT NULL,
        last4digits VARCHAR(4) NOT NULL,
        card_type VARCHAR(20) NOT NULL,
        expiry_month VARCHAR(2) NOT NULL,
        expiry_year VARCHAR(4) NOT NULL,
        is_default TINYINT(1) DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_card_token (user_id, card_token),
        CONSTRAINT fk_card_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        // Update original init-db.sql so future deployments capture these
        // Note: We don't automatically rewrite init-db.sql via code here for safety, 
        // but the developer should backport these tables to init-db.sql manually.

        await connection.commit();
        logger.info('✅ Phase 2 database migration completed successfully!');
    } catch (error) {
        await connection.rollback();
        logger.error('❌ Phase 2 migration failed:', error);
        throw error;
    } finally {
        connection.release();
        process.exit(0);
    }
}

updateSchemaPhase2();
