// Creates (or resets) the first admin account.
// Usage: npm run seed:admin -- "Admin Name" admin@sms.com "SomeStrongPass1"
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seedAdmin() {
  const [, , argName, argEmail, argPassword] = process.argv;
  const name = argName || 'System Admin';
  const email = argEmail || 'admin@sms.com';
  const password = argPassword || 'Admin@123';

  const hashed = await bcrypt.hash(password, 10);

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

  if (existing.length > 0) {
    await pool.query('UPDATE users SET name = ?, password = ?, role = ? WHERE email = ?', [
      name,
      hashed,
      'admin',
      email,
    ]);
    console.log(`Updated existing admin account: ${email}`);
  } else {
    await pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
      name,
      email,
      hashed,
      'admin',
    ]);
    console.log(`Created admin account: ${email}`);
  }

  console.log(`Login with email="${email}" password="${password}"`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err.message);
  process.exit(1);
});
