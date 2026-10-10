'use strict';

const express = require('express');
const router = express.Router();

// db.js exports the mysql2/promise pool directly
let pool;
try { pool = require('../config/db'); } catch (e) { pool = null; }

/**
 * GET /api/health
 * Returns service status, uptime, DB connectivity.
 * No rate limit — used by UptimeRobot / load balancers.
 */
router.get('/', async (req, res) => {
  const status = {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    db: 'unknown',
  };

  // Lightweight DB ping using the mysql2/promise pool exported by db.js
  try {
    if (pool && typeof pool.query === 'function') {
      const [rows] = await pool.query('SELECT 1 AS ping');
      status.db = rows[0]?.ping === 1 ? 'connected' : 'error';
    } else {
      status.db = 'not_configured';
    }
  } catch {
    status.db = 'error';
  }

  const httpStatus = status.db === 'error' ? 503 : 200;
  res.status(httpStatus).json(status);
});

module.exports = router;
