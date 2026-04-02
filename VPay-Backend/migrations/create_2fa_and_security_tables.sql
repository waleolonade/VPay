-- Migration: Create 2FA, Activity Logging, Session Management, and IP Whitelist Tables
-- Date: 2026-03-30
-- Description: Adds support for advanced security features

-- Modify admins table to add 2FA columns
ALTER TABLE admins ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255) DEFAULT NULL;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS backup_codes JSON DEFAULT NULL;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS require_ip_whitelist BOOLEAN DEFAULT FALSE;
ALTER TABLE admins ADD INDEX idx_two_factor_enabled (two_factor_enabled);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action),
  INDEX idx_resource_type (resource_type),
  INDEX idx_resource_id (resource_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Sessions Table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id VARCHAR(36) PRIMARY KEY,
  admin_id INT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_expires_at (expires_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- IP Whitelist Table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Login Attempt Log for IP Activity Tracking
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Notification Table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  admin_id INT,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  channels JSON,
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_read (read),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backup Codes Table (for 2FA backup codes tracking)
CREATE TABLE IF NOT EXISTS admin_backup_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  code VARCHAR(10) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  UNIQUE KEY unique_code (code),
  INDEX idx_admin_id (admin_id),
  INDEX idx_used (used),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
