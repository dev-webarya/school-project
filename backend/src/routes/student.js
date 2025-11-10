const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../models/Student');

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

// @route   GET /api/student/dashboard
// @desc    Get student dashboard data
// @access  Private (Student only)
router.get('/dashboard', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    // Get student profile
    const studentProfile = await Student.findOne({ userId: req.user.id });
    
    // Sample data for today's classes (would come from actual schedule model)
    const todaysClasses = [
      {
        id: 1,
        subject: 'Mathematics',
        time: '10:00 AM - 11:00 AM',
        teacher: 'Mr. Sharma',
        room: 'Room 201',
        status: 'upcoming'
      },
      {
        id: 2,
        subject: 'Science',
        time: '11:15 AM - 12:15 PM',
        teacher: 'Mrs. Gupta',
        room: 'Lab 2',
        status: 'upcoming'
      },
      {
        id: 3,
        subject: 'English',
        time: '01:30 PM - 02:30 PM',
        teacher: 'Ms. Patel',
        room: 'Room 105',
        status: 'upcoming'
      }
    ];
    
    // Sample assignments data (would come from actual assignments model)
    const assignments = [
      {
        id: 1,
        subject: 'Mathematics',
        title: 'Algebra Assignment',
        dueDate: '2024-01-15',
        status: 'pending',
        priority: 'high'
      },
      {
        id: 2,
        subject: 'Science',
        title: 'Physics Lab Report',
        dueDate: '2024-01-18',
        status: 'submitted',
        priority: 'medium'
      },
      {
        id: 3,
        subject: 'English',
        title: 'Essay on Literature',
        dueDate: '2024-01-20',
        status: 'pending',
        priority: 'medium'
      }
    ];
    
    // Sample recent grades (would come from actual grades model)
    const recentGrades = [
      {
        id: 1,
        subject: 'Mathematics',
        assignment: 'Unit Test 1',
        grade: 'A',
        marks: '85/100',
        date: getTimeAgo(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))
      },
      {
        id: 2,
        subject: 'Science',
        assignment: 'Lab Practical',
        grade: 'B+',
        marks: '78/100',
        date: getTimeAgo(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000))
      }
    ];
    
    // Sample attendance summary (would come from actual attendance model)
    const attendanceSummary = {
      totalClasses: 120,
      attendedClasses: 108,
      percentage: 90,
      status: 'good'
    };

    const dashboardData = {
      studentInfo: {
        name: `${req.user.firstName} ${req.user.lastName}`,
        email: req.user.email,
        class: studentProfile?.class || '10-A',
        rollNumber: studentProfile?.rollNumber || 'N/A',
        studentId: studentProfile?.studentId || 'N/A'
      },
      todaysClasses,
      assignments: {
        total: assignments.length,
        pending: assignments.filter(a => a.status === 'pending').length,
        submitted: assignments.filter(a => a.status === 'submitted').length,
        list: assignments
      },
      recentGrades,
      attendanceSummary,
      quickStats: {
        totalSubjects: 6,
        upcomingTests: 2,
        pendingFees: 0,
        libraryBooks: 3
      }
    };

    res.json({
      success: true,
      message: 'Student dashboard data retrieved successfully',
      data: dashboardData
    });

  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/student/profile
// @desc    Get student profile
// @access  Private (Student only)
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Get student profile endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/student/profile',
      returns: ['personal_info', 'academic_info', 'parent_contact']
    }
  });
});

// @route   PUT /api/student/profile
// @desc    Update student profile
// @access  Private (Student only)
router.put('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Update student profile endpoint - To be implemented',
    data: {
      endpoint: 'PUT /api/student/profile',
      updatable_fields: ['phone', 'address', 'emergency_contact', 'profile_picture']
    }
  });
});

// @route   GET /api/student/assignments
// @desc    Get student assignments
// @access  Private (Student only)
router.get('/assignments', (req, res) => {
  res.json({
    success: true,
    message: 'Get assignments endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/student/assignments',
      query_params: ['subject', 'status', 'due_date'],
      status_options: ['pending', 'submitted', 'graded']
    }
  });
});

// @route   POST /api/student/assignments/:id/submit
// @desc    Submit assignment
// @access  Private (Student only)
router.post('/assignments/:id/submit', (req, res) => {
  res.json({
    success: true,
    message: 'Submit assignment endpoint - To be implemented',
    data: {
      endpoint: 'POST /api/student/assignments/:id/submit',
      assignment_id: req.params.id,
      required_fields: ['submission_text', 'attachments']
    }
  });
});

