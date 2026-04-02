const { pool } = require('../config/database');

const run = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS invoices (
                id CHAR(36) NOT NULL DEFAULT (UUID()),
                user_id CHAR(36) NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                customer_email VARCHAR(255) NULL,
                amount DECIMAL(18,2) NOT NULL,
                description TEXT NULL,
                due_date DATE NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                slug VARCHAR(50) NOT NULL,
                paid_at DATETIME NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uq_invoice_slug (slug),
                KEY idx_invoice_user (user_id),
                CONSTRAINT fk_invoice_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                CONSTRAINT chk_invoice_status CHECK (status IN ('pending','paid','cancelled','overdue'))
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('Invoices table created');
        process.exit();
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
};

run();
