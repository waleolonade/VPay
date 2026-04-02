-- VPay Professional SQL Schema
-- Standard and Professional Setup for Bills, Wallets, and Users

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255),
    avatar VARCHAR(255),
    role ENUM('user', 'admin') DEFAULT 'user',
    kyc_level INT DEFAULT 0,
    kyc_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Wallets Table
CREATE TABLE IF NOT EXISTS wallets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    total_credit DECIMAL(15, 2) DEFAULT 0.00,
    total_debit DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'NGN',
    status ENUM('active', 'frozen', 'suspended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions Table (General)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(100) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    type ENUM('credit', 'debit') NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'transfer', 'bill', 'loan', etc.
    amount DECIMAL(15, 2) NOT NULL,
    fee DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'NGN',
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    description TEXT,
    narration TEXT,
    status ENUM('pending', 'completed', 'failed', 'reversed') DEFAULT 'pending',
    provider VARCHAR(50),
    provider_reference VARCHAR(255),
    recipient JSON,
    metadata JSON,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Bill Payments Table (VFDTech Integration)
CREATE TABLE IF NOT EXISTS bill_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    transaction_id INT,
    reference VARCHAR(100) UNIQUE NOT NULL,
    provider_reference VARCHAR(255),
    bill_type VARCHAR(50) NOT NULL, -- 'Airtime', 'Cable TV', 'Utility', etc.
    biller_id VARCHAR(50) NOT NULL,
    biller_name VARCHAR(100) NOT NULL,
    customer_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255),
    amount DECIMAL(15, 2) NOT NULL,
    fee DECIMAL(10, 2) DEFAULT 0.00,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    token TEXT, -- For Utility token responses
    metadata JSON,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_user_wallets ON wallets(user_id);
CREATE INDEX idx_user_transactions ON transactions(user_id);
CREATE INDEX idx_transaction_reference ON transactions(reference);
CREATE INDEX idx_bill_reference ON bill_payments(reference);
