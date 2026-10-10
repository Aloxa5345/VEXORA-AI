-- ============================================================
-- vexoraai — Production Database Schema v4.0
-- Phase 9: Step 48 — Production Database
-- ============================================================
--
-- HOW TO RUN THIS FILE
-- ─────────────────────────────────────────────────────────────
--
-- ▶ PlanetScale
--   1. Install pscale CLI: https://github.com/planetscale/cli
--   2. Authenticate:  pscale auth login
--   3. Create DB:     pscale database create vexoraai --region us-east
--   4. Open shell:    pscale shell vexoraai main
--   5. Paste or pipe: pscale shell vexoraai main < production-schema.sql
--   NOTE: PlanetScale does not support FOREIGN KEY constraints by default.
--         FK lines are included for documentation; remove them if needed.
--         PlanetScale also does not support CREATE VIEW — omit view section.
--
-- ▶ Aiven (MySQL)
--   1. Create a MySQL service in the Aiven console.
--   2. Download the CA certificate from the service overview page.
--   3. Connect and run:
--      mysql --host=<host> --port=<port> --user=avnadmin \
--            --password=<password> --ssl-ca=ca.pem \
--            vexoraai < production-schema.sql
--   NOTE: The database must exist first. Create it in the Aiven console
--         or run: CREATE DATABASE vexoraai CHARACTER SET utf8mb4
--                                                COLLATE utf8mb4_unicode_ci;
--
-- ▶ Railway (MySQL plugin)
--   1. Add a MySQL plugin to your Railway project.
--   2. From the Railway dashboard, copy the DATABASE_URL or individual vars.
--   3. Connect with mysql CLI:
--      mysql -h <MYSQL_HOST> -P <MYSQL_PORT> -u <MYSQL_USER> \
--            -p<MYSQL_PASSWORD> <MYSQL_DATABASE> < production-schema.sql
--   NOTE: Railway creates the database automatically; USE statement below
--         switches to it. Replace vexoraai with your Railway DB name if
--         different.
--
-- ─────────────────────────────────────────────────────────────
-- SAFE MIGRATION NOTES
-- If you are upgrading an existing database (not a fresh install),
-- use ALTER TABLE ... ADD COLUMN IF NOT EXISTS patterns shown in
-- comment blocks beneath each table definition.
-- Example:
--   ALTER TABLE users
--     ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL AFTER is_active;
-- Never use DROP TABLE or DROP COLUMN on a live database without a backup.
-- ─────────────────────────────────────────────────────────────
-- NO DROP TABLE statements in this file — safe to run against existing DBs.
-- ============================================================

CREATE DATABASE IF NOT EXISTS vexoraai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vexoraai;

-- ═══════════════════════════════════════════════════════════
-- USERS / ADMINS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED         AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)         NOT NULL,
  email         VARCHAR(150)         NOT NULL UNIQUE,
  password      VARCHAR(255)         NOT NULL,
  role          ENUM('user','admin') DEFAULT 'user',
  is_active     TINYINT(1)           DEFAULT 1,
  last_login_at TIMESTAMP            NULL,
  created_at    TIMESTAMP            DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP            DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email  (email),
  INDEX idx_users_role   (role),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Safe migration (skip if fresh install):
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL AFTER is_active;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1 AFTER role;


