# 🚀 ALOXADGPT — End-to-End Deployment Guide

Deploy the full stack to **Railway** (backend) + **Vercel** (frontend) using free-tier accounts.

---

## 1. Prerequisites

| Requirement | Version / Notes |
|-------------|----------------|
| Node.js | 18 or higher |
| npm | bundled with Node.js |
| Git | any recent version |
| Railway account | [railway.app](https://railway.app) — free tier available |
| Vercel account | [vercel.com](https://vercel.com) — free tier available |
| MySQL database | PlanetScale (free) **or** Railway MySQL plugin |

---

## 2. Database Setup

### Option A — PlanetScale (free tier)

1. Sign up at [planetscale.com](https://planetscale.com) and create a new database (e.g. `vexoraai`).
2. In the PlanetScale dashboard go to **Connect → Connect with: Node.js** and copy the connection string.  
   It looks like: `mysql://user:password@host/vexoraai?ssl={"rejectUnauthorized":true}`
3. Open the **Console** tab in the PlanetScale dashboard.
4. Paste and run the contents of `database/production-schema.sql` to create all tables.
5. Then run the contents of `database/seed-production.sql` to insert the default admin account.

### Option B — Railway MySQL plugin

1. Inside your Railway project click **+ New → Database → MySQL**.
2. Railway injects `DATABASE_URL` automatically into every service in the same project.
3. Copy the individual connection variables from the MySQL plugin's **Variables** tab.
4. From your local machine run the schema and seed:

```bash
# Replace the placeholders with values from the Railway Variables tab
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p<DB_PASSWORD> <DB_NAME> \
  < database/production-schema.sql

mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p<DB_PASSWORD> <DB_NAME> \
  < database/seed-production.sql
```

> ⚠️ **Change the default admin password immediately after first login.**  
> Default credentials: `admin@aloxadgpt.com` / `Admin@123`

---

## 3. Backend Deploy to Railway

### 3a — Install the Railway CLI

```bash
npm install -g @railway/cli
```

### 3b — Login and initialise

```bash
railway login          # opens browser for OAuth
cd ALOXADGPT/server
railway init           # link or create a Railway project
```

### 3c — Set environment variables

Go to your Railway project → **Variables** tab and add every variable from the table below.

| Variable | Description | Example Value | Required |
|----------|-------------|---------------|----------|
| `NODE_ENV` | Runtime mode | `production` | ✅ |
| `PORT` | Port Railway listens on (auto-injected) | `5000` | ✅ |
| `DATABASE_URL` | Full MySQL connection URL | `mysql://user:pass@host:3306/vexoraai` | ✅ |
| `DB_HOST` | MySQL host | `your-db-host.railway.app` | ✅ |
| `DB_PORT` | MySQL port | `3306` | ✅ |
| `DB_USER` | MySQL user | `root` | ✅ |
| `DB_PASSWORD` | MySQL password | `strongpassword` | ✅ |
| `DB_NAME` | MySQL database name | `vexoraai` | ✅ |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `a8f5f167f44f4964e6c998dee827110c` | ✅ |
| `FRONTEND_URL` | Deployed frontend URL | `https://aloxadgpt.vercel.app` | ✅ |
| `CORS_ORIGIN` | Allowed CORS origin | `https://aloxadgpt.vercel.app` | ✅ |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` | Optional |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` | Optional |
| `EMAIL_USER` | Gmail address for OTP emails | `you@gmail.com` | Optional |
| `EMAIL_PASS` | Gmail App Password | `xxxx xxxx xxxx xxxx` | Optional |
| `EMAIL_FROM` | From header for outgoing email | `VEXORA AI <noreply@vexoraai.com>` | Optional |

### 3d — Deploy

```bash
railway up
```

Railway builds and deploys from your local `server/` directory. Watch the build logs in the dashboard.

### 3e — Verify backend

```bash
curl https://your-app.railway.app/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## 4. Frontend Deploy to Vercel

### Option A — Vercel CLI

```bash
npm install -g vercel
cd ALOXADGPT/client
vercel
```

Follow the prompts (framework = **Vite**, output directory = **dist**).

After the first deploy, set the environment variable in the **Vercel dashboard → Project → Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-app.railway.app` |

Redeploy after setting the variable:

```bash
vercel --prod
```

### Option B — GitHub integration (recommended)

1. Push your project to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Set **Framework Preset** = **Vite**.
4. Set **Output Directory** = `dist`.
5. Under **Environment Variables** add `VITE_API_URL` = `https://your-app.railway.app`.
6. Click **Deploy**.

Every push to `main` will trigger an automatic re-deploy.

### Verify frontend

Open the Vercel URL in your browser, navigate to the login page, and sign in with the admin credentials.

---

## 5. Post-Deploy Checklist

- [ ] Health check returns 200: `GET https://your-app.railway.app/api/health`
- [ ] Admin login works with `Admin@123` — **change it immediately after**
- [ ] Chat feature works end-to-end (send a message, receive AI reply)
- [ ] CORS is configured for the correct Vercel domain in Railway env vars
- [ ] UptimeRobot (or similar) monitor is set up for the `/api/health` endpoint
- [ ] Custom domain is pointing correctly (if applicable) — see [domain-https-setup.md](domain-https-setup.md)
- [ ] SSL/HTTPS is active on both the frontend and backend URLs

---

## 6. Rollback Procedure

### Backend (Railway)

1. Go to your Railway project → **Deployments** tab.
2. Find the last known-good deployment.
3. Click the **⋮** menu next to it → **Rollback**.

### Frontend (Vercel)

1. Go to your Vercel project → **Deployments** tab.
2. Find the last known-good deployment.
3. Click the **⋮** menu next to it → **Promote to Production**.

### Database

Always take a backup before running migrations:

```bash
mysqldump -h <DB_HOST> -u <DB_USER> -p<DB_PASSWORD> vexoraai > backup-$(date +%Y%m%d).sql
```

To restore:

```bash
mysql -h <DB_HOST> -u <DB_USER> -p<DB_PASSWORD> vexoraai < backup-20240101.sql
```

---

## Related Guides

| Guide | Description |
|-------|-------------|
| [Environment Variables](environment-variables.md) | Full env vars reference |
| [Domain + HTTPS Setup](domain-https-setup.md) | Custom domain configuration |
| [Monitoring Guide](monitoring-guide.md) | UptimeRobot, Railway metrics, Sentry |
