const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Admission = require('../models/Admission');
const AcademicCalendar = require('../models/AcademicCalendar');
const Notice = require('../models/Notice');
const { authenticateToken, requireRole } = require('../middleware/auth');

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

// Public academic notices
router.get('/notices', async (req, res) => {
  try {
    const { category, from, to } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (from || to) {
      query.effectiveDate = {};
      if (from) query.effectiveDate.$gte = new Date(from);
      if (to) query.effectiveDate.$lte = new Date(to);
    }
    const notices = await Notice.find(query).sort({ effectiveDate: -1 });
    res.json({ success: true, data: notices });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ success: false, message: 'Error fetching notices' });
  }
});

// Admin-only create/update/delete for notices
router.post('/notices', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const payload = req.body || {};
    const doc = await Notice.create({ ...payload, createdBy: req.user.id });
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ success: false, message: 'Failed to create notice' });
  }
});

router.put('/notices/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const updated = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notice' });
  }
});

router.delete('/notices/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const updated = await Notice.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notice' });
  }
});

// Public academic events backed by AcademicCalendar
router.get('/events', async (req, res) => {
  try {
    const { startDate, endDate, eventType } = req.query;
    const query = { isActive: true };
    // Public visibility: include events targeted to broad audiences
    // Previously restricted to only 'All'. Broaden to common audiences so
    // Admin-created events for Students/Parents/Faculty are visible publicly.
    query.targetAudience = { $in: ['All', 'Students', 'Parents', 'Faculty'] };
    if (eventType) query.eventType = eventType;
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date('2999-12-31');
      query.$or = [
        { startDate: { $gte: start, $lte: end } },
        { endDate: { $gte: start, $lte: end } },
        { startDate: { $lte: start }, endDate: { $gte: end } },
      ];
    }
    const events = await AcademicCalendar.find(query).sort({ startDate: 1 });
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching public events:', error);
    res.status(500).json({ success: false, message: 'Error fetching events' });
  }
});

