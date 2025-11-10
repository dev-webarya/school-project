const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Faculty = require('../models/Faculty');

// Helper function to get time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInMs = now - date;
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  return 'Just now';
};

// @route   GET /api/faculty/dashboard
// @desc    Get faculty dashboard data
// @access  Private (Faculty only)
router.get('/dashboard', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    // Get faculty profile
    const facultyProfile = await Faculty.findOne({ userId: req.user.id });
    
    // Get basic stats
    const totalStudents = await User.countDocuments({ role: 'student', status: 'active' });
    const totalFaculty = await User.countDocuments({ role: 'faculty', status: 'active' });
    
    // Sample data for classes and courses (would come from actual class/course models)
    const classesToday = 3;
    const activeCourses = 2;
    
    // Sample upcoming classes (would come from actual schedule model)
    const upcomingClasses = [
      {
        id: 1,
        time: '09:00 AM',
        course: 'Mathematics - Algebra',
        room: 'Room 201',
        class: '10-A',
        subject: 'Mathematics'
      },
      {
        id: 2,
        time: '10:00 AM',
        course: 'Physics - Motion',
        room: 'Lab 2',
        class: '10-A',
        subject: 'Physics'
      },
      {
        id: 3,
        time: '11:00 AM',
        course: 'Mathematics - Geometry',
        room: 'Room 203',
        class: '10-B',
        subject: 'Mathematics'
      }
    ];
    
    // Sample recent activities (would come from actual activity logs)
    const recentActivities = [
      {
        id: 1,
        type: 'assignment',
        message: 'New assignment submitted by John Doe',
        time: getTimeAgo(new Date(Date.now() - 2 * 60 * 60 * 1000)),
        class: '10-A'
      },
      {
        id: 2,
        type: 'attendance',
        message: 'Attendance marked for Mathematics class',
        time: getTimeAgo(new Date(Date.now() - 4 * 60 * 60 * 1000)),
        class: '10-B'
      }
    ];

    const dashboardData = {
      stats: {
        classesToday,
        activeCourses,
        totalStudents: Math.floor(totalStudents * 0.3), // Approximate students under this faculty
        totalAssignments: 8 // Sample data
      },
      upcomingClasses,
      recentActivities,
      facultyInfo: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
        department: facultyProfile?.department || 'Not specified',
        employeeId: facultyProfile?.employeeId || 'N/A'
      }
    };

    res.json({
      success: true,
      message: 'Faculty dashboard data retrieved successfully',
      data: dashboardData
    });

  } catch (error) {
    console.error('Faculty dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/faculty/classes
// @desc    Get assigned classes
// @access  Private (Faculty only)
router.get('/classes', (req, res) => {
  res.json({
    success: true,
    message: 'Get assigned classes endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/faculty/classes',
      returns: ['class_list', 'subject', 'schedule', 'student_count']
    }
  });
});

// @route   GET /api/faculty/students
// @desc    Get students in assigned classes
// @access  Private (Faculty only)
router.get('/students', (req, res) => {
  res.json({
    success: true,
    message: 'Get students endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/faculty/students',
      query_params: ['class', 'subject']
    }
  });
});

// @route   POST /api/faculty/attendance
// @desc    Mark student attendance
// @access  Private (Faculty only)
const { body, query } = require('express-validator');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');

router.post(
  '/attendance',
  [
    authenticateToken,
    requireRole(['faculty']),
    body('records').isArray({ min: 1 }).withMessage('records array is required'),
    body('records.*.student').isString().withMessage('student is required'),
    body('records.*.course').isString().withMessage('course is required'),
    body('records.*.status').isIn(['Present', 'Absent', 'Late', 'Excused']).withMessage('invalid status'),
    body('records.*.session').optional().isIn(['1', '2']).withMessage('invalid session'),
    body('records.*.session').optional().isIn(['1', '2']).withMessage('invalid session'),
    body('records.*.timeIn').optional().isString(),
    body('records.*.timeOut').optional().isString(),
    body('date').optional().isISO8601().toDate(),
  ],
  async (req, res) => {
    try {
      const errors = require('express-validator').validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { records, date } = req.body;
      const academicYear = req.body.academicYear || (() => { const y = new Date().getFullYear(); return `${y}-${y+1}`; })();

      // Optionally validate course exists and belongs to faculty
      const courseIds = [...new Set(records.map(r => r.course))];
      const courses = await Course.find({ _id: { $in: courseIds } });
      if (courses.length !== courseIds.length) {
        return res.status(400).json({ success: false, message: 'Invalid course in records' });
      }

      const docs = records.map(r => ({
        student: r.student,
        course: r.course,
        faculty: req.user._id,
        date: date || new Date(),
        status: r.status,
        timeIn: r.timeIn,
        timeOut: r.timeOut,
        remarks: r.remarks,
        markedBy: req.user._id,
        academicYear,
        session: r.session || r.semester,
      }));

      // Upsert-like: try create, if duplicate key then skip
      const results = { created: 0, duplicates: 0 };
      for (const doc of docs) {
        try {
          await Attendance.create(doc);
          results.created += 1;
        } catch (e) {
          if (e.code === 11000) results.duplicates += 1; else throw e;
        }
      }

      return res.status(201).json({ success: true, message: 'Attendance marked', data: results });
    } catch (error) {
      console.error('Mark attendance error:', error);
      res.status(500).json({ success: false, message: 'Failed to mark attendance' });
    }
  }
);

