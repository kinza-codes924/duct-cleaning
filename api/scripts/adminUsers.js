/**
 * Lists or removes admin logins.
 *
 *   node api/scripts/adminUsers.js list
 *   node api/scripts/adminUsers.js remove admin@pacific.duct
 *
 * Use createAdmin.js to add one or change a password. Removing the last admin
 * is refused: the server would seed the starter account again on next boot,
 * and its password is published in api/index.js.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// The connection string in api/.env has no database name, so it lands in the
// cluster's default database. The live site uses "ductCleaning". Set MONGODB_DB
// to work against it without pasting a second connection string:
//   $env:MONGODB_DB="ductCleaning"; node api/scripts/adminUsers.js ...
const DB_NAME = process.env.MONGODB_DB || undefined;
const Admin = require('../models/Admin');

async function main() {
  const [command, username] = process.argv.slice(2);

  if (!['list', 'remove'].includes(command)) {
    console.error('Usage:');
    console.error('  node api/scripts/adminUsers.js list');
    console.error('  node api/scripts/adminUsers.js remove <username>');
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. To target the live database:');
    console.error('  $env:MONGODB_URI="<uri>"; node api/scripts/adminUsers.js list');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });

  const admins = await Admin.find().sort({ createdAt: 1 }).lean();

  if (command === 'list') {
    console.log(`${admins.length} admin login${admins.length === 1 ? '' : 's'}:`);
    admins.forEach((a) =>
      console.log(`  ${a.username}${a.createdAt ? `   (added ${new Date(a.createdAt).toLocaleDateString()})` : ''}`)
    );
    await mongoose.disconnect();
    return;
  }

  if (!username) {
    console.error('Which login should be removed? Run "list" first.');
    process.exit(1);
  }

  const target = username.toLowerCase();
  if (!admins.some((a) => a.username === target)) {
    console.error(`No admin called ${target}. Run "list" to see the logins.`);
    process.exit(1);
  }

  if (admins.length === 1) {
    console.error('This is the only admin login. Create another one first:');
    console.error('  node api/scripts/createAdmin.js <username> <password>');
    process.exit(1);
  }

  await Admin.deleteOne({ username: target });
  console.log(`Removed ${target}. ${admins.length - 1} login(s) left.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