// Public admissions submission
router.post('/admissions', async (req, res) => {
  try {
    const payload = req.body || {};
    // Generate applicationNumber if not provided
    const applicationNumber = payload.applicationNumber || `APP-${Date.now()}`;

    // Normalize incoming payload to align with Admission schema
    // 1) Map grade aliases (e.g., 'NS' -> 'Nursery') and ensure valid class values
    const VALID_CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const incomingClass = payload.academicInfo?.applyingForClass;
    let normalizedClass = incomingClass;
    if (typeof incomingClass === 'string') {
      const trimmed = incomingClass.trim();
      if (/^ns$/i.test(trimmed) || /^nursery$/i.test(trimmed)) {
        normalizedClass = 'Nursery';
      } else if (VALID_CLASSES.includes(trimmed)) {
        normalizedClass = trimmed;
      }
    }
    if (!normalizedClass) {
      normalizedClass = '1';
    }
    payload.academicInfo = {
      ...(payload.academicInfo || {}),
      applyingForClass: normalizedClass
    };

    // 2) Provide default mother name to satisfy schema requirement
    //    The public form collects a single parent/guardian name; use a placeholder if mother not provided.
    const existingMother = payload.parentInfo?.mother || {};
    const motherName = existingMother.name || 'Not Provided';
    payload.parentInfo = {
      ...(payload.parentInfo || {}),
      mother: {
        ...existingMother,
        name: motherName
      }
    };

    const normalizeDigits = (s) => (typeof s === 'string' ? s.replace(/\D/g, '') : '');
    if (typeof payload.studentInfo?.gender === 'string') {
      payload.studentInfo.gender = payload.studentInfo.gender.toLowerCase();
    }
    const mainPhone = normalizeDigits(payload.contactInfo?.phone);
    if (mainPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }
    const altPhone = normalizeDigits(payload.contactInfo?.alternatePhone);
    const addressObj = payload.contactInfo?.address || {};
    const pinDigits = normalizeDigits(addressObj.pincode);
    if (pinDigits.length !== 6) {
      return res.status(400).json({ success: false, message: 'Invalid pincode' });
    }
    const fatherPhone = normalizeDigits(payload.parentInfo?.father?.phone);
    if (fatherPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Invalid father phone number' });
    }
    const motherPhone = normalizeDigits(payload.parentInfo?.mother?.phone);
    const guardianPhone = normalizeDigits(payload.parentInfo?.guardian?.phone);
    payload.contactInfo = {
      ...(payload.contactInfo || {}),
      phone: mainPhone,
      alternatePhone: altPhone.length === 10 ? altPhone : undefined,
      address: { ...addressObj, pincode: pinDigits }
    };
    payload.parentInfo = {
      ...(payload.parentInfo || {}),
      father: { ...(payload.parentInfo?.father || {}), phone: fatherPhone },
      mother: { ...(payload.parentInfo?.mother || {}), phone: motherPhone.length === 10 ? motherPhone : undefined },
      guardian: { ...(payload.parentInfo?.guardian || {}), phone: guardianPhone.length === 10 ? guardianPhone : undefined }
    };
    const ayRaw = payload.academicInfo?.academicYear;
    let ayNorm = ayRaw;
    if (typeof ayRaw === 'string') {
      const mShort = ayRaw.match(/^(\d{4})-(\d{2})$/);
      const mFull = ayRaw.match(/^(\d{4})-(\d{4})$/);
      if (mShort) {
        const start = parseInt(mShort[1], 10);
        ayNorm = `${mShort[1]}-${start + 1}`;
      } else if (mFull) {
        ayNorm = ayRaw;
      }
    }
    payload.academicInfo = {
      ...(payload.academicInfo || {}),
      academicYear: ayNorm || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    };

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

    // In E2E mode, mirror this admission into the E2E in-memory store
    // so Admin Dashboard and Enrollment Waitlist reflect live submissions.
    try {
      if (process.env.E2E_MODE === 'true') {
        const e2ePayload = {
          applicationNumber: doc.applicationNumber,
          status: doc.status,
          studentInfo: {
            fullName: doc.studentInfo?.fullName || doc.studentInfo?.name || '',
            name: doc.studentInfo?.name || doc.studentInfo?.fullName || ''
          },
          academicInfo: {
            applyingForClass: doc.academicInfo?.applyingForClass || ''
          },
          submittedAt: doc.createdAt || new Date().toISOString()
        };
        // Use native fetch to POST into E2E router with role header
        await fetch(`http://localhost:${process.env.PORT || 5000}/api/e2e/admissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-e2e-role': 'admin'
          },
          body: JSON.stringify(e2ePayload)
        }).catch(() => {});
      }
    } catch (e2eForwardErr) {
      console.warn('[E2E] Failed to forward admission to E2E store:', e2eForwardErr?.message);
    }

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

router.post('/messages', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Missing required message fields' });
    }

    const when = new Date().toISOString();
    const payload = { name, email, phone, subject, message, time: when };

    try {
      const emailService = require('../services/emailService');
      if (emailService && emailService.transporter) {
        await emailService.transporter.sendMail({
          from: process.env.EMAIL_FROM || 'BBD School <no-reply@bbdschool.local>',
          to: process.env.CONTACT_EMAIL || process.env.EMAIL_FROM || 'sunil.bbdacademy@gmail.com',
          subject: `New contact message: ${subject}`,
          html: `
            <div>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone || ''}</p>
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <p>${message}</p>
              <p><em>Received at ${when}</em></p>
            </div>
          `
        });
      }
      try {
        const noticePayload = {
          title: `Contact: ${subject}`,
          description: `From: ${name} <${email}>${phone ? ` | ${phone}` : ''}\n\n${message}`,
          category: 'Contact',
          effectiveDate: new Date(),
          priority: 'normal',
          isActive: true
        };
        await Notice.create(noticePayload);
      } catch (_) { void 0; }
    } catch (_) { void 0; }

    return res.status(201).json({ success: true, data: payload });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit message' });
  }
});

module.exports = router;