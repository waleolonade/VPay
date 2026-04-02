/**
 * Savings Table Schema
 * This file documents the database structure for the savings feature
 */

-- Create savings table if it doesn't exist
CREATE TABLE IF NOT EXISTS savings (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  reference VARCHAR(50) UNIQUE NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  target_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  interest_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.0000,
  interest_earned DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'monthly',
  auto_save_amount DECIMAL(15, 2) DEFAULT 0.00,
  auto_save_rule VARCHAR(50) DEFAULT NULL,
  rule_value VARCHAR(100) DEFAULT NULL,
  is_auto_save BOOLEAN DEFAULT FALSE,
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  maturity_date DATE DEFAULT NULL,
  status ENUM('active', 'completed', 'broken') DEFAULT 'active',
  completed_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_reference (reference),
  INDEX idx_status (status),
  INDEX idx_user_status (user_id, status),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample query to get savings summary
-- SELECT 
--   COALESCE(SUM(current_balance), 0) as totalBalance,
--   COALESCE(SUM(interest_earned), 0) as totalInterest,
--   COUNT(CASE WHEN status = 'active' THEN 1 END) as activePlans,
--   COUNT(*) as totalPlans
-- FROM savings 
-- WHERE user_id = 'user-uuid-here';
