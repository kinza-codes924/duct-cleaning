// One-off script to create/reset the admin login.
// Usage: node scripts/createAdmin.js <username> <password>
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// The connection string in api/.env has no database name, so it lands in the
// cluster's default database. The live site uses "ductCleaning". Set MONGODB_DB
// to work against it without pasting a second connection string:
//   $env:MONGODB_DB="ductCleaning"; node api/scripts/createAdmin.js ...
const DB_NAME = process.env.MONGODB_DB || undefined;
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

async function main() {
  const [username, password] = process.argv.slice(2);
  if (!username || !password) {
    console.error('Usage: node scripts/createAdmin.js <username> <password>');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await Admin.findOneAndUpdate(
    { username: username.toLowerCase() },
    { username: username.toLowerCase(), passwordHash },
    { upsert: true, new: true }
  );

  console.log(`✅ Admin user ready: ${admin.username}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Failed to create admin:', err.message);
  process.exit(1);
});
