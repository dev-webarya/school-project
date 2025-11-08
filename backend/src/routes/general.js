const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Admission = require('../models/Admission');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get system statistics (public endpoint)
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalStudents: await Student.countDocuments({ isActive: true }),
      totalFaculty: await Faculty.countDocuments({ isActive: true }),
      totalCourses: await Course.countDocuments({ isActive: true }),
      totalSubjects: await Subject.countDocuments({ isActive: true }),
      totalUsers: await User.countDocuments({ isActive: true })
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get public information about the school
router.get('/school-info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'BBD School Management System',
      description: 'A comprehensive school management system for students, faculty, and administrators',
      version: '1.0.0',
      features: [
        'Student Management',
        'Faculty Management',
        'Course Management',
        'Attendance Tracking',
        'Grade Management',
        'Calendar System',
        'User Authentication'
      ],
      contact: {
        email: 'info@bbdschool.edu',
        phone: '+1-234-567-8900',
        address: '123 Education Street, Learning City, LC 12345'
      }
    }
  });
});

// Get available departments
router.get('/departments', async (req, res) => {
  try {
    // Get unique departments from subjects
    const departments = await Subject.distinct('department', { isActive: true });
    
    res.json({
      success: true,
      data: departments.filter(dept => dept && dept.trim() !== '')
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get available sessions (canonical)
router.get('/sessions', async (req, res) => {
  try {
    // Get unique sessions from subjects
    const sessions = await Subject.distinct('session', { isActive: true });
    
    res.json({
      success: true,
      data: sessions.filter(sem => sem !== null && sem !== undefined).sort((a, b) => a - b)
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Backward-compatibility alias for deprecated /semesters
router.get('/semesters', async (req, res) => {
  try {
    const sessions = await Subject.distinct('session', { isActive: true });
    res.json({
      success: true,
      data: sessions.filter(sem => sem !== null && sem !== undefined).sort((a, b) => a - b)
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get public courses (basic info only)
router.get('/courses/public', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .select('name code description department duration')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching public courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get public subjects (basic info only)
router.get('/subjects/public', async (req, res) => {
  try {
    const { department, session, semester } = req.query;
    let query = { isActive: true };
    
    if (department) {
      query.department = department;
    }
    
    const effectiveSession = session || semester;
    if (effectiveSession) {
      query.session = parseInt(effectiveSession);
    }

    const subjects = await Subject.find(query)
      .select('name code description credits department session')
      .sort({ code: 1 });

    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('Error fetching public subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Public admissions submission
router.post('/admissions', async (req, res) => {
  try {
    const payload = req.body || {};
    // Generate applicationNumber if not provided
    const applicationNumber = payload.applicationNumber || `APP-${Date.now()}`;

    // Basic required fields check to give clearer errors to the UI
    const required = [
      payload.studentInfo?.fullName,
      payload.studentInfo?.dateOfBirth,
      payload.studentInfo?.gender,
      payload.academicInfo?.applyingForClass,
      payload.academicInfo?.academicYear,
      payload.contactInfo?.email,
      payload.contactInfo?.phone,
      payload.contactInfo?.address?.street,
      payload.contactInfo?.address?.city,
      payload.contactInfo?.address?.state,
      payload.contactInfo?.address?.pincode,
      payload.parentInfo?.father?.name,
      payload.parentInfo?.father?.phone
    ];
    if (required.some((v) => v === undefined || v === null || v === '')) {
      return res.status(400).json({ success: false, message: 'Missing required admission fields' });
    }

    const doc = await Admission.create({
      ...payload,
      applicationNumber,
      status: 'submitted',
      feeInfo: {
        admissionFee: payload.feeInfo?.admissionFee ?? 5000,
        paymentMethod: payload.feeInfo?.paymentMethod ?? 'online',
        paymentStatus: payload.feeInfo?.paymentStatus ?? 'pending',
        paymentDetails: payload.feeInfo?.paymentDetails ?? {}
      }
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('General POST /admissions error:', error);
    const msg = error?.message?.includes('validation') ? 'Invalid admission data' : 'Failed to submit admission';
    res.status(500).json({ success: false, message: msg });
  }
});

// Search endpoint (public)
router.get('/search', async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchQuery = new RegExp(q, 'i');
    let results = {};

    // Search based on type or search all if no type specified
    if (!type || type === 'courses') {
      results.courses = await Course.find({
        isActive: true,
        $or: [
          { name: searchQuery },
          { code: searchQuery },
          { description: searchQuery }
        ]
      }).select('name code description department').limit(10);
    }

    if (!type || type === 'subjects') {
      results.subjects = await Subject.find({
        isActive: true,
        $or: [
          { name: searchQuery },
          { code: searchQuery },
          { description: searchQuery }
        ]
      }).select('name code description department session').limit(10);
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// -----------------------------
// OTP endpoints (development)
// -----------------------------

// In-memory stores for OTPs
const mobileOtps = new Map();
const emailOtps = new Map();
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;

const generateOtp = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min)).toString();
};

// POST /api/general/send-otp - Send mobile OTP
router.post('/send-otp', (req, res) => {
  const { mobile } = req.body || {};
  if (!mobile || !/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ success: false, message: 'Invalid mobile number' });
  }

  const otp = generateOtp(6);
  mobileOtps.set(mobile, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
    attempts: 0,
  });

  // For development, log OTP to console
  console.log(`[OTP] Mobile ${mobile} -> ${otp}`);

  return res.json({
    success: true,
    message: 'OTP sent successfully',
    ...(process.env.NODE_ENV === 'development' ? { debugOtp: otp } : {}),
  });
});

// POST /api/general/verify-otp - Verify mobile OTP
router.post('/verify-otp', (req, res) => {
  const { mobile, otp } = req.body || {};
  if (!mobile || !/^\d{10}$/.test(mobile) || !otp || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, message: 'Invalid mobile or OTP' });
  }

  const record = mobileOtps.get(mobile);
  if (!record) {
    return res.status(404).json({ success: false, message: 'No OTP requested for this mobile' });
  }

  if (Date.now() > record.expiresAt) {
    mobileOtps.delete(mobile);
    return res.status(410).json({ success: false, message: 'OTP expired' });
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    mobileOtps.delete(mobile);
    return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
  }

  if (record.otp !== otp) {
    record.attempts += 1;
    mobileOtps.set(mobile, record);
    return res.status(400).json({ success: false, message: 'Incorrect OTP' });
  }

  mobileOtps.delete(mobile);
  return res.json({ success: true, message: 'Mobile number verified successfully' });
});

// POST /api/general/send-email-otp - Send email OTP (production-ready)
router.post('/send-email-otp', async (req, res) => {
  const { email } = req.body || {};
  if (!email || !/.+@.+\..+/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  const otp = generateOtp(6);
  emailOtps.set(email, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
    attempts: 0,
  });

  try {
    const emailService = require('../services/emailService');

    // If in production and email not configured, return a clear error
    if (process.env.NODE_ENV === 'production' && !emailService.transporter) {
      console.error('Email service not configured for production');
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Please contact support.'
      });
    }

    const result = await emailService.sendOTP(email, otp, 'admissions');

    if (!result.success && process.env.NODE_ENV === 'production') {
      return res.status(502).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.'
      });
    }

    const responseData = {
      success: true,
      message: 'Email OTP sent successfully'
    };
    // Include preview URL for development using Ethereal
    if (process.env.NODE_ENV !== 'production' && result.preview) {
      responseData.preview = result.preview;
    }

    return res.json(responseData);
  } catch (error) {
    console.error('Error sending email OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while sending email OTP'
    });
  }
});

// POST /api/general/verify-email-otp - Verify email OTP
router.post('/verify-email-otp', (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !/.+@.+\..+/.test(email) || !otp || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, message: 'Invalid email or OTP' });
  }

  const record = emailOtps.get(email);
  if (!record) {
    return res.status(404).json({ success: false, message: 'No OTP requested for this email' });
  }

  if (Date.now() > record.expiresAt) {
    emailOtps.delete(email);
    return res.status(410).json({ success: false, message: 'OTP expired' });
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    emailOtps.delete(email);
    return res.status(429).json({ success: false, message: 'Too many attempts. Please request a new OTP.' });
  }

  if (record.otp !== otp) {
    record.attempts += 1;
    emailOtps.set(email, record);
    return res.status(400).json({ success: false, message: 'Incorrect OTP' });
  }

  emailOtps.delete(email);
  return res.json({ success: true, message: 'Email verified successfully' });
});

// API documentation endpoint
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    data: {
      title: 'BBD School Management API',
      version: '1.0.0',
      endpoints: {
        general: {
          '/api/general/health': 'GET - Health check',
          '/api/general/stats': 'GET - System statistics',
          '/api/general/school-info': 'GET - School information',
          '/api/general/departments': 'GET - Available departments',
          '/api/general/sessions': 'GET - Available sessions',
          '/api/general/courses/public': 'GET - Public courses',
          '/api/general/subjects/public': 'GET - Public subjects',
          '/api/general/search': 'GET - Search functionality'
        },
        auth: {
          '/api/auth/login': 'POST - User login',
          '/api/auth/register': 'POST - User registration',
          '/api/auth/logout': 'POST - User logout',
          '/api/auth/verify': 'GET - Verify token'
        },
        admin: {
          '/api/admin/*': 'Various admin endpoints (authentication required)'
        },
        faculty: {
          '/api/faculty/*': 'Various faculty endpoints (authentication required)'
        },
        student: {
          '/api/student/*': 'Various student endpoints (authentication required)'
        }
      }
    }
  });
});

module.exports = router;