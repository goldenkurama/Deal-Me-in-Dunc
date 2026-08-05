-- Fox Blackjack initial schema
-- MySQL 8+

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(20) COLLATE utf8mb4_0900_ai_ci NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    chips BIGINT UNSIGNED NOT NULL DEFAULT 100,
    dunkaroos BIGINT UNSIGNED NOT NULL DEFAULT 0,
    last_login_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    CONSTRAINT chk_users_username_length
        CHECK (CHAR_LENGTH(username) BETWEEN 3 AND 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS daily_login_grants (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    grant_date DATE NOT NULL COMMENT 'Eastern calendar date',
    chips_awarded INT UNSIGNED NOT NULL DEFAULT 100,
    granted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_daily_login_user_date (user_id, grant_date),
    KEY idx_daily_login_granted_at (granted_at),
    CONSTRAINT fk_daily_login_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_daily_login_positive
        CHECK (chips_awarded > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS daily_dealer_attempts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    attempt_date DATE NOT NULL COMMENT 'Eastern calendar date',
    weekday_name ENUM(
        'sunday', 'monday', 'tuesday', 'wednesday',
        'thursday', 'friday', 'saturday'
    ) NOT NULL,
    outcome ENUM('rewarded', 'incorrect', 'alternate_dialogue') NOT NULL,
    chips_awarded INT UNSIGNED NOT NULL DEFAULT 0,
    attempted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_daily_dealer_user_date (user_id, attempt_date),
    KEY idx_daily_dealer_attempted_at (attempted_at),
    CONSTRAINT fk_daily_dealer_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_daily_dealer_reward
        CHECK (
            (outcome = 'rewarded' AND chips_awarded > 0)
            OR (outcome IN ('incorrect', 'alternate_dialogue') AND chips_awarded = 0)
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_items (
    user_id BIGINT UNSIGNED NOT NULL,
    item_key VARCHAR(100) NOT NULL,
    purchased_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, item_key),
    KEY idx_user_items_item_key (item_key),
    CONSTRAINT fk_user_items_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_equipment (
    user_id BIGINT UNSIGNED NOT NULL,
    category ENUM(
        'card_back',
        'table',
        'music',
        'win_sound',
        'bust_sound',
        'decoration'
    ) NOT NULL,
    item_key VARCHAR(100) NULL,
    equipped_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (user_id, category),
    KEY idx_user_equipment_item_key (item_key),
    CONSTRAINT fk_user_equipment_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS game_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    wager_chips INT UNSIGNED NOT NULL,
    status ENUM('in_progress', 'completed', 'abandoned') NOT NULL DEFAULT 'in_progress',
    result ENUM(
        'player_blackjack',
        'player_win',
        'dealer_bust',
        'push',
        'player_bust',
        'dealer_win',
        'dealer_blackjack'
    ) NULL,
    chips_returned INT UNSIGNED NOT NULL DEFAULT 0,
    chip_profit BIGINT NOT NULL DEFAULT 0,
    dunkaroos_awarded BIGINT UNSIGNED NOT NULL DEFAULT 0,
    player_cards JSON NULL,
    dealer_cards JSON NULL,
    started_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    completed_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    KEY idx_game_sessions_user_started (user_id, started_at),
    CONSTRAINT fk_game_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_game_wager
        CHECK (wager_chips BETWEEN 10 AND 100 AND MOD(wager_chips, 10) = 0),
    CONSTRAINT chk_game_completed_result
        CHECK (
            (status = 'in_progress' AND result IS NULL AND completed_at IS NULL)
            OR (status = 'abandoned' AND completed_at IS NOT NULL)
            OR (status = 'completed' AND result IS NOT NULL AND completed_at IS NOT NULL)
        ),
    CONSTRAINT chk_game_dunkaroos_profit
        CHECK (dunkaroos_awarded = GREATEST(chip_profit, 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS currency_transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    currency ENUM('chips', 'dunkaroos') NOT NULL,
    amount BIGINT NOT NULL,
    reason VARCHAR(40) NOT NULL,
    balance_after BIGINT UNSIGNED NOT NULL,
    reference_type VARCHAR(40) NULL,
    reference_id BIGINT UNSIGNED NULL,
    reference_key VARCHAR(100) NULL,
    metadata JSON NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_currency_transactions_user_created (user_id, created_at),
    KEY idx_currency_transactions_reference (reference_type, reference_id),
    CONSTRAINT fk_currency_transactions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_currency_transaction_nonzero
        CHECK (amount <> 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
