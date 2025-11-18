const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const User = require('../models/User');

// Test route at the beginning
router.get('/test-get-beginning', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    res.json({ success: true, message: 'GET works at beginning' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
const Faculty = require('../models/Faculty');
const OnlineClass = require('../models/OnlineClass');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Attendance = require('../models/Attendance');
const FacultyAssignment = require('../models/FacultyAssignment');
const Schedule = require('../models/Schedule');

// Test route at the very beginning
router.patch('/test-patch-beginning', (req, res) => {
  res.json({ success: true, message: 'PATCH works at beginning' });
});

// Test GET route
router.get('/test-get', (req, res) => {
  res.json({ success: true, message: 'GET works' });
});

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
    const { session } = req.query;
    // Get faculty profile
    const facultyProfile = await Faculty.findOne({ user: req.user._id || req.user.id });

    // Basic counts
    const totalStudents = await User.countDocuments({ role: 'student', status: 'active' });

    // Compute assignments and courses by session (if provided)
    let totalAssignments = 0;
    let activeCourses = 0;
    if (facultyProfile) {
      const assignmentFilter = { facultyId: facultyProfile._id };
      if (session) assignmentFilter.session = session;
      const facultyAssignments = await FacultyAssignment.find(assignmentFilter).lean();
      totalAssignments = facultyAssignments.length;
      const distinctCourseIds = new Set(facultyAssignments.map(a => String(a.courseId)));
      activeCourses = distinctCourseIds.size;
    }

    // Upcoming classes for today from Schedule
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDay = days[new Date().getDay()];
    let upcomingClasses = [];
    let classesToday = 0;
    if (facultyProfile) {
      const schedules = await Schedule.find({ faculty: facultyProfile._id, day: todayDay })
        .sort({ startTime: 1 })
        .lean();
      classesToday = schedules.length;
      upcomingClasses = schedules.map((s, idx) => ({
        id: idx + 1,
        time: s.startTime,
        course: `${s.subject || 'Subject'}${s.description ? ' - ' + s.description : ''}`,
        room: s.room || 'N/A',
        class: s.className || 'N/A',
        subject: s.subject || 'N/A'
      }));
    }

    // Recent activities from assignment submissions created via faculty-created assignments
    let recentActivities = [];
    try {
      const assignments = await Assignment.find({ createdBy: facultyProfile?._id }).select('class section');
      const assignmentIds = assignments.map(a => a._id);
      if (assignmentIds.length) {
        const submissions = await AssignmentSubmission
          .find({ assignment: { $in: assignmentIds } })
          .populate({ path: 'student', select: 'studentId rollNumber user', populate: { path: 'user', select: 'firstName lastName' } })
          .populate('assignment', 'class section')
          .sort({ submittedAt: -1 })
          .limit(10);

        recentActivities = submissions.map((s, idx) => ({
          id: idx + 1,
          type: 'assignment',
          message: `New assignment submitted by ${
            s.student?.user ? `${s.student.user.firstName || ''} ${s.student.user.lastName || ''}`.trim() : (s.student?.studentId || 'Student')
          }`,
          time: getTimeAgo(s.submittedAt),
          class: `${s.assignment?.class || ''}${s.assignment?.section ? '-' + s.assignment.section : ''}`.trim() || 'N/A'
        }));
      }
    } catch (e) {
      console.warn('Recent activities generation error:', e.message);
    }

    // Fallback sample data if nothing available
    if (!classesToday && upcomingClasses.length === 0) {
      upcomingClasses = [
        { id: 1, time: '09:00 AM', course: 'Mathematics - Algebra', room: 'Room 201', class: '10-A', subject: 'Mathematics' },
        { id: 2, time: '10:00 AM', course: 'Physics - Motion', room: 'Lab 2', class: '10-A', subject: 'Physics' },
        { id: 3, time: '11:00 AM', course: 'Mathematics - Geometry', room: 'Room 203', class: '10-B', subject: 'Mathematics' }
      ];
      classesToday = 3;
    }

    const dashboardData = {
      stats: {
        classesToday,
        activeCourses,
        totalStudents: Math.floor(totalStudents * 0.3),
        totalAssignments
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

    res.json({ success: true, message: 'Faculty dashboard data retrieved successfully', data: dashboardData });

  } catch (error) {
    console.error('Faculty dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch faculty dashboard data', error: error.message });
  }
});

// @route   GET /api/faculty/teaching-assignments
// @desc    List admin-assigned teaching assignments for the logged-in faculty
// @access  Private (Faculty only)
router.get('/teaching-assignments', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    const { session, academicYear, status } = req.query;
    const faculty = await Faculty.findOne({ user: req.user._id || req.user.id }).select('_id employeeId');
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    const query = { facultyId: faculty._id };
    if (session) query.session = session;
    if (academicYear) query.academicYear = academicYear;
    if (status === 'completed') query.completed = true;
    if (status === 'active') query.completed = false;

    const items = await FacultyAssignment.find(query).sort({ startDate: 1 }).lean();

    // Provide simple computed display fields for frontend convenience
    const data = items.map(a => ({
      _id: a._id,
      facultyId: String(a.facultyId),
      academicYear: a.academicYear,
      session: a.session,
      assignmentType: a.assignmentType,
      startDate: a.startDate,
      endDate: a.endDate,
      workload: a.workload || 0,
      notes: a.notes || '',
      completed: !!a.completed,
      courseId: a.courseId || 'GENERAL',
      classId: a.classId || 'GENERAL',
      course: a.courseId && a.courseId !== 'GENERAL' ? { code: a.courseId } : { code: 'GENERAL', courseName: 'General' },
      class: a.classId && a.classId !== 'GENERAL' ? { id: a.classId } : { id: 'GENERAL', name: 'General' }
    }));

    res.json({ success: true, message: 'Teaching assignments retrieved', data });
  } catch (error) {
    console.error('Faculty teaching assignments error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve teaching assignments', error: error.message });
  }
});

