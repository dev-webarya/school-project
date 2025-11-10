// Dev-only script to create/update sample Student and Faculty accounts for local login
// Usage:
//   1) Ensure MongoDB is running and MONGODB_URI is set (via backend/.env or environment)
//   2) Run: node backend/scripts/seedUsers.js
//      - Seeds:
//        - Student: student1@bbdschool.com / Student@123
//        - Faculty: faculty1@bbdschool.com / Faculty@123

const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (_) {}

const mongoose = require('mongoose');
const User = require('../src/models/User');

const STUDENT = {
  firstName: 'Student',
  lastName: 'One',
  email: 'student1@bbdschool.com',
  phone: '9000000001',
  password: 'Student@123',
  role: 'student',
  status: 'active',
  dateOfBirth: new Date('2005-01-01'),
  gender: 'male',
  emailVerified: true,
  phoneVerified: true,
};

const FACULTY = {
  firstName: 'Faculty',
  lastName: 'One',
  email: 'faculty1@bbdschool.com',
  phone: '9000000002',
  password: 'Faculty@123',
  role: 'faculty',
  status: 'active',
  emailVerified: true,
  phoneVerified: true,
};

async function upsertUser(sample) {
  const existing = await User.findOne({ email: sample.email, role: sample.role }).select('+password');
  if (existing) {
    existing.firstName = sample.firstName;
    existing.lastName = sample.lastName;
    existing.phone = sample.phone;
    existing.status = sample.status;
    existing.emailVerified = !!sample.emailVerified;
    existing.phoneVerified = !!sample.phoneVerified;
    if (sample.role === 'student') {
      existing.dateOfBirth = sample.dateOfBirth;
      existing.gender = sample.gender;
    }
    // Update password to known value so login works in dev
    existing.password = sample.password;
    await existing.save();
    console.log(`Updated ${sample.role}: ${sample.email}`);
    return existing;
  } else {
    const user = new User(sample);
    await user.save();
    console.log(`Created ${sample.role}: ${sample.email}`);
    return user;
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI env. Set it in backend/.env or environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    await upsertUser(STUDENT);
    await upsertUser(FACULTY);
    console.log('\nSeeded sample users:');
    console.log('  Student: student1@bbdschool.com / Student@123');
    console.log('  Faculty: faculty1@bbdschool.com / Faculty@123');
  } catch (err) {
    console.error('Seed users error:', err.message);
    process.exitCode = 1;
  } finally {
    try { await mongoose.connection.close(); } catch (_) {}
  }
}

main();