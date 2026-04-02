const { pool } = require('../config/database');
const logger = require('../utils/logger');

async function updateSchemaPhase3() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        logger.info('Starting Phase 3 Database Migration (Social & Sharing)...');

        // 1. Payment Links Table
        logger.info('Creating payment_links table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS payment_links (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                amount DECIMAL(18,2) NOT NULL,
                description VARCHAR(255),
                slug VARCHAR(50) UNIQUE NOT NULL,
                status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
                expires_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 2. Split Groups Table
        logger.info('Creating split_groups table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS split_groups (
                id VARCHAR(36) PRIMARY KEY,
                creator_id VARCHAR(36) NOT NULL,
                total_amount DECIMAL(18,2) NOT NULL,
                title VARCHAR(100) NOT NULL,
                status ENUM('pending', 'completed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 3. Split Members Table
        logger.info('Creating split_members table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS split_members (
                id VARCHAR(36) PRIMARY KEY,
                group_id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                amount_owed DECIMAL(18,2) NOT NULL,
                status ENUM('pending', 'paid') DEFAULT 'pending',
                paid_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (group_id) REFERENCES split_groups(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await connection.commit();
        logger.info('✅ Phase 3 database migration completed successfully!');
    } catch (error) {
        await connection.rollback();
        logger.error('❌ Phase 3 migration failed:', error);
        throw error;
    } finally {
        connection.release();
        process.exit(0);
    }
}

updateSchemaPhase3();