// @route   GET /api/faculty/classes
// @desc    Get assigned classes
// @access  Private (Faculty only)
router.get('/classes', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id || req.user.id });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    const courses = await Course.find({ faculty: faculty._id })
      .populate('faculty', 'employeeId department designation')
      .populate('enrolledStudents', 'studentId rollNumber user')
      .sort({ class: 1, subject: 1 });

    res.json({ success: true, message: 'Assigned courses retrieved', data: courses });
  } catch (error) {
    console.error('Faculty get classes error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve classes', error: error.message });
  }
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

// @route   POST /api/faculty/courses
// @desc    Create a course taught by the faculty
// @access  Private (Faculty only)
router.post('/courses', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    const { courseName, subject, class: classNameRaw, section: sectionRaw, schedule, description, maxStudents } = req.body;
    if (!courseName || !subject || !classNameRaw) {
      return res.status(400).json({ success: false, message: 'courseName, subject and class are required' });
    }
    const faculty = await Faculty.findOne({ user: req.user._id || req.user.id });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    // Normalize class and optional section
    let section = (sectionRaw || '').trim().toUpperCase();
    let className = String(classNameRaw).trim().toUpperCase();
    if (!section && (className.includes('-') || className.includes(' '))) {
      const parts = className.split(/[\s-]+/).filter(Boolean);
      if (parts.length >= 2) {
        className = parts[0];
        section = parts[1];
      }
    }
    const allowedClasses = ['NS','LKG','UKG','1','2','3','4','5','6','7','8','9','10','11','12'];
    if (!allowedClasses.includes(className)) {
      return res.status(400).json({ success: false, message: 'Invalid class. Use one of NS, LKG, UKG, 1-12 (section optional).' });
    }
    const safeSchedule = {
      days: Array.isArray(schedule?.days) ? schedule.days : (typeof schedule?.days === 'string' ? schedule.days.split(',').map(d=>d.trim()).filter(Boolean) : []),
      startTime: schedule?.startTime || '',
      endTime: schedule?.endTime || ''
    };
    const course = new Course({
      courseName,
      subject,
      class: className,
      section,
      faculty: faculty._id,
      schedule: safeSchedule,
      description: description || '',
      maxStudents: maxStudents || 0,
      enrolledStudents: []
    });
    await course.save();
    await course.populate('faculty', 'employeeId department designation');

    res.json({ success: true, message: 'Course created successfully', data: course });
  } catch (error) {
    console.error('Create course error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors || {}).map(k => ({ path: k, message: error.errors[k].message }));
      return res.status(422).json({ success: false, message: 'Validation error. Please check your input.', errors });
    }
    res.status(500).json({ success: false, message: 'Failed to create course', error: error.message });
  }
});