-- Admin tokens for extra security (optional 2FA future)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id         INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  admin_id   INT UNSIGNED  NOT NULL,
  token_hash VARCHAR(255)  NOT NULL,
  ip_address VARCHAR(50)   NULL,
  user_agent TEXT          NULL,
  expires_at TIMESTAMP     NOT NULL,
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin_sessions_token   (token_hash),
  INDEX idx_admin_sessions_expires (expires_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Safe migration:
-- ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT NULL AFTER ip_address;


-- ═══════════════════════════════════════════════════════════
-- PROJECTS / FILES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS projects (
  id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED  NULL,
  project_name VARCHAR(150)  NOT NULL,
  description  TEXT          NULL,
  tech_stack   VARCHAR(255)  NULL,
  status       ENUM('active','archived','deleted') DEFAULT 'active',
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_projects_user   (user_id),
  INDEX idx_projects_status (status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Safe migration:
-- ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_stack VARCHAR(255) NULL AFTER description;


CREATE TABLE IF NOT EXISTS project_files (
  id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  project_id  INT UNSIGNED  NOT NULL,
  filename    VARCHAR(255)  NOT NULL,
  language    VARCHAR(50)   DEFAULT 'plaintext',
  content     LONGTEXT      NULL,
  size_bytes  INT UNSIGNED  DEFAULT 0,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_files_project (project_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ═══════════════════════════════════════════════════════════
-- CHATS / MESSAGES
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS chat_sessions (
  id            INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED  NOT NULL,
  session_id    VARCHAR(100)  NOT NULL UNIQUE,
  title         VARCHAR(255)  DEFAULT 'New Chat',
  model_used    VARCHAR(50)   DEFAULT 'gemini-flash-lite',
  message_count INT UNSIGNED  DEFAULT 0,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_chat_sessions_user    (user_id),
  INDEX idx_chat_sessions_session (session_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS chat_history (
  id         INT UNSIGNED              AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED              NOT NULL,
  session_id VARCHAR(100)              NOT NULL,
  role       ENUM('user','assistant')  NOT NULL,
  message    TEXT                      NOT NULL,
  tokens_used INT UNSIGNED             DEFAULT 0,
  created_at TIMESTAMP                 DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_chat_history_user    (user_id),
  INDEX idx_chat_history_session (session_id),
  INDEX idx_chat_history_created (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- Legacy table (kept for backward compat)
CREATE TABLE IF NOT EXISTS conversations (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NULL,
  message    TEXT         NOT NULL,
  response   TEXT         NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversations_user (user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ═══════════════════════════════════════════════════════════
-- AI USAGE
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ai_usage (
  id              INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED  NULL,
  session_id      VARCHAR(100)  NULL,
  provider        ENUM('openai','gemini','unknown') DEFAULT 'gemini',
  model           VARCHAR(100)  NOT NULL,
  prompt_tokens   INT UNSIGNED  DEFAULT 0,
  response_tokens INT UNSIGNED  DEFAULT 0,
  total_tokens    INT UNSIGNED  DEFAULT 0,
  latency_ms      INT UNSIGNED  DEFAULT 0,
  success         TINYINT(1)    DEFAULT 1,
  error_code      VARCHAR(50)   NULL,
  feature         ENUM('chat','refactor','test','docs','sql','project','explain','fix','optimize') DEFAULT 'chat',
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ai_usage_user     (user_id),
  INDEX idx_ai_usage_provider (provider),
  INDEX idx_ai_usage_feature  (feature),
  INDEX idx_ai_usage_created  (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- Daily AI usage summary (for fast analytics)
CREATE TABLE IF NOT EXISTS ai_usage_daily (
  id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  date         DATE          NOT NULL,
  provider     VARCHAR(50)   NOT NULL,
  total_calls  INT UNSIGNED  DEFAULT 0,
  total_tokens INT UNSIGNED  DEFAULT 0,
  unique_users INT UNSIGNED  DEFAULT 0,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ai_daily (date, provider)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ═══════════════════════════════════════════════════════════
-- AUDIT LOGS
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS api_logs (
  id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED  NULL,
  endpoint     VARCHAR(255)  NOT NULL,
  method       VARCHAR(10)   NOT NULL,
  status_code  INT           NOT NULL,
  ip_address   VARCHAR(50)   NULL,
  user_agent   VARCHAR(255)  NULL,
  request_body TEXT          NULL,
  response_ms  INT UNSIGNED  DEFAULT 0,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_api_logs_user    (user_id),
  INDEX idx_api_logs_status  (status_code),
  INDEX idx_api_logs_created (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS audit_logs (
  id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  actor_id    INT UNSIGNED  NULL,
  actor_role  ENUM('user','admin','system') DEFAULT 'user',
  action      VARCHAR(100)  NOT NULL,
  target_type VARCHAR(50)   NULL,
  target_id   INT UNSIGNED  NULL,
  description TEXT          NULL,
  ip_address  VARCHAR(50)   NULL,
  old_value   JSON          NULL,
  new_value   JSON          NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_actor   (actor_id),
  INDEX idx_audit_action  (action),
  INDEX idx_audit_target  (target_type, target_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ═══════════════════════════════════════════════════════════
-- CODE SNIPPETS (IDE)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS code_snippets (
  id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED  NOT NULL,
  title       VARCHAR(255)  DEFAULT 'Untitled Snippet',
  language    VARCHAR(50)   DEFAULT 'javascript',
  code        LONGTEXT      NOT NULL,
  description TEXT          NULL,
  is_public   TINYINT(1)    DEFAULT 0,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_snippets_user     (user_id),
  INDEX idx_snippets_language (language)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ═══════════════════════════════════════════════════════════
-- PASSWORD RESET TOKENS (OTP / Forgot Password)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED  NOT NULL,
  otp_hash   VARCHAR(255)  NOT NULL,
  expires_at TIMESTAMP     NOT NULL,
  used       TINYINT(1)    DEFAULT 0,
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_prt_expires (expires_at),
  INDEX idx_prt_user    (user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- Safe migration (add to existing databases):
-- ALTER TABLE password_reset_tokens ADD COLUMN IF NOT EXISTS used TINYINT(1) DEFAULT 0 AFTER expires_at;


-- ═══════════════════════════════════════════════════════════
-- VIEWS FOR QUICK REPORTING
-- ═══════════════════════════════════════════════════════════
-- NOTE: PlanetScale does not support views — skip this section on PlanetScale.

CREATE OR REPLACE VIEW v_user_stats AS
SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  u.is_active,
  u.created_at,
  COUNT(DISTINCT cs.session_id) AS total_sessions,
  COUNT(ch.id)                  AS total_messages,
  MAX(ch.created_at)            AS last_active
FROM users u
LEFT JOIN chat_history ch ON ch.user_id = u.id
LEFT JOIN chat_sessions cs ON cs.user_id = u.id
GROUP BY u.id;

CREATE OR REPLACE VIEW v_daily_ai_usage AS
SELECT
  DATE(created_at)                                AS date,
  provider,
  COUNT(*)                                        AS total_calls,
  SUM(total_tokens)                               AS total_tokens,
  COUNT(DISTINCT user_id)                         AS unique_users,
  AVG(latency_ms)                                 AS avg_latency_ms,
  SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END)   AS error_count
FROM ai_usage
GROUP BY DATE(created_at), provider
ORDER BY date DESC;

-- ============================================================
-- END OF PRODUCTION SCHEMA
-- ============================================================
