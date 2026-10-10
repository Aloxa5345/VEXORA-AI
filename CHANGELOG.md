# CHANGELOG

All notable changes to VEXORA AI (ALOXADGPT) are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions.

---

## [1.0.0] — Initial Release

### PHASE 1 — Project Setup (Steps 1-5)
- Step 1: Project initialization (Vite + React 18)
- Step 2: Express backend scaffold
- Step 3: MySQL database connection
- Step 4: Environment configuration
- Step 5: Git repository setup

### PHASE 2 — Authentication (Steps 6-10)
- Step 6: User registration endpoint
- Step 7: Login with JWT
- Step 8: Auth middleware (JWT verify)
- Step 9: Frontend login page
- Step 10: Auth context (React)

### PHASE 3 — Core UI (Steps 11-15)
- Step 11: ChatGPT-style sidebar layout
- Step 12: Dark/Light theme toggle
- Step 13: Message bubble component
- Step 14: Home screen with quick prompts
- Step 15: Navigation system

### PHASE 4 — Database Architecture (Steps 19-24)
- Step 19: MySQL schema design (normalized, FK-constrained)
- Step 20: Users + admin_sessions tables
- Step 21: Projects + project_files tables
- Step 22: Chat sessions + chat_history tables
- Step 23: AI usage tracking tables
- Step 24: Audit logs + API logs tables

### PHASE 5 — AI Features (Steps 25-30)
- Step 25: Chat history persistence
- Step 26: Code Refactoring page
- Step 27: Test Generator page
- Step 28: Docs Generator page
- Step 29: SQL Assistant page
- Step 30: Project Generator page

### PHASE 6 — Development Tools (Steps 31-35)
- Step 31: Code execution engine
- Step 32: Run & Debug page
- Step 33: Execution sandboxing
- Step 34: Live Preview page
- Step 35: Preview iframe integration

### PHASE 7 — Integrations (Steps 36-41)
- Step 36: GitHub page integration
- Step 37: Git Assistant page
- Step 38: Import Project page
- Step 39: Export / Download page
- Step 40: Deployment page
- Step 41: Security & Testing page

### PHASE 8 — Security & Polish (Steps 42-47)
- Step 42: Helmet.js security headers + input sanitization
- Step 43: Global + route-level rate limiting
- Step 44: Secret detection middleware
- Step 45: Admin dashboard
- Step 46: Profile page
- Step 47: Forgot password (OTP-based reset)

### PHASE 9 — Production (Steps 48-53)
- Step 48: Production database schema + migration guide
- Step 49: Backend deployment config (Railway, Procfile)
- Step 50: Frontend deployment config (Vercel, Netlify, env vars)
- Step 51: Custom domain + HTTPS setup guide
- Step 52: Monitoring (health check endpoint, request logger, UptimeRobot)
- Step 53: Final release — deployment guide, env vars reference, CHANGELOG