// @route   DELETE /api/faculty/courses/:id
// @desc    Delete a course created by the logged-in faculty (owns-only)
// @access  Private (Faculty only)
router.delete('/courses/:id', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    const { id } = req.params;
    const faculty = await Faculty.findOne({ user: req.user._id || req.user.id }).select('_id');
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    const deleted = await Course.findOneAndDelete({ _id: id, faculty: faculty._id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Course not found or not owned by you' });
    }

    return res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete course', error: error.message });
  }
});

// @route   POST /api/faculty/assignments
// @desc    Create assignment for a course/class
// @access  Private (Faculty only)
router.post('/assignments', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    const { title, description, subject, class: className, section, courseId, dueDate } = req.body;
    if (!title || !subject || !className || !dueDate) {
      return res.status(400).json({ success: false, message: 'title, subject, class and dueDate are required' });
    }
    const faculty = await Faculty.findOne({ user: req.user._id || req.user.id });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty profile not found' });

    const payload = {
      title,
      description: description || '',
      subject,
      class: className,
      section: section || '',
      dueDate: new Date(dueDate),
      createdBy: faculty._id
    };
    if (courseId) payload.course = courseId;

    const assignment = new Assignment(payload);
    await assignment.save();
    await assignment.populate('createdBy', 'employeeId department designation');

    res.json({ success: true, message: 'Assignment created successfully', data: assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create assignment', error: error.message });
  }
});

// @route   GET /api/faculty/assignments
// @desc    List assignments created by faculty
// @access  Private (Faculty only)
router.get('/assignments', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id || req.user.id });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty profile not found' });

    const { class: className, subject } = req.query;
    const query = { createdBy: faculty._id };
    if (className) query.class = className;
    if (subject) query.subject = subject;

    const assignments = await Assignment.find(query)
      .populate('course', 'courseName subject class section')
      .sort({ dueDate: 1 });

    res.json({ success: true, message: 'Assignments retrieved successfully', data: assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve assignments', error: error.message });
  }
});

// @route   GET /api/faculty/assignments/:id/submissions
// @desc    List submissions for a specific assignment created by the faculty
// @access  Private (Faculty only)
router.get('/assignments/:id/submissions', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id || req.user.id });
    if (!faculty) return res.status(404).json({ success: false, message: 'Faculty profile not found' });

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    if (String(assignment.createdBy) !== String(faculty._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view submissions for this assignment' });
    }

    const submissions = await AssignmentSubmission.find({ assignment: assignment._id })
      .populate('student', 'studentId rollNumber user')
      .sort({ submittedAt: -1 });

    res.json({ success: true, message: 'Submissions retrieved successfully', data: submissions });
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve submissions', error: error.message });
  }
});

