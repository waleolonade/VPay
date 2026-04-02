const { pool } = require('./VPay-Backend/config/database');

async function setup() {
  try {
    console.log('Initializing Business Payroll Tables...');

    // 1. Create Staff Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS business_staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        account_number VARCHAR(20) NOT NULL,
        bank_name VARCHAR(100) NOT NULL,
        bank_code VARCHAR(10),
        base_salary DECIMAL(15, 2) DEFAULT 0.00,
        status ENUM('active', 'pending', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_business (business_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✔ business_staff table ready');

    // 2. Create Payroll Logs Table (History)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payroll_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        staff_id INT, -- NULL for bulk reports if aggregated
        amount DECIMAL(15, 2) NOT NULL,
        type ENUM('salary', 'bonus', 'deduction') DEFAULT 'salary',
        reference VARCHAR(100) UNIQUE,
        status ENUM('success', 'failed', 'pending') DEFAULT 'success',
        narration TEXT,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_business_history (business_id),
        INDEX idx_staff_history (staff_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✔ payroll_logs table ready');

    console.log('Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setup();