// @route   GET /api/faculty/attendance
// @desc    Get attendance records
// @access  Private (Faculty only)
router.get(
  '/attendance',
  [
    authenticateToken,
    requireRole(['faculty']),
    query('course').optional().isString(),
    query('student').optional().isString(),
    query('date_from').optional().isISO8601().toDate(),
    query('date_to').optional().isISO8601().toDate(),
    query('session').optional().isIn(['1', '2']),
    query('semester').optional().isIn(['1', '2'])
  ],
  async (req, res) => {
    try {
      const errors = require('express-validator').validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { course, student, date_from, date_to, session, semester } = req.query;
      const query = { faculty: req.user._id };
      if (course) query.course = course;
      if (student) query.student = student;
      const effectiveSession = session || semester;
      if (effectiveSession) query.session = effectiveSession;
      if (date_from || date_to) {
        query.date = {};
        if (date_from) query.date.$gte = new Date(date_from);
        if (date_to) query.date.$lte = new Date(date_to);
      }

      const records = await Attendance.find(query)
        .populate('student', 'name class studentId')
        .populate('course', 'courseCode class section')
        .populate('faculty', 'employeeId')
        .sort({ date: -1 });

      res.json({ success: true, data: records });
    } catch (error) {
      console.error('Get attendance error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
    }
  }
);

// @route   POST /api/faculty/assignments
// @desc    Create new assignment
// @access  Private (Faculty only)
router.post('/assignments', (req, res) => {
  res.json({
    success: true,
    message: 'Create assignment endpoint - To be implemented',
    data: {
      endpoint: 'POST /api/faculty/assignments',
      required_fields: ['title', 'description', 'class', 'subject', 'due_date']
    }
  });
});

// @route   GET /api/faculty/assignments
// @desc    Get assignments created by faculty
// @access  Private (Faculty only)
router.get('/assignments', (req, res) => {
  res.json({
    success: true,
    message: 'Get assignments endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/faculty/assignments',
      query_params: ['class', 'subject', 'status']
    }
  });
});

// @route   PUT /api/faculty/assignments/:id
// @desc    Update assignment
// @access  Private (Faculty only)
router.put('/assignments/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Update assignment endpoint - To be implemented',
    data: {
      endpoint: 'PUT /api/faculty/assignments/:id',
      assignment_id: req.params.id
    }
  });
});

// @route   GET /api/faculty/submissions/:assignmentId
// @desc    Get assignment submissions
// @access  Private (Faculty only)
router.get('/submissions/:assignmentId', (req, res) => {
  res.json({
    success: true,
    message: 'Get submissions endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/faculty/submissions/:assignmentId',
      assignment_id: req.params.assignmentId
    }
  });
});

// @route   PUT /api/faculty/submissions/:id/grade
// @desc    Grade assignment submission
// @access  Private (Faculty only)
router.put('/submissions/:id/grade', (req, res) => {
  res.json({
    success: true,
    message: 'Grade submission endpoint - To be implemented',
    data: {
      endpoint: 'PUT /api/faculty/submissions/:id/grade',
      submission_id: req.params.id,
      required_fields: ['grade', 'feedback']
    }
  });
});

// @route   POST /api/faculty/online-classes
// @desc    Schedule online class
// @access  Private (Faculty only)
router.post('/online-classes', (req, res) => {
  res.json({
    success: true,
    message: 'Schedule online class endpoint - To be implemented',
    data: {
      endpoint: 'POST /api/faculty/online-classes',
      required_fields: ['title', 'class', 'subject', 'date', 'time', 'duration']
    }
  });
});

// @route   GET /api/faculty/online-classes
// @desc    Get scheduled online classes
// @access  Private (Faculty only)
router.get('/online-classes', (req, res) => {
  res.json({
    success: true,
    message: 'Get online classes endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/faculty/online-classes',
      query_params: ['date_from', 'date_to', 'class', 'subject']
    }
  });
});

// @route   GET /api/faculty/profile
// @desc    Get faculty profile
// @access  Private (Faculty only)
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Get faculty profile endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/faculty/profile'
    }
  });
});

// @route   PUT /api/faculty/profile
// @desc    Update faculty profile
// @access  Private (Faculty only)
router.put('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Update faculty profile endpoint - To be implemented',
    data: {
      endpoint: 'PUT /api/faculty/profile',
      updatable_fields: ['phone', 'address', 'bio', 'profile_picture']
    }
  });
});

module.exports = router;