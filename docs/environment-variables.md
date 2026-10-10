# 🔧 Environment Variables Reference

Complete reference for every environment variable used by ALOXADGPT (VEXORA AI).

---

## Backend (`server/.env`)

| Variable | Description | Example Value | Required |
|----------|-------------|---------------|----------|
| `NODE_ENV` | Runtime environment. Set to `production` on the server. | `production` | ✅ |
| `PORT` | Port the Express server listens on. Railway/Render inject this automatically. | `5000` | ✅ |
| `DATABASE_URL` | Full MySQL connection URL. Used as an alternative to the individual `DB_*` vars below. | `mysql://user:password@host:3306/vexoraai` | ✅ |
| `DB_HOST` | Hostname or IP address of your MySQL server. | `your-db-host.railway.app` | ✅ |
| `DB_PORT` | MySQL port (default 3306). | `3306` | ✅ |
| `DB_USER` | MySQL username. | `vexoraai_user` | ✅ |
| `DB_PASSWORD` | MySQL password. Use a strong, randomly generated string. | `Str0ngP@ssw0rd!` | ✅ |
| `DB_NAME` | MySQL database name. | `vexoraai` | ✅ |
| `JWT_SECRET` | Secret key used to sign and verify JWTs. Must be at least 32 characters. | `a8f5f167f44f4964e6c998dee827110c` | ✅ |
| `FRONTEND_URL` | Public URL of the deployed frontend. Used for CORS and email links. | `https://aloxadgpt.vercel.app` | ✅ |
| `CORS_ORIGIN` | Allowed CORS origin. Can match `FRONTEND_URL` or be a custom domain. | `https://aloxadgpt.vercel.app` | ✅ |
| `OPENAI_API_KEY` | OpenAI API key (starts with `sk-proj-` or `sk-`). | `sk-proj-abc123...` | Optional |
| `GEMINI_API_KEY` | Google Gemini API key. | `AIzaSyAbc123...` | Optional |
| `EMAIL_USER` | Gmail address used to send OTP and notification emails. | `you@gmail.com` | Optional |
| `EMAIL_PASS` | Gmail App Password (not your regular Gmail password). | `xxxx xxxx xxxx xxxx` | Optional |
| `EMAIL_FROM` | The "From" display name and address in outgoing emails. | `VEXORA AI <noreply@vexoraai.com>` | Optional |

---

## Frontend (`client/.env.production`)

| Variable | Description | Example Value | Required |
|----------|-------------|---------------|----------|
| `VITE_API_URL` | Base URL of the deployed backend API. No trailing slash. | `https://your-app.railway.app` | ✅ |

> All Vite env vars must be prefixed with `VITE_` to be exposed to the browser bundle.

---

## Security Notes

### JWT_SECRET
- Must be **at least 32 characters** long. 64+ characters is recommended.
- Generate a strong secret with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- Rotate immediately if it is ever leaked. All existing sessions will be invalidated.

### Never commit `.env` files
- `.env`, `.env.local`, `.env.production` are all in `.gitignore`.
- Only `.env.example` and `.env.production.example` (with placeholder values) should ever be committed.
- If you accidentally commit a real secret, rotate it **immediately** and consider the old value compromised.

### Database password
- Use a strong randomly generated password — never reuse a password from another service.
- On Railway/PlanetScale the password is injected automatically; copy it from the dashboard rather than typing it manually.

### AI API Keys
- `OPENAI_API_KEY` and `GEMINI_API_KEY` incur costs when used. Set usage limits in the respective dashboards.
- Never hard-code these values in source code.

### Email App Password
- Generate a Gmail **App Password** (not your account password) at:  
  [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
- Requires 2FA to be enabled on your Google account.
