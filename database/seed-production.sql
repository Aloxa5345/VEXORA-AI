-- ============================================================
-- vexoraai — Production Seed Data
-- Phase 9: Step 48 — Production Database
-- ============================================================
-- This file seeds ONLY the default admin user.
-- Run this ONCE after applying production-schema.sql on a
-- fresh database. It is safe to run multiple times because
-- INSERT IGNORE will skip the row if the email already exists.
--
-- ⚠️  IMPORTANT: Change the admin password immediately after
--               your first login. The default is Admin@123.
-- ============================================================

USE vexoraai;

-- Default admin user
-- password is Admin@123 — CHANGE THIS AFTER FIRST LOGIN
INSERT IGNORE INTO users (name, email, password, role)
VALUES (
  'Admin',
  'admin@vexoraai.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y',
  'admin'
);

-- ============================================================
-- END OF PRODUCTION SEED
-- ============================================================
