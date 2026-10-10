# Monitoring Guide — ALOXADGPT / VEXORA AI

This guide covers four monitoring layers: uptime monitoring, Railway built-in metrics, optional error tracking with Sentry, and log drains.

---

## 1. UptimeRobot (Free Uptime Monitoring)

UptimeRobot pings your health endpoint every 5 minutes and emails you if the service goes down.

**Setup steps:**

1. Create a free account at [uptimerobot.com](https://uptimerobot.com).
2. Click **+ Add New Monitor**.
3. Choose monitor type: **HTTP(s)**.
4. Fill in the fields:
   - **Friendly Name:** `VEXORA AI Backend`
   - **URL:** `https://your-backend.railway.app/api/health`
   - **Monitoring Interval:** 5 minutes
5. Under **Alert Contacts**, add your email address.
6. Click **Create Monitor**.

**What it checks:**
- The `/api/health` endpoint returns HTTP `200` when the DB is connected, or `503` when it is not.
- UptimeRobot triggers an alert on any non-2xx response or a connection timeout.

**Sample healthy response:**
```json
{
  "status": "ok",
  "uptime": 3842,
  "timestamp": "2025-01-15T10:30:00.000Z",
  "env": "production",
  "db": "connected"
}
```

---

## 2. Railway Built-in Metrics

Railway exposes CPU, memory, and network graphs in the project dashboard — no extra setup required.

**Where to find them:**

1. Open [railway.app](https://railway.app) and go to your project.
2. Click the **backend service** (e.g., `server`).
3. Select the **Metrics** tab in the top navigation.

**Available graphs:**
- **CPU usage** — shows spikes during heavy AI inference or large chat sessions.
- **Memory usage** — watch for leaks; typical Node.js backend stays below 200 MB at idle.
- **Network I/O** — inbound and outbound bytes per second.
- **Deployment history** — compare metrics before and after a deployment.

**Tips:**
- Set the time range to **Last 24 hours** to catch overnight anomalies.
- Combine with UptimeRobot alerts for a complete picture.

---

## 3. Sentry — Optional Error Tracking

Sentry captures unhandled exceptions and async errors in production, with stack traces and user context.

**Installation:**
```bash
npm install @sentry/node@^8
```

**Initialization snippet** (add near the top of `server.js`, before any routes):
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,   // set in Railway environment variables
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.2,          // capture 20% of transactions for performance
});

// Must be the first middleware registered
app.use(Sentry.Handlers.requestHandler());
```

Add the Sentry error handler **after all routes, before the global error handler**:
```javascript
// ── Sentry Error Handler (must be before your own error handler) ──
app.use(Sentry.Handlers.errorHandler());
```

> **Note:** Do NOT add these snippets to `server.js` until you have a real DSN. Create a free project at [sentry.io](https://sentry.io), copy the DSN, and set `SENTRY_DSN=https://...@sentry.io/...` as a Railway environment variable first.

---

## 4. Log Drains on Railway

Railway can forward all stdout/stderr logs to an external log aggregator in real time.

**How to configure:**

1. Open your Railway project → **Settings** tab.
2. Scroll to the **Log Drains** section.
3. Click **Add Log Drain** and choose a destination:

| Destination  | Use case                                      |
|--------------|-----------------------------------------------|
| **Datadog**  | Full-stack observability, dashboards, alerts  |
| **Papertrail**| Simple hosted log search, free tier available |
| **Logtail**  | Structured log search, affordable pricing     |
| **Custom HTTP** | POST logs to your own endpoint              |

4. Paste the destination URL / API key provided by the chosen service.
5. Save — Railway immediately starts streaming logs.

**What gets streamed:**
- All `console.log` and `console.error` output from the backend, including the lines produced by `requestLogger`.
- Build output and deployment events.

**Tip:** With `requestLogger` in place every request line looks like:
```
[2025-01-15T10:30:01.234Z] POST /api/chat 200 312ms
```
This structured format is easy to parse and alert on in Datadog or Papertrail.
