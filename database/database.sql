-- ============================================================
-- vexoraai — Complete Database Schema v3.0
-- Phase 4: Steps 19–24
-- ============================================================

CREATE DATABASE IF NOT EXISTS vexoraai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vexoraai;

-- ═══════════════════════════════════════════════════════════
-- STEP 19 — MySQL Architecture
-- Core design: normalized, indexed, FK-constrained
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- STEP 20 — Users / Admins
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED     AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)     NOT NULL,
  email         VARCHAR(150)     NOT NULL UNIQUE,
  password      VARCHAR(255)     NOT NULL,
  role          ENUM('user','admin') DEFAULT 'user',
  is_active     TINYINT(1)       DEFAULT 1,
  last_login_at TIMESTAMP        NULL,
  created_at    TIMESTAMP        DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP        DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email  (email),
  INDEX idx_users_role   (role),
  INDEX idx_users_active (is_active)
);

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
);

-- ─────────────────────────────────────────────────────────
-- STEP 21 — Projects / Files
-- ─────────────────────────────────────────────────────────
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
);

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
);

-- ─────────────────────────────────────────────────────────
-- STEP 22 — Chats / Messages
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED  NOT NULL,
  session_id  VARCHAR(100)  NOT NULL UNIQUE,
  title       VARCHAR(255)  DEFAULT 'New Chat',
  model_used  VARCHAR(50)   DEFAULT 'gemini-flash-lite',
  message_count INT UNSIGNED DEFAULT 0,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_chat_sessions_user    (user_id),
  INDEX idx_chat_sessions_session (session_id)
);

CREATE TABLE IF NOT EXISTS chat_history (
  id          INT UNSIGNED              AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED              NOT NULL,
  session_id  VARCHAR(100)             NOT NULL,
  role        ENUM('user','assistant') NOT NULL,
  message     TEXT                     NOT NULL,
  tokens_used INT UNSIGNED             DEFAULT 0,
  created_at  TIMESTAMP                DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_chat_history_user    (user_id),
  INDEX idx_chat_history_session (session_id),
  INDEX idx_chat_history_created (created_at)
);

-- Legacy table (kept for backward compat)
CREATE TABLE IF NOT EXISTS conversations (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NULL,
  message    TEXT         NOT NULL,
  response   TEXT         NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conversations_user (user_id)
);

-- ─────────────────────────────────────────────────────────
-- STEP 23 — AI Usage
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage (
  id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED  NULL,
  session_id   VARCHAR(100)  NULL,
  provider     ENUM('openai','gemini','unknown') DEFAULT 'gemini',
  model        VARCHAR(100)  NOT NULL,
  prompt_tokens   INT UNSIGNED DEFAULT 0,
  response_tokens INT UNSIGNED DEFAULT 0,
  total_tokens    INT UNSIGNED DEFAULT 0,
  latency_ms      INT UNSIGNED DEFAULT 0,
  success      TINYINT(1)    DEFAULT 1,
  error_code   VARCHAR(50)   NULL,
  feature      ENUM('chat','refactor','test','docs','sql','project','explain','fix','optimize') DEFAULT 'chat',
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ai_usage_user     (user_id),
  INDEX idx_ai_usage_provider (provider),
  INDEX idx_ai_usage_feature  (feature),
  INDEX idx_ai_usage_created  (created_at)
);

-- Daily AI usage summary (for fast analytics)
CREATE TABLE IF NOT EXISTS ai_usage_daily (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  date         DATE          NOT NULL,
  provider     VARCHAR(50)   NOT NULL,
  total_calls  INT UNSIGNED  DEFAULT 0,
  total_tokens INT UNSIGNED  DEFAULT 0,
  unique_users INT UNSIGNED  DEFAULT 0,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ai_daily (date, provider)
);

-- ─────────────────────────────────────────────────────────
-- STEP 24 — Audit Logs
-- ─────────────────────────────────────────────────────────
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
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id           INT UNSIGNED  AUTO_INCREMENT PRIMARY KEY,
  actor_id     INT UNSIGNED  NULL,
  actor_role   ENUM('user','admin','system') DEFAULT 'user',
  action       VARCHAR(100)  NOT NULL,
  target_type  VARCHAR(50)   NULL,
  target_id    INT UNSIGNED  NULL,
  description  TEXT          NULL,
  ip_address   VARCHAR(50)   NULL,
  old_value    JSON          NULL,
  new_value    JSON          NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_actor   (actor_id),
  INDEX idx_audit_action  (action),
  INDEX idx_audit_target  (target_type, target_id),
  INDEX idx_audit_created (created_at)
);

-- ─────────────────────────────────────────────────────────
-- Code Snippets (IDE)
-- ─────────────────────────────────────────────────────────
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
);

-- ─────────────────────────────────────────────────────────
-- Seed: Default admin user (password: Admin@123)
-- ─────────────────────────────────────────────────────────
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Admin', 'admin@vexoraai.com',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y',
 'admin');

-- ─────────────────────────────────────────────────────────
-- Views for quick reporting
-- ─────────────────────────────────────────────────────────

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
  DATE(created_at)          AS date,
  provider,
  COUNT(*)                  AS total_calls,
  SUM(total_tokens)         AS total_tokens,
  COUNT(DISTINCT user_id)   AS unique_users,
  AVG(latency_ms)           AS avg_latency_ms,
  SUM(CASE WHEN success=0 THEN 1 ELSE 0 END) AS error_count
FROM ai_usage
GROUP BY DATE(created_at), provider
ORDER BY date DESC;
