'use strict';

/**
 * requestLogger — structured request logging middleware
 * Production-safe: logs method, path, status, duration. No request body.
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, path: reqPath } = req;

  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const log = `[${new Date().toISOString()}] ${method} ${reqPath} ${status} ${ms}ms`;
    if (status >= 500) {
      console.error(log);
    } else {
      console.log(log);
    }
  });

  next();
}

module.exports = requestLogger;
