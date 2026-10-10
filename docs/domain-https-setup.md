# Domain + HTTPS Setup Guide

This guide covers attaching a custom domain to your Vercel frontend and Railway backend, and explains why HTTPS is automatic on both platforms.

---

## 1. Custom Domain on Vercel (Frontend)

### Add the Domain in Vercel Dashboard

1. Open [vercel.com](https://vercel.com) and navigate to your project.
2. Go to **Settings → Domains**.
3. Type your domain (e.g. `aloxadgpt.com` or `www.aloxadgpt.com`) and click **Add**.
4. Vercel will show you the DNS records you need to configure at your registrar.

### DNS Records at Your Registrar

Add these records in your domain registrar's DNS management panel (e.g. Namecheap, GoDaddy, Cloudflare):

**For the apex / root domain (`aloxadgpt.com`):**
```
Type  : A
Name  : @
Value : 76.76.21.21
TTL   : Auto (or 3600)
```

**For the www subdomain (`www.aloxadgpt.com`):**
```
Type  : CNAME
Name  : www
Value : cname.vercel-dns.com.
TTL   : Auto (or 3600)
```

> **Note:** Vercel may show slightly different values in your dashboard — always use the exact values Vercel provides, as they can vary by account/region.

### Why HTTPS is Automatic on Vercel

Vercel integrates with **Let's Encrypt** using the **ACME (Automatic Certificate Management Environment) protocol**. When you add a domain:

- Vercel automatically initiates an ACME challenge (either HTTP-01 or DNS-01) to prove it controls your domain.
- Let's Encrypt issues a free TLS certificate.
- The certificate is **auto-renewed** before it expires (Let's Encrypt certs last 90 days; Vercel renews ~30 days before expiry).
- All HTTP traffic is **automatically redirected to HTTPS** — no configuration needed.

### Verify It Is Working

```bash
# Check DNS propagation (may take up to 48 hours, usually much faster)
nslookup www.aloxadgpt.com
# or
dig www.aloxadgpt.com CNAME

# Check the certificate
curl -I https://www.aloxadgpt.com
# Look for: HTTP/2 200 and server: vercel
```

In the Vercel dashboard under **Settings → Domains**, the domain should show a green checkmark and "Valid Configuration".

---

## 2. Custom Domain on Railway (Backend)

### Add the Domain in Railway Dashboard

1. Open [railway.app](https://railway.app) and navigate to your project.
2. Click on your backend **Service** (e.g. `aloxadgpt-backend`).
3. Go to **Settings → Domains**.
4. Click **+ Custom Domain** and enter your subdomain (e.g. `api.aloxadgpt.com`).
5. Railway will display the CNAME target you need to point to.

### DNS Records at Your Registrar

**For the API subdomain (`api.aloxadgpt.com`):**
```
Type  : CNAME
Name  : api
Value : <your-railway-service>.up.railway.app
TTL   : Auto (or 3600)
```

> Replace `<your-railway-service>` with the exact value Railway shows in the dashboard.

### Why HTTPS is Automatic on Railway

Railway also uses **Let's Encrypt via the ACME protocol**:

- When you attach a custom domain, Railway provisions a TLS certificate automatically.
- The ACME HTTP-01 challenge is handled internally by Railway's proxy layer.
- Certificates **auto-renew** with no action required on your part.
- Railway's reverse proxy **redirects all HTTP traffic to HTTPS** by default.

### Verify It Is Working

```bash
# Check DNS propagation
nslookup api.aloxadgpt.com
# or
dig api.aloxadgpt.com CNAME

# Check the certificate and API health
curl -I https://api.aloxadgpt.com/health
# Look for: HTTP/2 200
```

In the Railway dashboard under **Settings → Domains**, the domain will show as "Active" once DNS has propagated and the certificate is issued.

---

## 3. HTTPS Is Automatic on Both Platforms — Why

| Feature | Vercel | Railway |
|---|---|---|
| Certificate Authority | Let's Encrypt | Let's Encrypt |
| Protocol | ACME (HTTP-01 / DNS-01) | ACME (HTTP-01) |
| Auto-renewal | ✅ Yes (~30 days before expiry) | ✅ Yes (managed automatically) |
| HTTP → HTTPS redirect | ✅ Automatic | ✅ Automatic |
| Cost | Free | Free |

Both platforms act as **ACME clients** on your behalf. You never need to manually generate, install, or renew a certificate. The ACME protocol automates the entire lifecycle:

1. **Issue** — Platform proves domain ownership to Let's Encrypt.
2. **Install** — Certificate is deployed to the platform's edge/proxy.
3. **Renew** — Platform re-runs the ACME challenge before expiry and replaces the cert seamlessly.

---

## 4. Update Environment Variables After Custom Domain Setup

Once your custom domains are live, update the environment variables on both platforms so they reference the new domains instead of the auto-generated `.vercel.app` / `.railway.app` URLs.

### Which Variable Goes Where

| Platform | Variable | Value |
|---|---|---|
| **Railway** (backend) | `FRONTEND_URL` | `https://www.aloxadgpt.com` |
| **Railway** (backend) | `CORS_ORIGIN` | `https://www.aloxadgpt.com` |
| **Vercel** (frontend) | `VITE_API_URL` | `https://api.aloxadgpt.com` |

### How to Set Variables on Railway

1. Open your Railway project → backend service → **Variables** tab.
2. Update `FRONTEND_URL` → `https://www.aloxadgpt.com`
3. Update `CORS_ORIGIN` → `https://www.aloxadgpt.com`
4. Click **Save** — Railway will trigger an automatic redeploy.

### How to Set Variables on Vercel

1. Open your Vercel project → **Settings → Environment Variables**.
2. Update `VITE_API_URL` → `https://api.aloxadgpt.com`
3. Click **Save**.
4. Go to **Deployments** and click **Redeploy** on the latest deployment to apply the new variable (Vercel env vars are baked in at build time for Vite projects).

---

## 5. CORS Update Reminder

Your `server.js` already reads `CORS_ORIGIN` from the environment (added in Step 49):

```js
// server.js — already in place from Step 49
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
```

**No code changes are needed.** Updating the `CORS_ORIGIN` env var on Railway is all that is required.

### How to Redeploy on Railway After an Env Var Change

Railway automatically redeploys your service whenever you save a variable change in the dashboard. You can confirm the redeploy happened:

1. Go to your Railway service → **Deployments** tab.
2. A new deployment should appear within a few seconds of saving the variable.
3. Wait for status to show **Success** (usually 1–2 minutes).
4. Test a cross-origin request from your frontend to confirm CORS is working.

If you need to force a redeploy manually:
1. Go to **Deployments** tab → click the latest deployment → **Redeploy**.

---

## ✅ Step 51 Checklist

### Vercel (Frontend)
- [ ] Custom domain added in Vercel dashboard (Settings → Domains)
- [ ] A record (`@` → `76.76.21.21`) added at registrar
- [ ] CNAME record (`www` → `cname.vercel-dns.com.`) added at registrar
- [ ] DNS propagated — green checkmark in Vercel dashboard
- [ ] HTTPS working: `https://www.aloxadgpt.com` loads the app
- [ ] `VITE_API_URL` updated to `https://api.aloxadgpt.com` on Vercel
- [ ] Frontend redeployed on Vercel

### Railway (Backend)
- [ ] Custom domain added in Railway dashboard (Service → Settings → Domains)
- [ ] CNAME record (`api` → Railway target) added at registrar
- [ ] DNS propagated — domain shows Active in Railway dashboard
- [ ] HTTPS working: `https://api.aloxadgpt.com/health` returns 200
- [ ] `FRONTEND_URL` updated to `https://www.aloxadgpt.com` on Railway
- [ ] `CORS_ORIGIN` updated to `https://www.aloxadgpt.com` on Railway
- [ ] Railway auto-redeployed after env var change

### Final Verification
- [ ] Frontend can call backend API with no CORS errors (check browser DevTools → Network)
- [ ] Login, OTP, and password reset flows work on the custom domain
- [ ] HTTP URLs redirect to HTTPS (test `http://www.aloxadgpt.com` in browser)
- [ ] Certificate is valid (padlock icon in browser, no warnings)
