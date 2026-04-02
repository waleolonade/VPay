-- =============================================================================
-- VPay MySQL Database Initialisation Script
-- Compatible with MySQL 8.0+ (XAMPP, MySQL Community, PlanetScale, etc.)
-- Run via: npm run init  OR  npm run db:init
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- TABLE: users
-- =============================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`                   CHAR(36)       NOT NULL DEFAULT (UUID()),
  `first_name`           VARCHAR(100)   NOT NULL,
  `last_name`            VARCHAR(100)   NOT NULL,
  `email`                VARCHAR(255)   NOT NULL,
  `phone`                VARCHAR(20)    NOT NULL,
  `password_hash`        TEXT           NOT NULL,
  `pin_hash`             TEXT           NULL,
  `avatar`               TEXT           NULL DEFAULT (''),
  `date_of_birth`        DATE           NULL,
  `gender`               VARCHAR(10)    NULL,
  `address_street`       VARCHAR(255)   NULL,
  `address_city`         VARCHAR(100)   NULL,
  `address_state`        VARCHAR(100)   NULL,
  `address_country`      VARCHAR(100)   NULL DEFAULT 'Nigeria',
  `bvn`                  VARCHAR(50)    NULL,
  `nin`                  VARCHAR(50)    NULL,
  `kyc_level`            TINYINT        NOT NULL DEFAULT 0,
  `kyc_status`           VARCHAR(20)    NOT NULL DEFAULT 'pending',
  `is_email_verified`    TINYINT(1)     NOT NULL DEFAULT 0,
  `is_phone_verified`    TINYINT(1)     NOT NULL DEFAULT 0,
  `is_active`            TINYINT(1)     NOT NULL DEFAULT 1,
  `is_biometric_enabled` TINYINT(1)     NOT NULL DEFAULT 0,
  `role`                 VARCHAR(20)    NOT NULL DEFAULT 'user',
  `referral_code`        VARCHAR(20)    NULL,
  `referred_by`          CHAR(36)       NULL,
  `last_login`           DATETIME       NULL,
  `login_attempts`       TINYINT        NOT NULL DEFAULT 0,
  `lock_until`           DATETIME       NULL,
  `refresh_token`        TEXT           NULL,
  `is_business`         TINYINT(1)     NOT NULL DEFAULT 0,
  `created_at`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email`         (`email`),
  UNIQUE KEY `uq_users_phone`         (`phone`),
  UNIQUE KEY `uq_users_referral_code` (`referral_code`),
  CONSTRAINT `chk_users_gender`     CHECK (`gender`     IN ('male','female','other')),
  CONSTRAINT `chk_users_kyc_level`  CHECK (`kyc_level`  BETWEEN 0 AND 3),
  CONSTRAINT `chk_users_kyc_status` CHECK (`kyc_status` IN ('pending','verified','rejected')),
  CONSTRAINT `chk_users_role`       CHECK (`role`       IN ('user','admin','superadmin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: user_device_tokens
-- =============================================================================
CREATE TABLE IF NOT EXISTS `user_device_tokens` (
  `id`         CHAR(36)     NOT NULL DEFAULT (UUID()),
  `user_id`    CHAR(36)     NOT NULL,
  `token`      VARCHAR(512) NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_device_token` (`user_id`, `token`),
  KEY `idx_device_tokens_user` (`user_id`),
  CONSTRAINT `fk_device_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: wallets
-- =============================================================================
CREATE TABLE IF NOT EXISTS `wallets` (
  `id`                CHAR(36)       NOT NULL DEFAULT (UUID()),
  `user_id`           CHAR(36)       NOT NULL,
  `balance`           DECIMAL(18,2)  NOT NULL DEFAULT 0,
  `currency`          CHAR(3)        NOT NULL DEFAULT 'NGN',
  `account_number`    VARCHAR(20)    NULL,
  `account_name`      VARCHAR(255)   NULL,
  `bank_name`         VARCHAR(100)   NULL DEFAULT 'VPay MFB',
  `wallet_type`       VARCHAR(20)    NOT NULL DEFAULT 'personal', -- 'personal' | 'business'
  `is_active`         TINYINT(1)     NOT NULL DEFAULT 1,
  `is_frozen`         TINYINT(1)     NOT NULL DEFAULT 0,
  `daily_limit`       DECIMAL(18,2)  NOT NULL DEFAULT 500000,
  `transaction_limit` DECIMAL(18,2)  NOT NULL DEFAULT 200000,
  `total_credit`      DECIMAL(18,2)  NOT NULL DEFAULT 0,
  `total_debit`       DECIMAL(18,2)  NOT NULL DEFAULT 0,
  `created_at`        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wallets_user`           (`user_id`),
  UNIQUE KEY `uq_wallets_account_number` (`account_number`),
  CONSTRAINT `fk_wallets_user`    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_wallet_balance` CHECK (`balance` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: transactions
-- =============================================================================
CREATE TABLE IF NOT EXISTS `transactions` (
  `id`                  CHAR(36)      NOT NULL DEFAULT (UUID()),
  `reference`           VARCHAR(100)  NOT NULL,
  `user_id`             CHAR(36)      NOT NULL,
  `type`                VARCHAR(10)   NOT NULL,
  `category`            VARCHAR(20)   NOT NULL,
  `amount`              DECIMAL(18,2) NOT NULL,
  `fee`                 DECIMAL(18,2) NOT NULL DEFAULT 0,
  `currency`            CHAR(3)       NOT NULL DEFAULT 'NGN',
  `balance_before`      DECIMAL(18,2) NULL,
  `balance_after`       DECIMAL(18,2) NULL,
  `description`         TEXT          NULL,
  `narration`           TEXT          NULL,
  `status`              VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `metadata`            JSON          NULL,
  `recipient_name`      VARCHAR(255)  NULL,
  `recipient_account`   VARCHAR(20)   NULL,
  `recipient_bank_code` VARCHAR(10)   NULL,
  `recipient_bank_name` VARCHAR(100)  NULL,
  `recipient_phone`     VARCHAR(20)   NULL,
  `provider`            VARCHAR(100)  NULL,
  `provider_reference`  VARCHAR(255)  NULL,
  `completed_at`        DATETIME      NULL,
  `failure_reason`      TEXT          NULL,
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_txn_reference` (`reference`),
  KEY `idx_txn_user_date`  (`user_id`, `created_at`),
  KEY `idx_txn_status`     (`status`),
  KEY `idx_txn_category`   (`category`),
  CONSTRAINT `fk_txn_user`      FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_txn_type`     CHECK (`type`     IN ('credit','debit')),
  CONSTRAINT `chk_txn_category` CHECK (`category` IN ('transfer','airtime','data','bill','loan','savings','investment','refund','reward','withdrawal','deposit')),
  CONSTRAINT `chk_txn_status`   CHECK (`status`   IN ('pending','processing','completed','failed','reversed')),
  CONSTRAINT `chk_txn_amount`   CHECK (`amount`   >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: loans
-- =============================================================================
CREATE TABLE IF NOT EXISTS `loans` (
  `id`                  CHAR(36)      NOT NULL DEFAULT (UUID()),
  `user_id`             CHAR(36)      NOT NULL,
  `reference`           VARCHAR(100)  NOT NULL,
  `amount`              DECIMAL(18,2) NOT NULL,
  `interest_rate`       DECIMAL(8,4)  NOT NULL,
  `duration_months`     SMALLINT      NOT NULL,
  `total_repayable`     DECIMAL(18,2) NOT NULL,
  `amount_repaid`       DECIMAL(18,2) NOT NULL DEFAULT 0,
  `outstanding_balance` DECIMAL(18,2) NULL,
  `purpose`             TEXT          NULL,
  `status`              VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `due_date`            DATE          NULL,
  `disbursed_at`        DATETIME      NULL,
  `completed_at`        DATETIME      NULL,
  `rejection_reason`    TEXT          NULL,
  `approved_by`         CHAR(36)      NULL,
  `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_loans_reference` (`reference`),
  KEY `idx_loans_user_status` (`user_id`, `status`),
  CONSTRAINT `fk_loans_user`        FOREIGN KEY (`user_id`)     REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_loans_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_loan_status`      CHECK (`status` IN ('pending','approved','disbursed','active','completed','defaulted','rejected')),
  CONSTRAINT `chk_loan_amount`      CHECK (`amount` >= 1000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: loan_repayment_schedule
-- =============================================================================
CREATE TABLE IF NOT EXISTS `loan_repayment_schedule` (
  `id`         CHAR(36)      NOT NULL DEFAULT (UUID()),
  `loan_id`    CHAR(36)      NOT NULL,
  `due_date`   DATE          NOT NULL,
  `amount`     DECIMAL(18,2) NOT NULL,
  `is_paid`    TINYINT(1)    NOT NULL DEFAULT 0,
  `paid_at`    DATETIME      NULL,
  `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_repayment_loan` (`loan_id`),
  CONSTRAINT `fk_repayment_loan` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: savings
-- =============================================================================
CREATE TABLE IF NOT EXISTS `savings` (
  `id`               CHAR(36)      NOT NULL DEFAULT (UUID()),
  `user_id`          CHAR(36)      NOT NULL,
  `reference`        VARCHAR(100)  NOT NULL,
  `plan_name`        VARCHAR(255)  NOT NULL,
  `target_amount`    DECIMAL(18,2) NOT NULL,
  `current_balance`  DECIMAL(18,2) NOT NULL DEFAULT 0,
  `interest_rate`    DECIMAL(8,4)  NOT NULL DEFAULT 0.08,
  `interest_earned`  DECIMAL(18,2) NOT NULL DEFAULT 0,
  `frequency`        VARCHAR(20)   NOT NULL,
  `auto_save_amount` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `auto_save_rule`   VARCHAR(50)   NULL,
  `rule_value`       DECIMAL(18,2) NULL,
  `start_date`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `maturity_date`    DATETIME      NULL,
  `status`           VARCHAR(20)   NOT NULL DEFAULT 'active',
  `is_auto_save`     TINYINT(1)    NOT NULL DEFAULT 0,
  `completed_at`     DATETIME      NULL,
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_savings_reference` (`reference`),
  KEY `idx_savings_user_status` (`user_id`, `status`),
  CONSTRAINT `fk_savings_user`    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_savings_freq`   CHECK (`frequency` IN ('daily','weekly','monthly','one-time')),
  CONSTRAINT `chk_savings_status` CHECK (`status`    IN ('active','paused','completed','broken')),
  CONSTRAINT `chk_savings_target` CHECK (`target_amount` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: subscriptions
-- =============================================================================
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id`                CHAR(36)      NOT NULL DEFAULT (UUID()),
  `user_id`           CHAR(36)      NOT NULL,
  `service_name`      VARCHAR(255)  NOT NULL,
  `amount`            DECIMAL(18,2) NOT NULL,
  `billing_cycle`     VARCHAR(20)   NOT NULL,
  `next_billing_date` DATE          NOT NULL,
  `status`            VARCHAR(20)   NOT NULL DEFAULT 'active',
  `remind_me`         TINYINT(1)    NOT NULL DEFAULT 1,
  `created_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_subs_user_status` (`user_id`, `status`),
  CONSTRAINT `fk_subs_user`   FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_subs_cycle` CHECK (`billing_cycle` IN ('weekly','monthly','yearly')),
  CONSTRAINT `chk_subs_status` CHECK (`status` IN ('active','paused','cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: investments
-- =============================================================================
CREATE TABLE IF NOT EXISTS `investments` (
  `id`             CHAR(36)      NOT NULL DEFAULT (UUID()),
  `user_id`        CHAR(36)      NOT NULL,
  `reference`      VARCHAR(100)  NOT NULL,
  `plan_name`      VARCHAR(255)  NOT NULL,
  `amount`         DECIMAL(18,2) NOT NULL,
  `current_value`  DECIMAL(18,2) NULL,
  `returns`        DECIMAL(18,2) NOT NULL DEFAULT 0,
  `return_rate`    DECIMAL(8,4)  NOT NULL,
  `duration_days`  INT           NOT NULL,
  `maturity_date`  DATETIME      NOT NULL,
  `start_date`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status`         VARCHAR(20)   NOT NULL DEFAULT 'active',
  `is_rolled_over` TINYINT(1)    NOT NULL DEFAULT 0,
  `matured_at`     DATETIME      NULL,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_investments_reference` (`reference`),
  KEY `idx_investments_user_status` (`user_id`, `status`),
  CONSTRAINT `fk_investments_user`   FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_investment_status` CHECK (`status` IN ('active','matured','withdrawn','cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: notifications
-- =============================================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         CHAR(36)     NOT NULL DEFAULT (UUID()),
  `user_id`    CHAR(36)     NOT NULL,
  `title`      VARCHAR(255) NOT NULL,
  `body`       TEXT         NOT NULL,
  `type`       VARCHAR(20)  NOT NULL DEFAULT 'system',
  `is_read`    TINYINT(1)   NOT NULL DEFAULT 0,
  `read_at`    DATETIME     NULL,
  `data`       JSON         NULL,
  `channel`    VARCHAR(10)  NOT NULL DEFAULT 'in-app',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notif_user_unread` (`user_id`, `is_read`, `created_at`),
  CONSTRAINT `fk_notif_user`     FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_notif_type`    CHECK (`type`    IN ('transaction','loan','savings','investment','promotion','system','security')),
  CONSTRAINT `chk_notif_channel` CHECK (`channel` IN ('push','email','sms','in-app'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: referrals
-- =============================================================================
CREATE TABLE IF NOT EXISTS `referrals` (
  `id`            CHAR(36)      NOT NULL DEFAULT (UUID()),
  `referrer_id`   CHAR(36)      NOT NULL,
  `referee_id`    CHAR(36)      NOT NULL,
  `code`          VARCHAR(20)   NOT NULL,
  `status`        VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `reward_amount` DECIMAL(18,2) NOT NULL DEFAULT 0,
  `rewarded_at`   DATETIME      NULL,
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_referrals_referee` (`referee_id`),
  KEY `idx_referrals_referrer` (`referrer_id`),
  CONSTRAINT `fk_referrals_referrer` FOREIGN KEY (`referrer_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_referrals_referee`  FOREIGN KEY (`referee_id`)  REFERENCES `users` (`id`),
  CONSTRAINT `chk_referral_status`   CHECK (`status` IN ('pending','completed','rewarded'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: rewards
-- =============================================================================
CREATE TABLE IF NOT EXISTS `rewards` (
  `id`              CHAR(36)     NOT NULL DEFAULT (UUID()),
  `user_id`         CHAR(36)     NOT NULL,
  `type`            VARCHAR(20)  NOT NULL,
  `points`          INT          NOT NULL DEFAULT 0,
  `total_points`    INT          NOT NULL DEFAULT 0,
  `redeemed_points` INT          NOT NULL DEFAULT 0,
  `description`     TEXT         NULL,
  `reference`       VARCHAR(100) NULL,
  `is_redeemed`     TINYINT(1)   NOT NULL DEFAULT 0,
  `redeemed_at`     DATETIME     NULL,
  `expires_at`      DATETIME     NULL,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rewards_user` (`user_id`),
  CONSTRAINT `fk_rewards_user`   FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_reward_type`   CHECK (`type`   IN ('referral','transaction','sign_up','loyalty','promo')),
  CONSTRAINT `chk_reward_points` CHECK (`points` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: bank_accounts
-- =============================================================================
CREATE TABLE IF NOT EXISTS `bank_accounts` (
  `id`             CHAR(36)     NOT NULL DEFAULT (UUID()),
  `user_id`        CHAR(36)     NOT NULL,
  `account_name`   VARCHAR(255) NOT NULL,
  `account_number` VARCHAR(20)  NOT NULL,
  `bank_code`      VARCHAR(10)  NOT NULL,
  `bank_name`      VARCHAR(100) NOT NULL,
  `is_default`     TINYINT(1)   NOT NULL DEFAULT 0,
  `is_verified`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bank_accounts_user` (`user_id`),
  CONSTRAINT `fk_bank_accounts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: beneficiaries
-- =============================================================================
CREATE TABLE IF NOT EXISTS `beneficiaries` (
  `id`             CHAR(36)     NOT NULL DEFAULT (UUID()),
  `user_id`        CHAR(36)     NOT NULL,
  `type`           VARCHAR(20)  NOT NULL,
  `nickname`       VARCHAR(100) NULL,
  `account_name`   VARCHAR(255) NULL,
  `account_number` VARCHAR(20)  NULL,
  `bank_code`      VARCHAR(10)  NULL,
  `bank_name`      VARCHAR(100) NULL,
  `phone`          VARCHAR(20)  NULL,
  `network`        VARCHAR(20)  NULL,
  `biller_id`      VARCHAR(100) NULL,
  `biller_name`    VARCHAR(255) NULL,
  `is_favorite`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_beneficiaries_user` (`user_id`),
  CONSTRAINT `fk_beneficiaries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_beneficiary_type`  CHECK (`type` IN ('bank','vpay','airtime','data','bill'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: cards
-- =============================================================================
CREATE TABLE IF NOT EXISTS `cards` (
  `id`                 CHAR(36)     NOT NULL DEFAULT (UUID()),
  `user_id`            CHAR(36)     NOT NULL,
  `card_type`          VARCHAR(15)  NOT NULL,
  `last4`              CHAR(4)      NOT NULL,
  `expiry_month`       CHAR(2)      NOT NULL,
  `expiry_year`        CHAR(4)      NOT NULL,
  `cardholder_name`    VARCHAR(255) NOT NULL,
  `bank`               VARCHAR(100) NULL,
  `authorization_code` TEXT         NULL,
  `signature`          TEXT         NULL,
  `is_default`         TINYINT(1)   NOT NULL DEFAULT 0,
  `is_active`          TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cards_user` (`user_id`),
  CONSTRAINT `fk_cards_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_card_type` CHECK (`card_type` IN ('visa','mastercard','verve'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: otps
-- =============================================================================
CREATE TABLE IF NOT EXISTS `otps` (
  `id`         CHAR(36)     NOT NULL DEFAULT (UUID()),
  `user_id`    CHAR(36)     NULL,
  `phone`      VARCHAR(20)  NULL,
  `email`      VARCHAR(255) NULL,
  `otp_hash`   TEXT         NOT NULL,
  `type`       VARCHAR(30)  NOT NULL,
  `is_used`    TINYINT(1)   NOT NULL DEFAULT 0,
  `attempts`   TINYINT      NOT NULL DEFAULT 0,
  `expires_at` DATETIME     NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_otps_user`    (`user_id`),
  KEY `idx_otps_expires` (`expires_at`),
  KEY `idx_otps_phone`   (`phone`),
  KEY `idx_otps_email`   (`email`),
  CONSTRAINT `fk_otps_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_otp_type` CHECK (`type` IN ('phone_verification','email_verification','password_reset','transaction','login','admin_login'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: airtime_purchases
-- =============================================================================
CREATE TABLE IF NOT EXISTS `airtime_purchases` (
  `id`                 CHAR(36)      NOT NULL DEFAULT (UUID()),
  `user_id`            CHAR(36)      NOT NULL,
  `reference`          VARCHAR(100)  NOT NULL,
  `phone`              VARCHAR(20)   NOT NULL,
  `network`            VARCHAR(10)   NOT NULL,
  `amount`             DECIMAL(18,2) NOT NULL,
  `fee`                DECIMAL(18,2) NOT NULL DEFAULT 0,
  `status`             VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `provider_reference` VARCHAR(255)  NULL,
  `completed_at`       DATETIME      NULL,
  `created_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_airtime_reference` (`reference`),
  KEY `idx_airtime_user_date` (`user_id`, `created_at`),
  CONSTRAINT `fk_airtime_user`     FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_airtime_network` CHECK (`network` IN ('mtn','airtel','glo','9mobile')),
  CONSTRAINT `chk_airtime_status`  CHECK (`status`  IN ('pending','processing','completed','failed')),
  CONSTRAINT `chk_airtime_amount`  CHECK (`amount`  >= 50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: data_purchases
-- =============================================================================
CREATE TABLE IF NOT EXISTS `data_purchases` (
  `id`                 CHAR(36)      NOT NULL DEFAULT (UUID()),
  `user_id`            CHAR(36)      NOT NULL,
  `reference`          VARCHAR(100)  NOT NULL,
  `phone`              VARCHAR(20)   NOT NULL,
  `network`            VARCHAR(10)   NOT NULL,
  `payment_code`       VARCHAR(100)  NOT NULL,
  `plan_name`          VARCHAR(255)  NOT NULL,
  `amount`             DECIMAL(18,2) NOT NULL,
  `data_size`          VARCHAR(50)   NULL,
  `validity`           VARCHAR(50)   NULL,
  `fee`                DECIMAL(18,2) NOT NULL DEFAULT 0,
  `status`             VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `provider_reference` VARCHAR(255)  NULL,
  `completed_at`       DATETIME      NULL,
  `created_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_data_reference` (`reference`),
  KEY `idx_data_user_date` (`user_id`, `created_at`),
  CONSTRAINT `fk_data_user`    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_data_network` CHECK (`network` IN ('mtn','airtel','glo','9mobile')),
  CONSTRAINT `chk_data_status`  CHECK (`status`  IN ('pending','processing','completed','failed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLE: bill_payments
-- =============================================================================
CREATE TABLE IF NOT EXISTS `bill_payments` (
  `id`                 CHAR(36)      NOT NULL DEFAULT (UUID()),
  `user_id`            CHAR(36)      NOT NULL,
  `reference`          VARCHAR(100)  NOT NULL,
  `bill_type`          VARCHAR(30)   NOT NULL,
  `biller_id`          VARCHAR(100)  NOT NULL,
  `biller_name`        VARCHAR(255)  NOT NULL,
  `customer_name`      VARCHAR(255)  NULL,
  `customer_number`    VARCHAR(100)  NOT NULL,
  `division`           VARCHAR(100)  NULL,
  `payment_item`       VARCHAR(100)  NULL,
  `product_id`         VARCHAR(100)  NULL,
  `amount`             DECIMAL(18,2) NOT NULL,
  `fee`                DECIMAL(18,2) NOT NULL DEFAULT 0,
  `status`             VARCHAR(20)   NOT NULL DEFAULT 'pending',
  `provider_reference` VARCHAR(255)  NULL,
  `token`              TEXT          NULL,
  `metadata`           JSON          NULL,
  `completed_at`       DATETIME      NULL,
  `created_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bills_reference` (`reference`),
  KEY `idx_bills_user_date` (`user_id`, `created_at`),
  CONSTRAINT `fk_bills_user`   FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_bill_type`   CHECK (`bill_type` IN ('airtime','data','utility','electricity','water','cable_tv','internet','internet_subscription','dstv','gotv','startimes','jamb','waec','neco')),
  CONSTRAINT `chk_bill_status` CHECK (`status`    IN ('pending','processing','completed','failed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- FOREIGN KEY: users.referred_by -> users.id (self-reference, added last)
-- =============================================================================
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_referred_by`
  FOREIGN KEY IF NOT EXISTS (`referred_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- =============================================================================
-- SEED: default superadmin (change password on first login)
-- password_hash = bcrypt("Admin@VPay2026!")  rounds=12
-- =============================================================================
INSERT IGNORE INTO `users`
  (`id`, `first_name`, `last_name`, `email`, `phone`, `password_hash`,
   `role`, `is_email_verified`, `is_phone_verified`, `is_active`, `referral_code`)
VALUES
  (UUID(), 'VPay', 'Admin', 'admin@vpay.ng', '+2340000000000',
   '$2b$12$placeholderHashReplaceThisBeforeDeployment000000000000000',
   'superadmin', 1, 1, 1, 'VPAY-ADMIN');

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'VPay MySQL database initialised successfully.' AS status;
