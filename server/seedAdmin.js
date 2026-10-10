require("dotenv").config();
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

async function seedAdmin() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "VEXORA AI",
  });

  try {
    const name = "VEXORA AI Admin";
    const email = "admin@VEXORA AI.com";
    // Change this password before deploying to production!
    const password = "ChangeThisAdminPassword123!";
    const role = "admin";

    // Check if already exists
    const [existing] = await conn.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      console.log("✅ Admin already exists:", email);
      return;
    }

    const hash = await bcrypt.hash(password, 12);
    await conn.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hash, role]
    );

    console.log("✅ Admin account created successfully.");
    console.log(`   Email   : ${email}`);
    console.log(`   Password: ${password}`);
    console.log("⚠️  Change this password immediately before deploying!");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

seedAdmin();
