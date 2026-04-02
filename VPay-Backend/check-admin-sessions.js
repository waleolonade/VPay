const { pool } = require('./config/database');

async function checkTable() {
  try {
    const [rows] = await pool.query("SHOW TABLES LIKE 'admin_sessions'");
    console.log('admin_sessions table exists:', rows.length > 0);
    if (rows.length === 0) {
      console.log('\nTable does not exist. Creating it now...');
      // Read and execute just the admin_sessions creation
      const sql = `
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id VARCHAR(36) PRIMARY KEY,
          admin_id INT NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
          INDEX idx_admin_id (admin_id),
          INDEX idx_expires_at (expires_at),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      await pool.query(sql);
      console.log('✅ admin_sessions table created successfully');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTable();