// @route   GET /api/student/grades
// @desc    Get published grades for the logged-in student
// @access  Private (Student only)
router.get('/grades', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    const Student = require('../models/Student');
    const Grade = require('../models/Grade');

    const studentDoc = await Student.findOne({ user: req.user._id || req.user.id });
    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const grades = await Grade.find({ student: studentDoc._id, isPublished: true })
      .populate('course', 'name courseCode credits')
      .sort({ assessmentDate: -1 })
      .limit(200);

    const data = grades.map(g => ({
      subject: g.course?.name || 'Unknown',
      assessment: g.assessmentName,
      marks: g.obtainedMarks,
      totalMarks: g.maxMarks,
      grade: g.letterGrade,
      remarks: g.remarks,
      date: g.assessmentDate
    }));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Student grades error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch grades', error: error.message });
  }
});

// @route   GET /api/student/attendance
// @desc    Get student attendance
// @access  Private (Student only)
router.get('/attendance', (req, res) => {
  res.json({
    success: true,
    message: 'Get attendance endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/student/attendance',
      query_params: ['subject', 'date_from', 'date_to']
    }
  });
});

// @route   GET /api/student/schedule
// @desc    Get class schedule
// @access  Private (Student only)
router.get('/schedule', (req, res) => {
  res.json({
    success: true,
    message: 'Get schedule endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/student/schedule',
      query_params: ['date', 'week']
    }
  });
});

// @route   GET /api/student/online-classes
// @desc    Get online classes
// @access  Private (Student only)
router.get('/online-classes', (req, res) => {
  res.json({
    success: true,
    message: 'Get online classes endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/student/online-classes',
      query_params: ['date_from', 'date_to', 'subject']
    }
  });
});

// @route   POST /api/student/online-classes/:id/join
// @desc    Join online class
// @access  Private (Student only)
router.post('/online-classes/:id/join', (req, res) => {
  res.json({
    success: true,
    message: 'Join online class endpoint - To be implemented',
    data: {
      endpoint: 'POST /api/student/online-classes/:id/join',
      class_id: req.params.id,
      returns: ['meeting_link', 'access_code']
    }
  });
});

// @route   GET /api/student/fees
// @desc    Get fee information
// @access  Private (Student only)
router.get('/fees', (req, res) => {
  res.json({
    success: true,
    message: 'Get fees endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/student/fees',
      returns: ['fee_structure', 'payment_history', 'pending_fees', 'due_dates']
    }
  });
});

// @route   POST /api/student/fees/payment
// @desc    Process fee payment
// @access  Private (Student only)
router.post('/fees/payment', (req, res) => {
  res.json({
    success: true,
    message: 'Fee payment endpoint - To be implemented',
    data: {
      endpoint: 'POST /api/student/fees/payment',
      required_fields: ['amount', 'payment_method', 'fee_type']
    }
  });
});

// @route   GET /api/student/library
// @desc    Get library information
// @access  Private (Student only)
router.get('/library', (req, res) => {
  res.json({
    success: true,
    message: 'Get library info endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/student/library',
      returns: ['issued_books', 'due_dates', 'fines', 'available_books']
    }
  });
});

// @route   POST /api/student/library/request
// @desc    Request book from library
// @access  Private (Student only)
router.post('/library/request', (req, res) => {
  res.json({
    success: true,
    message: 'Request book endpoint - To be implemented',
    data: {
      endpoint: 'POST /api/student/library/request',
      required_fields: ['book_id', 'request_date']
    }
  });
});

// @route   GET /api/student/notifications
// @desc    Get student notifications
// @access  Private (Student only)
router.get('/notifications', (req, res) => {
  res.json({
    success: true,
    message: 'Get notifications endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/student/notifications',
      query_params: ['type', 'read_status', 'limit']
    }
  });
});

// @route   PUT /api/student/notifications/:id/read
// @desc    Mark notification as read
// @access  Private (Student only)
router.put('/notifications/:id/read', (req, res) => {
  res.json({
    success: true,
    message: 'Mark notification read endpoint - To be implemented',
    data: {
      endpoint: 'PUT /api/student/notifications/:id/read',
      notification_id: req.params.id
    }
  });
});

module.exports = router;