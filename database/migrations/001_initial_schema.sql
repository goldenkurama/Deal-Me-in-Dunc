-- Deal Me In, Dunc: initial persistent schema
-- Persistent-only database schema
-- MySQL 8.0+
--
-- Intentionally NOT stored here:
--   * cards or deck order
--   * active blackjack hand state
--   * trinket slots or activations
--   * House Rules or remaining durations
--   * pending/future cards
--   * fixed shop catalog, prices, assets, passcodes, or game rules
--
-- Those systems live in TypeScript game/server logic and are cleared when the
-- player leaves or refreshes the table. This schema stores only persistent
-- account, economy, reward, inventory, and equipment data.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- -----------------------------------------------------------------------------
-- Accounts and persistent balances
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username VARCHAR(20) COLLATE utf8mb4_0900_ai_ci NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- New accounts begin with 100 chips. The first authenticated visit of an
    -- Eastern calendar day may add another 100 through daily_login_grants.
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
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Daily rewards
-- Dates are calculated by application code using America/New_York.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS daily_login_grants (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    grant_date DATE NOT NULL COMMENT 'America/New_York calendar date',
    chips_awarded INT UNSIGNED NOT NULL DEFAULT 100,
    granted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    UNIQUE KEY uq_daily_login_user_date (user_id, grant_date),
    KEY idx_daily_login_granted_at (granted_at),

    CONSTRAINT fk_daily_login_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_daily_login_positive
        CHECK (chips_awarded > 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS daily_dealer_attempts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    attempt_date DATE NOT NULL COMMENT 'America/New_York calendar date',

    -- Application-defined outcomes currently include:
    -- rewarded, incorrect, alternate_dialogue.
    outcome VARCHAR(32) NOT NULL,
    chips_awarded INT UNSIGNED NOT NULL DEFAULT 0,
    attempted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    UNIQUE KEY uq_daily_dealer_user_date (user_id, attempt_date),
    KEY idx_daily_dealer_attempted_at (attempted_at),

    CONSTRAINT fk_daily_dealer_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_daily_dealer_outcome
        CHECK (outcome IN ('rewarded', 'incorrect', 'alternate_dialogue')),
    CONSTRAINT chk_daily_dealer_reward
        CHECK (
            (outcome = 'rewarded' AND chips_awarded > 0)
            OR (outcome IN ('incorrect', 'alternate_dialogue') AND chips_awarded = 0)
        )
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Cosmetic ownership and equipment
--
-- The fixed catalog lives in server code. item_key values must remain stable.
-- Default cosmetics are built into the client and do not need ownership rows.
-- An absent equipment row means the built-in default; for decoration it means
-- no decoration.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_items (
    user_id BIGINT UNSIGNED NOT NULL,
    item_key VARCHAR(100) NOT NULL,
    purchased_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (user_id, item_key),
    KEY idx_user_items_item_key (item_key),

    CONSTRAINT fk_user_items_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_user_items_key
        CHECK (CHAR_LENGTH(item_key) BETWEEN 1 AND 100)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_equipment (
    user_id BIGINT UNSIGNED NOT NULL,
    category VARCHAR(32) NOT NULL,
    item_key VARCHAR(100) NOT NULL,
    equipped_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    -- One equipped item per category.
    PRIMARY KEY (user_id, category),
    KEY idx_user_equipment_item_key (item_key),

    CONSTRAINT fk_user_equipment_owned_item
        FOREIGN KEY (user_id, item_key)
        REFERENCES user_items(user_id, item_key)
        ON DELETE CASCADE,
    CONSTRAINT chk_user_equipment_category
        CHECK (category IN (
            'card_back',
            'table',
            'music',
            'win_sound',
            'bust_sound',
            'decoration'
        ))
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Blackjack hands and table runs are intentionally not persisted.
--
-- At hand start, application code may subtract the wager and create a
-- currency_transactions row with a generated transaction_group_key. At hand
-- completion, chip and dunkaroo award rows use that same key. Refreshing or
-- leaving clears the client-side hand, trinkets, House Rule, deck, and offers.
-- If a wager was already deducted, it remains spent.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- Immutable currency ledger
--
-- Every balance change should insert one row in the same SQL transaction that
-- updates users.chips or users.dunkaroos. Do not edit or delete ledger rows in
-- normal operation; corrections should be new admin_adjustment rows.
--
-- A 1:1 dunkaroo-to-chip conversion inserts two rows with the same
-- transaction_group_key:
--   * negative dunkaroos
--   * equal positive chips
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS currency_transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    currency VARCHAR(20) NOT NULL,
    amount BIGINT NOT NULL,
    balance_after BIGINT UNSIGNED NOT NULL,

    -- Examples are defined in server code rather than an SQL ENUM:
    -- account_start, daily_login, dealer_passcode, blackjack_wager,
    -- blackjack_payout, blackjack_dunkaroos, shop_purchase,
    -- currency_exchange_out, currency_exchange_in, admin_adjustment.
    reason VARCHAR(50) NOT NULL,

    transaction_group_key CHAR(36) NULL,
    reference_type VARCHAR(40) NULL,
    reference_id BIGINT UNSIGNED NULL,
    reference_key VARCHAR(100) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (id),
    KEY idx_currency_transactions_user_created (user_id, created_at),
    KEY idx_currency_transactions_group (transaction_group_key),
    KEY idx_currency_transactions_reference (reference_type, reference_id),
    UNIQUE KEY uq_currency_transactions_idempotency (
        user_id, currency, reason, transaction_group_key
    ),

    CONSTRAINT fk_currency_transactions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_currency_transaction_currency
        CHECK (currency IN ('chips', 'dunkaroos')),
    CONSTRAINT chk_currency_transaction_nonzero
        CHECK (amount <> 0)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;
