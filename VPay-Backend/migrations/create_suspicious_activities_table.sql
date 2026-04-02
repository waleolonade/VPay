CREATE TABLE IF NOT EXISTS suspicious_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    activity_type VARCHAR(100),
    details TEXT,
    ip VARCHAR(45),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
