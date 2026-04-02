const { pool } = require('./config/database');

async function createMissingTables() {
  try {
    console.log('\n📋 Creating missing security tables...\n');

    // Create admin_ip_whitelist table
    console.log('[1/2] Creating admin_ip_whitelist table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_ip_whitelist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
        UNIQUE KEY unique_admin_ip (admin_id, ip_address),
        INDEX idx_admin_id (admin_id),
        INDEX idx_ip_address (ip_address),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('    ✓ admin_ip_whitelist created\n');

    // Create admin_login_attempts table
    console.log('[2/2] Creating admin_login_attempts table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_login_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT,
        ip_address VARCHAR(45) NOT NULL,
        status ENUM('success', 'failed', 'blocked') DEFAULT 'failed',
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_admin_id (admin_id),
        INDEX idx_ip_address (ip_address),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('    ✓ admin_login_attempts created\n');

    console.log('✅ All missing tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  }
}

createMissingTables();
