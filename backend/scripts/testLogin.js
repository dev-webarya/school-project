// Simple Node script to test login endpoint for different roles
const axios = require('axios');

async function test(email, password, role) {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', { email, password, role });
    console.log(`Login ${role} OK:`, {
      status: res.status,
      message: res.data?.message,
      user: res.data?.data?.user?.email,
      role: res.data?.data?.role,
    });
  } catch (err) {
    const status = err.response?.status;
    const message = err.response?.data?.message || err.message;
    console.error(`Login ${role} FAILED:`, { status, message });
  }
}

async function main() {
  await test('student1@bbdschool.com', 'Student@123', 'student');
  await test('faculty1@bbdschool.com', 'Faculty@123', 'faculty');
}

main();