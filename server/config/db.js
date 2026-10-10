const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "VEXORA AI",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testDatabaseConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    console.log("✅ MySQL database connected.");
  } finally {
    connection.release();
  }
}

// Export pool directly so controllers can call db.query(...)
// Also expose testDatabaseConnection for server.js startup check
pool.testDatabaseConnection = testDatabaseConnection;

module.exports = pool;
