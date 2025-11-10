const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); } catch (_) {}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
async function run(email, plaintext) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }
  await mongoose.connect(uri);
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found');
      return;
    }
    console.log('User:', { email: user.email, role: user.role, status: user.status });
    const ok = await bcrypt.compare(plaintext, user.password);
    console.log('Password matches plaintext?', ok);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await mongoose.connection.close();
  }
}
const [, , emailArg, passArg] = process.argv;
run(emailArg, passArg);