// @route   POST /api/faculty/attendance
// @desc    Mark student attendance
// @access  Private (Faculty only)
const { body, query } = require('express-validator');
const mongoose = require('mongoose');

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

      // Resolve faculty profile for references
      const facultyProfile = await Faculty.findOne({ user: req.user._id || req.user.id }).select('_id');
      if (!facultyProfile) {
        return res.status(404).json({ success: false, message: 'Faculty profile not found' });
      }

      // Optionally validate course exists and belongs to faculty
      const courseIds = [...new Set(records.map(r => r.course))];
      const courses = await Course.find({ _id: { $in: courseIds } });
      if (courses.length !== courseIds.length) {
        return res.status(400).json({ success: false, message: 'Invalid course in records' });
      }

      // Resolve student identifiers: allow Student ObjectId OR studentId/rollNumber strings
      const resolvedRecords = [];
      for (const r of records) {
        let studentObjId = null;
        // If a valid ObjectId string passed, use it directly
        if (typeof r.student === 'string' && mongoose.Types.ObjectId.isValid(r.student)) {
          studentObjId = r.student;
        } else {
          // Try lookup by studentId, then by rollNumber
          const stu = await Student.findOne({ studentId: r.student })
            || await Student.findOne({ rollNumber: r.student })
            || await Student.findOne({ admissionNumber: r.student });
          if (!stu) {
            return res.status(400).json({ success: false, message: `Student not found for identifier: ${r.student}` });
          }
          studentObjId = stu._id;
        }
        resolvedRecords.push({ ...r, student: studentObjId });
      }

      const docs = resolvedRecords.map(r => ({
        student: r.student,
        course: r.course,
        faculty: facultyProfile._id,
        date: date || new Date(),
        status: r.status,
        timeIn: r.timeIn,
        timeOut: r.timeOut,
        remarks: r.remarks,
        markedBy: facultyProfile._id,
        academicYear,
        session: r.session || r.semester || '1',
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
      res.status(500).json({ success: false, message: 'Failed to mark attendance', error: error.message });
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
router.post('/online-classes', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    const { title, subject, className, date, time, duration, platform, description } = req.body;
    
    // Validate required fields
    if (!title || !subject || !className || !date || !time || !duration || !platform) {
      return res.status(400).json({ 
        success: false, 
        message: 'All required fields must be provided' 
      });
    }

    // Get faculty profile
    const faculty = await Faculty.findOne({ user: req.user._id || req.user.id });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    // Get students for the specified class
    const students = await Student.find({ class: className, status: 'active' })
      .select('_id studentId rollNumber');

    // Create new online class
    const onlineClass = new OnlineClass({
      title,
      subject,
      className,
      faculty: faculty._id,
      date: new Date(date),
      time,
      duration,
      platform,
      description: description || '',
      students: students.map(s => s._id)
    });

    // Generate meeting link will be done automatically by pre-save middleware
    await onlineClass.save();

    // Populate faculty and students for response
    await onlineClass.populate('faculty', 'employeeId department designation');
    await onlineClass.populate('students', 'studentId rollNumber user');

    res.json({
      success: true,
      message: 'Online class created successfully',
      data: onlineClass
    });
  } catch (error) {
    console.error('Create online class error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create online class',
      error: error.message 
    });
  }
});

// @route   GET /api/faculty/online-classes
// @desc    Get scheduled online classes
// @access  Private (Faculty only)
router.get('/online-classes', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id || req.user.id });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    // Build query
    let query = { faculty: faculty._id };
    
    // Add filters if provided
    if (req.query.date_from) {
      query.date = { $gte: new Date(req.query.date_from) };
    }
    if (req.query.date_to) {
      query.date = { ...query.date, $lte: new Date(req.query.date_to) };
    }
    if (req.query.class) {
      query.className = req.query.class;
    }
    if (req.query.subject) {
      query.subject = req.query.subject;
    }

    const onlineClasses = await OnlineClass.find(query)
      .populate('faculty', 'employeeId department designation')
      .populate('students', 'studentId rollNumber user')
      .sort({ date: -1, time: -1 });

    res.json({
      success: true,
      message: 'Online classes retrieved successfully',
      data: onlineClasses
    });
  } catch (error) {
    console.error('Get online classes error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve online classes',
      error: error.message 
    });
  }
});

// Test GET route after working GET route - exact copy of working route
router.get('/test-after-get', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    res.json({ success: true, message: 'GET works after GET' });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Test PATCH route after working GET route - exact copy of working route but PATCH
router.patch('/test-after-get', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    res.json({ success: true, message: 'PATCH works after GET' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/faculty/online-classes/:id
// @desc    Get single online class by ID
// @access  Private (Faculty only)
router.get('/online-classes/:id', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    const onlineClass = await OnlineClass.findById(req.params.id)
      .populate('faculty', 'employeeId department designation')
      .populate('students', 'studentId rollNumber user');

    if (!onlineClass) {
      return res.status(404).json({ 
        success: false, 
        message: 'Online class not found' 
      });
    }

    // Check if the faculty member owns this class
    const faculty = await Faculty.findOne({ user: req.user._id || req.user.id });
    if (!faculty || onlineClass.faculty._id.toString() !== faculty._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      message: 'Online class retrieved successfully',
      data: onlineClass
    });
  } catch (error) {
    console.error('Get single online class error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve online class',
      error: error.message 
    });
  }
});

// Test route to verify PATCH method works
router.patch('/test-patch', (req, res) => {
  res.json({ success: true, message: 'PATCH method works' });
});

