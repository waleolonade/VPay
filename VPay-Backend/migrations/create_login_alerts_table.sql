CREATE TABLE IF NOT EXISTS login_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    ip VARCHAR(45),
    device VARCHAR(255),
    location VARCHAR(255),
    alert_type VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
