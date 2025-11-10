// Dev-only script to create or update an Admin account for local login
// Usage:
//   1) Ensure MongoDB is running and MONGODB_URI is set (via .env or environment)
//   2) Run: node backend/scripts/seedAdmin.js [email] [password]
//      - Defaults: email=admin@bbdschool.local, password=admin123

const path = require('path');
// Load env from backend/.env if present
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_) {}

const mongoose = require('mongoose');
const User = require('../src/models/User');

const DEFAULT_EMAIL = 'admin@bbdschool.local';
const DEFAULT_PASSWORD = 'admin123';

async function ensureAdmin(emailArg, passwordArg) {
  const email = (emailArg || DEFAULT_EMAIL).toLowerCase();
  const password = passwordArg || DEFAULT_PASSWORD;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI env. Set it in backend/.env or environment.');
    process.exit(1);
  }

  try {
    // Connect directly using mongoose to avoid module mismatch
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    let admin = await User.findOne({ email, role: 'admin' }).select('+password');
    if (admin) {
      // Update password and activate if needed
      admin.password = password;
      admin.status = 'active';
      admin.firstName = admin.firstName || 'Admin';
      admin.lastName = admin.lastName || 'User';
      admin.phone = admin.phone || '9999999999';
      await admin.save();
      console.log(`Updated existing admin: ${email}`);
    } else {
      // Create a new admin user
      admin = new User({
        firstName: 'Admin',
        lastName: 'User',
        email,
        phone: '9999999999',
        password,
        role: 'admin',
        status: 'active',
      });
      await admin.save();
      console.log(`Created admin user: ${email}`);
    }

    console.log('You can now log in on /admin/login');
  } catch (err) {
    console.error('Seed admin error:', err.message);
    process.exitCode = 1;
  } finally {
    try { await mongoose.connection.close(); } catch (_) {}
  }
}

const [, , emailArg, passwordArg] = process.argv;
ensureAdmin(emailArg, passwordArg);