// @route   PATCH /api/faculty/online-classes/:id/status
// @desc    Update online class status
// @access  Private (Faculty only)
router.patch('/online-classes/:id/status', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status to match schema and frontend usage
    // Accept synonyms: 'live' (preferred) and 'in-progress' (legacy)
    const normalizedStatus =
      status === 'in-progress' ? 'live' : status;

    if (!['scheduled', 'live', 'completed', 'cancelled'].includes(normalizedStatus)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of: scheduled, live, completed, cancelled' 
      });
    }

    // Get faculty profile
    const faculty = await Faculty.findOne({ user: req.user._id || req.user.id });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    // Find and update online class
    const onlineClass = await OnlineClass.findOneAndUpdate(
      { _id: req.params.id, faculty: faculty._id },
      { status: normalizedStatus },
      { new: true }
    ).populate('faculty', 'employeeId department designation')
     .populate('students', 'studentId rollNumber user');

    if (!onlineClass) {
      return res.status(404).json({ success: false, message: 'Online class not found or not authorized' });
    }

    res.json({
      success: true,
      message: 'Online class status updated successfully',
      data: onlineClass
    });
  } catch (error) {
    console.error('Update online class status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update online class status',
      error: error.message 
    });
  }
});

// @route   PUT /api/faculty/online-classes/:id
// @desc    Update online class details
// @access  Private (Faculty only)
router.put('/online-classes/:id', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    const { title, subject, className, date, time, duration, platform, description } = req.body;

    // Get faculty profile
    const faculty = await Faculty.findOne({ user: req.user._id || req.user.id });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    // Find and update online class
    const updateData = {};
    if (title) updateData.title = title;
    if (subject) updateData.subject = subject;
    if (className) updateData.className = className;
    if (date) updateData.date = new Date(date);
    if (time) updateData.time = time;
    if (duration) updateData.duration = duration;
    if (platform) updateData.platform = platform;
    if (description !== undefined) updateData.description = description;

    const onlineClass = await OnlineClass.findOneAndUpdate(
      { _id: req.params.id, faculty: faculty._id },
      updateData,
      { new: true }
    ).populate('faculty', 'employeeId department designation')
     .populate('students', 'studentId rollNumber user');

    if (!onlineClass) {
      return res.status(404).json({ success: false, message: 'Online class not found or not authorized' });
    }

    res.json({
      success: true,
      message: 'Online class updated successfully',
      data: onlineClass
    });
  } catch (error) {
    console.error('Update online class error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update online class',
      error: error.message 
    });
  }
});

// @route   DELETE /api/faculty/online-classes/:id
// @desc    Delete online class
// @access  Private (Faculty only)
router.delete('/online-classes/:id', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    // Get faculty profile
    const faculty = await Faculty.findOne({ user: req.user._id || req.user.id });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    // Find and delete online class
    const onlineClass = await OnlineClass.findOneAndDelete({
      _id: req.params.id,
      faculty: faculty._id
    });

    if (!onlineClass) {
      return res.status(404).json({ success: false, message: 'Online class not found or not authorized' });
    }

    res.json({
      success: true,
      message: 'Online class deleted successfully'
    });
  } catch (error) {
    console.error('Delete online class error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete online class',
      error: error.message 
    });
  }
});

// @route   GET /api/faculty/profile
// @desc    Get faculty profile
// @access  Private (Faculty only)
router.get('/profile', authenticateToken, requireRole(['faculty']), async (req, res) => {
  try {
    const faculty = await Faculty
      .findOne({ user: req.user._id || req.user.id })
      .populate('user', 'firstName lastName email phone');

    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    const name = faculty.user
      ? `${faculty.user.firstName || ''} ${faculty.user.lastName || ''}`.trim() || 'Unknown'
      : `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Unknown';

    const data = {
      user: {
        name,
        email: faculty.user?.email || req.user.email || 'N/A',
        phone: faculty.user?.phone || req.user.phone || 'N/A',
      },
      department: faculty.department || 'Not specified',
      designation: faculty.designation || 'Not specified',
      employeeId: faculty.employeeId || 'N/A',
      joiningDate: faculty.joiningDate || null
    };

    res.json({ success: true, message: 'Faculty profile retrieved successfully', data });
  } catch (error) {
    console.error('Get faculty profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch faculty profile', error: error.message });
  }
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
