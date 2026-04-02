-- Business Requests Table
-- Stores business account upgrade requests with approval workflow

CREATE TABLE IF NOT EXISTS business_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  business_category VARCHAR(100) NOT NULL,
  cac_number VARCHAR(50) NOT NULL,
  cac_certificate TEXT,
  business_email VARCHAR(255),
  business_phone VARCHAR(20),
  business_address TEXT,
  estimated_monthly_revenue DECIMAL(15,2) DEFAULT 0.00,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by CHAR(36),
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add business fields to users table (if not exists)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_business BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS business_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_category VARCHAR(100);

-- Create index for business users
CREATE INDEX IF NOT EXISTS idx_is_business ON users(is_business);
