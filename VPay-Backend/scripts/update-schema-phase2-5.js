const { pool } = require('../config/database');
const logger = require('../utils/logger');

async function updateSchemaPhase2_5() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        logger.info('Starting Phase 2.5 Database Migration...');

        // 1. Extend Users table for Notifications & Rewards
        logger.info('Extending users table for notifications...');
        await connection.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS push_enabled TINYINT(1) DEFAULT 1,
      ADD COLUMN IF NOT EXISTS sms_enabled TINYINT(1) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS promo_enabled TINYINT(1) DEFAULT 1;
    `);

        // 2. Create Cashback / Rewards Wallet Table? Note: The prompt asks for "Cashback Wallet" in Profile
        // We already have Wallet. We can create a dedicated `rewards` table or just a `cashback_balance` on `users` or `wallets`.
        // Let's add it to `wallets`
        logger.info('Extending wallets table for cashback...');
        await connection.query(`
      ALTER TABLE wallets
      ADD COLUMN IF NOT EXISTS cashback_balance DECIMAL(18,2) DEFAULT 0;
    `);

        await connection.commit();
        logger.info('✅ Phase 2.5 database migration completed successfully!');
    } catch (error) {
        await connection.rollback();
        logger.error('❌ Phase 2.5 migration failed:', error);
        throw error;
    } finally {
        connection.release();
        process.exit(0);
    }
}

updateSchemaPhase2_5();
