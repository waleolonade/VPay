const { pool } = require('../config/database');

async function runMigration() {
    console.log('Starting Phase 1 Database Migration...');

    try {
        // 1. Alter Savings Table
        console.log('Adding auto_save_rule and rule_value to savings table...');
        try {
            await pool.query(`
        ALTER TABLE savings 
        ADD COLUMN auto_save_rule VARCHAR(50) NULL AFTER auto_save_amount,
        ADD COLUMN rule_value DECIMAL(18,2) NULL AFTER auto_save_rule;
      `);
            console.log('✅ Savings table updated.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('⚠️ Columns already exist in savings table, skipping.');
            } else {
                throw err;
            }
        }

        // 2. Create Subscriptions Table
        console.log('Creating subscriptions table...');
        await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        service_name VARCHAR(255) NOT NULL,
        amount DECIMAL(18,2) NOT NULL,
        billing_cycle VARCHAR(20) NOT NULL,
        next_billing_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        remind_me TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_subs_user_status (user_id, status),
        CONSTRAINT fk_subs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT chk_subs_cycle CHECK (billing_cycle IN ('weekly','monthly','yearly')),
        CONSTRAINT chk_subs_status CHECK (status IN ('active','paused','cancelled'))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        console.log('✅ Subscriptions table created.');

        console.log('🎉 Phase 1 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        process.exit(0);
    }
}

runMigration();
