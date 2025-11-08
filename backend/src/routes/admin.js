const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticateToken, requireRole } = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admission = require('../models/Admission');
const { FeeStructure, FeePayment, FeeDue } = require('../models/Fee');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin only)
router.get('/dashboard', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get statistics
    const totalStudents = await User.countDocuments({ role: 'student', status: 'active' });
    const totalFaculty = await User.countDocuments({ role: 'faculty', status: 'active' });
    const totalUsers = await User.countDocuments({ status: 'active' });
    
    // Get recent notifications (last 10 users registered)
    const recentUsers = await User.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('firstName lastName role createdAt');

    // Generate sample notifications
    const recentNotifications = recentUsers.map((user, index) => ({
      id: user._id,
      message: `New ${user.role} registration: ${user.firstName} ${user.lastName}`,
      time: getTimeAgo(user.createdAt),
      type: 'registration'
    }));

    // Add some sample system notifications
    recentNotifications.push(
      {
        id: 'sys1',
        message: 'System backup completed successfully',
        time: '2 hours ago',
        type: 'system'
      },
      {
        id: 'sys2',
        message: 'Monthly fee collection report generated',
        time: '1 day ago',
        type: 'report'
      }
    );

    // Sample pending tasks
    const pendingTasks = [
      { id: 1, task: `Review ${totalStudents > 0 ? Math.min(5, totalStudents) : 0} new student applications`, priority: 'High' },
      { id: 2, task: 'Approve faculty leave requests', priority: 'Medium' },
      { id: 3, task: 'Update fee structure for next session', priority: 'High' },
      { id: 4, task: 'Schedule parent-teacher meeting', priority: 'Medium' }
    ];

    res.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalFaculty,
          activeCourses: 42, // This would come from a Courses model
          monthlyRevenue: '₹ 28.5L' // This would come from fee payments
        },
        recentNotifications: recentNotifications.slice(0, 4),
        pendingTasks
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    return `${diffInDays} days ago`;
  }
}

// @route   GET /api/admin/students
// @desc    Get all students
// @access  Private (Admin only)
router.get('/students', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', class: studentClass = '' } = req.query;
    
    // Build query
    let query = { role: 'student', status: 'active' };
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get students with pagination
    const students = await User.find(query)
      .select('firstName lastName email phone dateOfBirth createdAt status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalStudents = await User.countDocuments(query);
    const totalPages = Math.ceil(totalStudents / parseInt(limit));

    // Transform data for frontend
    const studentsData = students.map(student => ({
      id: student._id,
      name: `${student.firstName} ${student.lastName}`,
      email: student.email,
      phone: student.phone || 'N/A',
      class: 'Class 10', // This would come from Student model
      admissionDate: student.createdAt.toLocaleDateString(),
      status: student.status
    }));

    res.json({
      success: true,
      data: {
        students: studentsData,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalStudents,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// @route   GET /api/admin/students/:id
// @desc    Get single student with detailed profile, grades, and attendance
// @access  Private (Admin only)
router.get('/students/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Try fetching by Student ID first; if not found, treat id as User ID
    let studentDoc = await Student.findById(id).populate('user', 'firstName lastName email phone dateOfBirth gender status');
    if (!studentDoc) {
      studentDoc = await Student.findOne({ user: id }).populate('user', 'firstName lastName email phone dateOfBirth gender status');
    }

    if (!studentDoc) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const academicYear = studentDoc.academicYear;

    // Attendance summary for current academic year
    const [totalClasses, presentClasses] = await Promise.all([
      Attendance.countDocuments({ student: studentDoc._id, academicYear }),
      Attendance.countDocuments({ student: studentDoc._id, academicYear, status: { $in: ['Present', 'Late'] } })
    ]);
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : studentDoc.overallAttendance || 0;

    // Recent attendance records
    const attendanceHistory = await Attendance.find({ student: studentDoc._id })
      .populate('course', 'name courseCode')
      .sort({ date: -1 })
      .limit(100);

    // Grades (latest 50) and GPA metrics
    const grades = await Grade.find({ student: studentDoc._id, isPublished: true })
      .populate('course', 'name courseCode credits')
      .sort({ assessmentDate: -1 })
      .limit(50);

    let gpaSem1 = 0;
    let gpaSem2 = 0;
    try {
      gpaSem1 = await Grade.calculateGPA(studentDoc._id, academicYear, '1');
      gpaSem2 = await Grade.calculateGPA(studentDoc._id, academicYear, '2');
    } catch (e) {
      // ignore GPA calc errors and default to 0
    }
    const gpaOverall = Number(((gpaSem1 + gpaSem2) / (gpaSem1 && gpaSem2 ? 2 : (gpaSem1 ? 1 : (gpaSem2 ? 1 : 1)))).toFixed(2));

    const profile = {
      personal: {
        id: String(studentDoc._id),
        studentId: studentDoc.studentId,
        rollNumber: studentDoc.rollNumber,
        class: studentDoc.class,
        section: studentDoc.section,
        academicYear: studentDoc.academicYear,
        admissionDate: studentDoc.admissionDate,
        status: studentDoc.status,
        name: `${studentDoc.user?.firstName || ''} ${studentDoc.user?.lastName || ''}`.trim(),
        email: studentDoc.user?.email,
        phone: studentDoc.user?.phone,
        gender: studentDoc.user?.gender,
        dateOfBirth: studentDoc.user?.dateOfBirth
      },
      fee: {
        structure: studentDoc.feeStructure,
        status: studentDoc.feeStatus,
        totalAmount: studentDoc.totalFeeAmount
      },
      transport: studentDoc.transport,
      documents: studentDoc.documents
    };

    const academicRecords = grades.map(g => ({
      id: String(g._id),
      course: {
        id: String(g.course?._id || ''),
        name: g.course?.name,
        code: g.course?.courseCode,
        credits: g.course?.credits
      },
      assessmentType: g.assessmentType,
      assessmentName: g.assessmentName,
      maxMarks: g.maxMarks,
      obtainedMarks: g.obtainedMarks,
      percentage: Number(g.percentage?.toFixed(2) || 0),
      letterGrade: g.letterGrade,
      gradePoints: g.gradePoints,
      assessmentDate: g.assessmentDate,
      session: g.session || g.semester,
      remarks: g.remarks
    }));

    const attendance = attendanceHistory.map(r => ({
      id: String(r._id),
      date: r.date,
      course: { id: String(r.course?._id || ''), name: r.course?.name, code: r.course?.courseCode },
      status: r.status,
      timeIn: r.timeIn,
      timeOut: r.timeOut,
      remarks: r.remarks
    }));

    const performanceMetrics = {
      attendancePercentage,
      gpa: {
        session1: Number(gpaSem1.toFixed ? gpaSem1.toFixed(2) : gpaSem1),
        session2: Number(gpaSem2.toFixed ? gpaSem2.toFixed(2) : gpaSem2),
        // legacy fields for backward compatibility
        semester1: Number(gpaSem1.toFixed ? gpaSem1.toFixed(2) : gpaSem1),
        semester2: Number(gpaSem2.toFixed ? gpaSem2.toFixed(2) : gpaSem2),
        overall: gpaOverall
      },
      status: studentDoc.status
    };

    res.json({ success: true, data: { profile, academicRecords, attendance, performanceMetrics } });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ success: false, message: 'Error fetching student details', error: error.message });
  }
});

// @route   POST /api/admin/students
// @desc    Add new student
// @access  Private (Admin only)
router.post('/students', authenticateToken, requireRole(['admin']), async (req, res) => {
  let user;
  let student;
  let userSaved = false;
  let studentSaved = false;
  try {
    const {
      name,
      email,
      phone,
      rollNumber,
      class: studentClass,
      section,
      dateOfBirth,
      gender,
      fatherName,
      motherName,
      guardianPhone,
      address,
      admissionDate,
      bloodGroup,
      emergencyContact
    } = req.body;

    // Validate required fields including user model constraints
    if (!name || !email || !phone || !studentClass || !section || !rollNumber || !admissionDate || !dateOfBirth || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, phone, rollNumber, class, section, admissionDate, dateOfBirth, gender'
      });
    }

    // Normalize and validate phone numbers
    const normalizeDigits = (val) => (val ? String(val).replace(/\D/g, '') : '');
    const phoneDigits = normalizeDigits(phone);
    const guardianDigits = normalizeDigits(guardianPhone);
    if (phoneDigits.length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone must be a valid 10-digit number' });
    }

    // Check for existing user by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    // Derive first and last name
    const [firstName, ...rest] = name.trim().split(' ');
    const lastName = rest.join(' ') || '';

    // Create user with default password
    const defaultPassword = 'student123';

    // Build emergency contact object if provided as a phone string
    let emergencyContactObj;
    if (emergencyContact) {
      const ecDigits = normalizeDigits(emergencyContact);
      if (ecDigits.length === 10) {
        emergencyContactObj = { name: 'Emergency', relationship: 'other', phone: ecDigits };
      }
    }

    user = new User({
      firstName,
      lastName,
      email,
      phone: phoneDigits,
      role: 'student',
      status: 'active',
      password: defaultPassword, // Will be hashed by User pre-save hook
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender: typeof gender === 'string' ? gender.toLowerCase() : undefined,
      address: address ? { street: address } : undefined,
      emergencyContact: emergencyContactObj || (guardianDigits.length === 10 ? { name: fatherName || 'Guardian', relationship: 'parent', phone: guardianDigits } : undefined),
      emailVerified: true,
      phoneVerified: !!phone
    });
    await user.save();
    userSaved = true;

    // Compute academic year (YYYY-YYYY)
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; // Academic year starts in April
    const academicYear = `${year}-${year + 1}`;

    // Generate admission number
    const admissionNumber = `ADM${Date.now()}`;

    // Normalize class value to match schema enum
    const classMap = {
      '1st': '1', '2nd': '2', '3rd': '3', '4th': '4', '5th': '5',
      '6th': '6', '7th': '7', '8th': '8', '9th': '9', '10th': '10',
      '11th': '11', '12th': '12'
    };
    const normalizedClass = classMap[studentClass] || studentClass;

    const guardianValid = guardianDigits.length === 10;
    student = new Student({
      user: user._id,
      studentId: undefined, // will be generated by pre-save
      rollNumber,
      class: normalizedClass,
      section: typeof section === 'string' ? section.toUpperCase() : section,
      academicYear,
      admissionDate: new Date(admissionDate),
      admissionNumber,
      father: {
        name: fatherName || 'N/A',
        occupation: undefined,
        phone: guardianValid ? guardianDigits : phoneDigits
      },
      mother: {
        name: motherName || 'N/A'
      },
      guardian: {
        name: fatherName || 'Guardian',
        relationship: 'parent',
        phone: guardianValid ? guardianDigits : undefined
      },
      medicalInfo: {
        bloodGroup: bloodGroup || undefined
      },
      status: 'active'
    });
    await student.save();
    studentSaved = true;

    const savedStudent = await Student.findById(student._id).populate('user', 'firstName lastName email phone status');

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: savedStudent
    });
  } catch (error) {
    console.error('Add student error:', error);
    // Rollback: if user was created but student failed, remove the user to prevent orphan records
    if (userSaved && !studentSaved && user && user._id) {
      try {
        await User.findByIdAndDelete(user._id);
        console.warn(`Rolled back user ${user.email} due to student creation failure`);
      } catch (cleanupErr) {
        console.error('Rollback failed: could not delete user', cleanupErr);
      }
    }
    if (error.name === 'ValidationError') {
      // Extract detailed field-level validation errors
      const details = error.errors
        ? Object.values(error.errors).map(e => ({ path: e.path, message: e.message }))
        : [{ path: 'unknown', message: error.message }];
      return res.status(422).json({ success: false, message: 'Validation failed', errors: details });
    }
    res.status(500).json({ success: false, message: 'Error creating student', error: error.message });
  }
});

// @route   PUT /api/admin/students/:id
// @desc    Update student
// @access  Private (Admin only)
router.put('/students/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      rollNumber,
      class: studentClass,
      section,
      dateOfBirth,
      gender,
      fatherName,
      motherName,
      guardianPhone,
      address,
      admissionDate,
      bloodGroup,
      status
    } = req.body;

    const student = await Student.findById(id).populate('user');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Update user
    if (name) {
      const [firstName, ...rest] = name.trim().split(' ');
      student.user.firstName = firstName;
      student.user.lastName = rest.join(' ');
    }
    if (email) student.user.email = email;
    if (phone) student.user.phone = phone;
    if (dateOfBirth) student.user.dateOfBirth = new Date(dateOfBirth);
    if (gender) student.user.gender = String(gender).toLowerCase();
    if (address) student.user.address = { ...(student.user.address || {}), street: address };
    await student.user.save();

    // Update student doc
    if (rollNumber) student.rollNumber = rollNumber;
    if (studentClass) student.class = studentClass;
    if (section) student.section = section;
    if (admissionDate) student.admissionDate = new Date(admissionDate);
    if (fatherName) student.father = { ...(student.father || {}), name: fatherName };
    if (motherName) student.mother = { ...(student.mother || {}), name: motherName };
    if (guardianPhone) student.guardian = { ...(student.guardian || {}), phone: guardianPhone };
    if (bloodGroup) student.medicalInfo = { ...(student.medicalInfo || {}), bloodGroup };
    if (status) student.status = status;

    await student.save();

    const updatedStudent = await Student.findById(student._id).populate('user', 'firstName lastName email phone status');
    res.json({ success: true, message: 'Student updated successfully', data: updatedStudent });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: 'Error updating student', error: error.message });
  }
});

// @route   DELETE /api/admin/students/:id
// @desc    Delete student
// @access  Private (Admin only)
router.delete('/students/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Delete student endpoint - To be implemented',
    data: {
      endpoint: 'DELETE /api/admin/students/:id',
      student_id: req.params.id
    }
  });
});

// @route   GET /api/admin/faculty
// @desc    Get all faculty
// @access  Private (Admin only)
router.get('/faculty', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, department, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    // Add department filter if provided
    if (department && department !== 'all') {
      query.department = department;
    }

    // Add search functionality
    let userQuery = {};
    if (search) {
      userQuery = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get faculty with user details
    const facultyAggregation = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $match: {
          'userDetails.role': 'faculty',
          ...query,
          ...(search ? {
            $or: [
              { 'userDetails.firstName': { $regex: search, $options: 'i' } },
              { 'userDetails.lastName': { $regex: search, $options: 'i' } },
              { 'userDetails.email': { $regex: search, $options: 'i' } },
              { employeeId: { $regex: search, $options: 'i' } }
            ]
          } : {})
        }
      },
      {
        $project: {
          employeeId: 1,
          department: 1,
          designation: 1,
          subjects: 1,
          joiningDate: 1,
          status: 1,
          'userDetails.firstName': 1,
          'userDetails.lastName': 1,
          'userDetails.email': 1,
          'userDetails.phone': 1,
          'userDetails.status': 1
        }
      },
      { $sort: { 'userDetails.firstName': 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    const faculty = await Faculty.aggregate(facultyAggregation);
    
    // Get total count for pagination
    const totalCountAggregation = [
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $match: {
          'userDetails.role': 'faculty',
          ...query,
          ...(search ? {
            $or: [
              { 'userDetails.firstName': { $regex: search, $options: 'i' } },
              { 'userDetails.lastName': { $regex: search, $options: 'i' } },
              { 'userDetails.email': { $regex: search, $options: 'i' } },
              { employeeId: { $regex: search, $options: 'i' } }
            ]
          } : {})
        }
      },
      { $count: 'total' }
    ];

    const totalResult = await Faculty.aggregate(totalCountAggregation);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Transform data for frontend
    const transformedFaculty = faculty.map(f => ({
      id: f._id,
      employeeId: f.employeeId,
      name: `${f.userDetails.firstName} ${f.userDetails.lastName}`,
      email: f.userDetails.email,
      phone: f.userDetails.phone,
      department: f.department,
      designation: f.designation,
      subjects: f.subjects,
      joiningDate: f.joiningDate,
      status: f.userDetails.status === 'active' && f.status === 'active' ? 'Active' : 'Inactive'
    }));

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    res.json({
      success: true,
      message: 'Faculty data retrieved successfully',
      data: {
        faculty: transformedFaculty,
        pagination
      }
    });

  } catch (error) {
    console.error('Get faculty error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch faculty data',
      error: error.message
    });
  }
});

// @route   POST /api/admin/faculty
// @desc    Add new faculty
// @access  Private (Admin only)
router.post('/faculty', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      firstName: rawFirstName,
      lastName: rawLastName,
      name,
      email,
      phone,
      department,
      designation,
      qualification,
      experience,
      joiningDate,
      dateOfJoining,
      salary,
      address,
      emergencyContact,
      status
    } = req.body;

    // Derive first/last name from provided fields
    let firstName = rawFirstName;
    let lastName = rawLastName;
    if ((!firstName || !lastName) && name) {
      const parts = String(name).trim().split(/\s+/);
      firstName = firstName || parts[0] || '';
      lastName = lastName || parts.slice(1).join(' ') || '';
    }

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !department) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: firstName, lastName, email, phone, department'
      });
    }

    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate employee ID
    const lastFaculty = await Faculty.findOne().sort({ employeeId: -1 });
    let employeeId = 'FAC001';
    if (lastFaculty && lastFaculty.employeeId) {
      const lastNumber = parseInt(lastFaculty.employeeId.replace('FAC', ''));
      employeeId = `FAC${String(lastNumber + 1).padStart(3, '0')}`;
    }

    // Create user account
     const defaultPassword = 'faculty123'; // Should be changed on first login
     const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Normalize address into expected object shape
    const normalizedAddress = (address && typeof address === 'object')
      ? address
      : (address ? { street: String(address) } : {});

    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'faculty',
      phone,
      address: normalizedAddress,
      status: (status && typeof status === 'string') ? status.toLowerCase() : 'active'
    });

    await user.save();

    // Normalize enums to match Faculty model
    const allowedDepartments = [
      'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
      'Physics', 'Chemistry', 'Biology', 'Computer Science',
      'Physical Education', 'Arts', 'Music', 'Library',
      'Administration', 'Counseling'
    ];
    const allowedDesignations = [
      'Principal', 'Vice Principal', 'Head Teacher', 'Senior Teacher',
      'Teacher', 'Assistant Teacher', 'PGT', 'TGT', 'PRT',
      'Lab Assistant', 'Librarian', 'Sports Teacher', 'Music Teacher',
      'Art Teacher', 'Computer Teacher', 'Counselor'
    ];

    const normalizeEnum = (val, allowed) => {
      if (!val || typeof val !== 'string') return null;
      // Try case-insensitive match
      const found = allowed.find(a => a.toLowerCase() === val.toLowerCase());
      if (found) return found;
      // Map common aliases
      const aliasMap = {
        'computer_science': 'Computer Science',
        'cs': 'Computer Science',
        'pe': 'Physical Education',
        'admin': 'Administration',
        'counselling': 'Counseling',
        'assistant_professor': 'Assistant Teacher',
        'assistant teacher': 'Assistant Teacher',
        'teacher': 'Teacher'
      };
      const alias = aliasMap[val.toLowerCase()];
      if (alias && allowed.includes(alias)) return alias;
      return null;
    };

    const normalizedDepartment = normalizeEnum(department, allowedDepartments) || 'Computer Science';
    const normalizedDesignation = normalizeEnum(designation, allowedDesignations) || 'Assistant Teacher';

    // Defaults to satisfy schema-required fields for quick admin creation
    const defaultEmergency = {
      name: 'Primary Contact',
      relationship: 'Guardian',
      phone: (String(phone || '')).match(/^[0-9]{10}$/) ? String(phone) : '9999999999'
    };

    const defaultBank = {
      accountNumber: '123456789012',
      ifscCode: 'HDFC0ABCD12',
      bankName: 'HDFC Bank',
      branchName: 'Main'
    };

    const defaultWorkingHours = {
      startTime: '09:00',
      endTime: '17:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    };

    const defaultExperience = {
      totalYears: 0,
      previousSchools: []
    };

    const defaultSubjects = ['General'];
    const defaultClasses = [{ class: '10', section: 'A', subject: 'General', isClassTeacher: false }];

    // Create faculty profile with sane defaults
    const faculty = new Faculty({
      user: user._id,
      employeeId,
      department: normalizedDepartment,
      designation: normalizedDesignation,
      qualifications: Array.isArray(qualification) ? qualification : [],
      experience: (experience && typeof experience === 'object') ? experience : defaultExperience,
      joiningDate: joiningDate || dateOfJoining || new Date(),
      employmentType: 'permanent',
      salary: {
        basic: salary || 50000,
        allowances: {
          hra: (salary || 50000) * 0.2,
          da: (salary || 50000) * 0.1,
          ta: 0,
          medical: 0,
          other: 0
        },
        deductions: {
          pf: 0,
          esi: 0,
          tax: 0,
          other: 0
        }
      },
      emergencyContact: (emergencyContact && typeof emergencyContact === 'object') ? emergencyContact : defaultEmergency,
      bankDetails: defaultBank,
      workingHours: defaultWorkingHours,
      subjects: defaultSubjects,
      classes: defaultClasses,
      status: ((status && typeof status === 'string') ? status.toLowerCase() : 'active')
    });

    await faculty.save();

    // Populate user data for response
    await faculty.populate('user', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Faculty member added successfully',
      data: {
        id: faculty._id,
        employeeId: faculty.employeeId,
        name: `${faculty.user.firstName} ${faculty.user.lastName}`,
        email: faculty.user.email,
        phone: faculty.user.phone,
        department: faculty.department,
        designation: faculty.designation,
        status: faculty.status,
        joiningDate: faculty.joiningDate
      }
    });

  } catch (error) {
    console.error('Error adding faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add faculty member',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/faculty/:id
// @desc    Update faculty member
// @access  Private (Admin only)
router.put('/faculty/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName: rawFirstName,
      lastName: rawLastName,
      name,
      email,
      phone,
      department,
      designation,
      qualification,
      experience,
      salary,
      status,
      address,
      emergencyContact
    } = req.body;

    // Find faculty member
    const faculty = await Faculty.findById(id).populate('user');
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }

    // Update user information
    // Derive name updates
    let firstName = rawFirstName;
    let lastName = rawLastName;
    if ((!firstName || !lastName) && name) {
      const parts = String(name).trim().split(/\s+/);
      firstName = firstName || parts[0] || '';
      lastName = lastName || parts.slice(1).join(' ') || '';
    }
    if (firstName) faculty.user.firstName = firstName;
    if (lastName) faculty.user.lastName = lastName;
    if (email) faculty.user.email = email;
    if (phone) faculty.user.phone = phone;
    if (address) {
      const normalizedAddress = (typeof address === 'object') ? address : { street: String(address) };
      faculty.user.address = { ...faculty.user.address, ...normalizedAddress };
    }

    await faculty.user.save();

    // Update faculty information
    if (department) faculty.department = department;
    if (designation) faculty.designation = designation;
    // Only update qualifications if complete data is provided; otherwise skip
    if (experience !== undefined) faculty.experience = experience;
    if (salary) {
      faculty.salary.basic = salary;
      faculty.salary.allowances.hra = salary * 0.2;
      faculty.salary.allowances.da = salary * 0.1;
    }
    if (status) faculty.status = String(status).toLowerCase();
    if (emergencyContact) faculty.emergencyContact = { ...faculty.emergencyContact, ...emergencyContact };

    await faculty.save();

    res.json({
      success: true,
      message: 'Faculty member updated successfully',
      data: {
        id: faculty._id,
        employeeId: faculty.employeeId,
        name: `${faculty.user.firstName} ${faculty.user.lastName}`,
        email: faculty.user.email,
        phone: faculty.user.phone,
        department: faculty.department,
        designation: faculty.designation,
        status: faculty.status
      }
    });

  } catch (error) {
    console.error('Error updating faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update faculty member',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/faculty/:id
// @desc    Delete faculty member
// @access  Private (Admin only)
router.delete('/faculty/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Find faculty member
    const faculty = await Faculty.findById(id).populate('user');
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }

    // Instead of deleting, mark as inactive (soft delete)
    faculty.status = 'Inactive';
    await faculty.save();

    // Optionally, you can also deactivate the user account
    faculty.user.isActive = false;
    await faculty.user.save();

    res.json({
      success: true,
      message: 'Faculty member deactivated successfully'
    });

  } catch (error) {
    console.error('Error deleting faculty:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete faculty member',
      error: error.message
    });
  }
});

// @route   GET /api/admin/admissions
// @desc    Get admission applications
// @access  Private (Admin only)
router.get('/admissions', async (req, res) => {
  try {
    const { 
      status, 
      class: applyingClass, 
      academicYear,
      page = 1, 
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (applyingClass) {
      filter['academicInfo.applyingForClass'] = applyingClass;
    }
    
    if (academicYear) {
      filter['academicInfo.academicYear'] = academicYear;
    }
    
    if (search) {
      filter.$or = [
        { 'studentInfo.fullName': { $regex: search, $options: 'i' } },
        { applicationNumber: { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } },
        { 'contactInfo.phone': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [admissions, totalCount] = await Promise.all([
      Admission.find(filter)
        .select('applicationNumber studentInfo.fullName academicInfo.applyingForClass academicInfo.academicYear status priority contactInfo.email contactInfo.phone feeInfo.paymentStatus createdAt')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Admission.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    // Get status summary
    const statusSummary = await Admission.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      message: 'Admission applications retrieved successfully',
      data: {
        admissions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        },
        statusSummary: statusSummary.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        filters: {
          status,
          class: applyingClass,
          academicYear,
          search
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admission applications',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/admissions/:id/approve
// @desc    Approve admission application
// @access  Private (Admin only)
router.put('/admissions/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks, assignedClass, assignedSection } = req.body;
    const adminId = req.user.id;

    // Find the admission application
    const admission = await Admission.findById(id);
    
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission application not found'
      });
    }

    // Check if application can be approved
    if (admission.status === 'approved' || admission.status === 'admitted') {
      return res.status(400).json({
        success: false,
        message: 'Application is already approved/admitted'
      });
    }

    // Check if required documents are uploaded
    if (!admission.areRequiredDocumentsUploaded()) {
      return res.status(400).json({
        success: false,
        message: 'Required documents are not uploaded. Cannot approve application.'
      });
    }

    // Check payment status
    if (admission.feeInfo.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Admission fee payment is pending. Cannot approve application.'
      });
    }

    // Update admission status
    admission.status = 'approved';
    admission.processedBy = adminId;
    admission.processedDate = new Date();
    
    if (remarks) {
      admission.remarks = remarks;
    }

    // Update academic info if provided
    if (assignedClass) {
      admission.academicInfo.applyingForClass = assignedClass;
    }
    
    if (assignedSection) {
      admission.academicInfo.preferredSection = assignedSection;
    }

    // Add communication log
    admission.communications.push({
      type: 'email',
      subject: 'Admission Application Approved',
      message: `Your admission application ${admission.applicationNumber} has been approved. ${remarks || ''}`,
      sentBy: adminId,
      status: 'sent'
    });

    await admission.save();

    // Populate the processedBy field for response
    await admission.populate('processedBy', 'name email');

    res.json({
      success: true,
      message: 'Admission application approved successfully',
      data: {
        admission: {
          id: admission._id,
          applicationNumber: admission.applicationNumber,
          studentName: admission.studentInfo.fullName,
          status: admission.status,
          processedBy: admission.processedBy,
          processedDate: admission.processedDate,
          remarks: admission.remarks,
          assignedClass: admission.academicInfo.applyingForClass,
          assignedSection: admission.academicInfo.preferredSection
        }
      }
    });

  } catch (error) {
    console.error('Error approving admission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve admission application',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/admissions/:id/reject
// @desc    Reject admission application
// @access  Private (Admin only)
router.put('/admissions/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, remarks } = req.body;
    const adminId = req.user.id;

    // Validate required fields
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Find the admission application
    const admission = await Admission.findById(id);
    
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission application not found'
      });
    }

    // Check if application can be rejected
    if (admission.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Application is already rejected'
      });
    }

    if (admission.status === 'approved' || admission.status === 'admitted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject an approved/admitted application'
      });
    }

    // Update admission status
    admission.status = 'rejected';
    admission.processedBy = adminId;
    admission.processedDate = new Date();
    admission.remarks = `Rejected: ${reason}${remarks ? ` - ${remarks}` : ''}`;

    // Add communication log
    admission.communications.push({
      type: 'email',
      subject: 'Admission Application Rejected',
      message: `Your admission application ${admission.applicationNumber} has been rejected. Reason: ${reason}${remarks ? ` Additional remarks: ${remarks}` : ''}`,
      sentBy: adminId,
      status: 'sent'
    });

    // If payment was made, mark for refund
    if (admission.feeInfo.paymentStatus === 'paid') {
      admission.feeInfo.paymentStatus = 'refunded';
      admission.communications.push({
        type: 'email',
        subject: 'Admission Fee Refund Initiated',
        message: `Your admission fee for application ${admission.applicationNumber} will be refunded within 7-10 working days.`,
        sentBy: adminId,
        status: 'sent'
      });
    }

    await admission.save();

    // Populate the processedBy field for response
    await admission.populate('processedBy', 'name email');

    res.json({
      success: true,
      message: 'Admission application rejected successfully',
      data: {
        admission: {
          id: admission._id,
          applicationNumber: admission.applicationNumber,
          studentName: admission.studentInfo.fullName,
          status: admission.status,
          processedBy: admission.processedBy,
          processedDate: admission.processedDate,
          remarks: admission.remarks,
          refundStatus: admission.feeInfo.paymentStatus
        }
      }
    });

  } catch (error) {
    console.error('Error rejecting admission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject admission application',
      error: error.message
    });
  }
});

// @route   GET /api/admin/fees
// @desc    Get fee management data
// @access  Private (Admin only)
router.get('/fees', async (req, res) => {
  try {
    const { 
      type = 'overview', 
      class: className, 
      academicYear, 
      status,
      page = 1, 
      limit = 10,
      search 
    } = req.query;

    const currentYear = new Date().getFullYear();
    const defaultAcademicYear = `${currentYear}-${currentYear + 1}`;
    const yearFilter = academicYear || defaultAcademicYear;

    if (type === 'overview') {
      // Get overview data
      const [feeStructures, totalCollections, pendingDues, recentPayments] = await Promise.all([
        FeeStructure.find({ academicYear: yearFilter, isActive: true })
          .populate('createdBy', 'name')
          .sort({ class: 1 }),
        
        FeePayment.aggregate([
          { $match: { academicYear: yearFilter, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
        ]),
        
        FeeDue.aggregate([
          { $match: { academicYear: yearFilter, status: { $in: ['pending', 'partial', 'overdue'] } } },
          { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$remainingAmount' } } }
        ]),
        
        FeePayment.find({ academicYear: yearFilter, status: 'completed' })
          .populate('student', 'name class')
          .sort({ 'paymentDetails.paymentDate': -1 })
          .limit(10)
      ]);

      const summary = {
        totalCollection: totalCollections[0]?.total || 0,
        pendingDues: pendingDues.reduce((acc, due) => {
          acc[due._id] = { count: due.count, amount: due.amount };
          return acc;
        }, {}),
        totalPendingAmount: pendingDues.reduce((sum, due) => sum + due.amount, 0)
      };

      return res.json({
        success: true,
        data: {
          type: 'overview',
          academicYear: yearFilter,
          summary,
          feeStructures,
          recentPayments
        }
      });
    }

    if (type === 'payments') {
      // Get payment history
      const query = { academicYear: yearFilter };
      if (status) query.status = status;

      let searchQuery = {};
      if (search) {
        const students = await Student.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { studentId: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        
        searchQuery = {
          $or: [
            { student: { $in: students.map(s => s._id) } },
            { 'paymentDetails.receiptNumber': { $regex: search, $options: 'i' } },
            { 'paymentDetails.transactionId': { $regex: search, $options: 'i' } }
          ]
        };
      }

      const finalQuery = { ...query, ...searchQuery };
      
      const payments = await FeePayment.find(finalQuery)
        .populate('student', 'name class studentId')
        .populate('feeStructure', 'class')
        .populate('processedBy', 'name')
        .sort({ 'paymentDetails.paymentDate': -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const totalPayments = await FeePayment.countDocuments(finalQuery);

      return res.json({
        success: true,
        data: {
          type: 'payments',
          payments,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalPayments / parseInt(limit)),
            totalItems: totalPayments,
            hasNext: parseInt(page) < Math.ceil(totalPayments / parseInt(limit)),
            hasPrev: parseInt(page) > 1
          }
        }
      });
    }

    if (type === 'dues') {
      // Get pending dues
      const query = { academicYear: yearFilter };
      if (status) query.status = status;
      if (className) {
        const feeStructures = await FeeStructure.find({ class: className, academicYear: yearFilter });
        query.feeStructure = { $in: feeStructures.map(fs => fs._id) };
      }

      let searchQuery = {};
      if (search) {
        const students = await Student.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { studentId: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        
        searchQuery = { student: { $in: students.map(s => s._id) } };
      }

      const finalQuery = { ...query, ...searchQuery };
      
      const dues = await FeeDue.find(finalQuery)
        .populate('student', 'name class studentId')
        .populate('feeStructure', 'class')
        .sort({ dueDate: 1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const totalDues = await FeeDue.countDocuments(finalQuery);

      return res.json({
        success: true,
        data: {
          type: 'dues',
          dues,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalDues / parseInt(limit)),
            totalItems: totalDues,
            hasNext: parseInt(page) < Math.ceil(totalDues / parseInt(limit)),
            hasPrev: parseInt(page) > 1
          }
        }
      });
    }

    res.status(400).json({
      success: false,
      message: 'Invalid type parameter. Use: overview, payments, or dues'
    });

  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fee data',
      error: error.message
    });
  }
});

// @route   POST /api/admin/fees/structure
// @desc    Create or update fee structure
// @access  Private (Admin only)
router.post('/fees/structure', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      class: className,
      academicYear,
      feeComponents,
      paymentSchedule,
      dueDates
    } = req.body;

    // Validate required fields
    if (!className || !academicYear || !feeComponents) {
      return res.status(400).json({
        success: false,
        message: 'Class, academic year, and fee components are required'
      });
    }

    // Check if fee structure already exists
    const existingStructure = await FeeStructure.findOne({
      class: className,
      academicYear,
      isActive: true
    });

    if (existingStructure) {
      // Update existing structure
      existingStructure.feeComponents = feeComponents;
      existingStructure.paymentSchedule = paymentSchedule || existingStructure.paymentSchedule;
      existingStructure.dueDates = dueDates || existingStructure.dueDates;
      existingStructure.updatedBy = req.user.id;
      
      await existingStructure.save();

      return res.json({
        success: true,
        message: 'Fee structure updated successfully',
        data: { feeStructure: existingStructure }
      });
    }

    // Create new fee structure
    const feeStructure = new FeeStructure({
      class: className,
      academicYear,
      feeComponents,
      paymentSchedule: paymentSchedule || 'quarterly',
      dueDates: dueDates || [],
      createdBy: req.user.id
    });

    await feeStructure.save();

    res.status(201).json({
      success: true,
      message: 'Fee structure created successfully',
      data: { feeStructure }
    });

  } catch (error) {
  console.error('Create fee structure error:', error);
  res.status(500).json({
    success: false,
    message: 'Error creating fee structure',
    error: error.message
  });
}
});

// @route   POST /api/admin/grades
// @desc    Create a grade record
// @access  Private (Admin and Faculty)
router.post('/grades', authenticateToken, requireRole(['admin', 'faculty']), async (req, res) => {
  try {
    const {
      student,
      course,
      faculty,
      assessmentType,
      assessmentName,
      maxMarks,
      obtainedMarks,
      assessmentDate,
      academicYear,
      session,
      remarks,
      isPublished
    } = req.body || {};

    // Basic validation
    const missing = [];
    if (!student) missing.push('student');
    if (!course) missing.push('course');
    if (!faculty) missing.push('faculty');
    if (!assessmentType) missing.push('assessmentType');
    if (!assessmentName) missing.push('assessmentName');
    if (maxMarks === undefined) missing.push('maxMarks');
    if (obtainedMarks === undefined) missing.push('obtainedMarks');
    if (!assessmentDate) missing.push('assessmentDate');
    if (!session) missing.push('session');
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(', ')}` });
    }

    const doc = await Grade.create({
      student,
      course,
      faculty,
      assessmentType,
      assessmentName,
      maxMarks: Number(maxMarks),
      obtainedMarks: Number(obtainedMarks),
      assessmentDate: new Date(assessmentDate),
      academicYear: academicYear,
      session: String(session),
      remarks,
      isPublished: !!isPublished
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('Create grade error:', error);
    res.status(500).json({ success: false, message: 'Error creating grade', error: error.message });
  }
});

// @route   POST /api/admin/fees/payment
// @desc    Record fee payment
// @access  Private (Admin only)
router.post('/fees/payment', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      studentId,
      feeStructureId,
      paymentDetails,
      feeBreakdown,
      installmentNumber,
      remarks
    } = req.body;

    // Validate required fields
    if (!studentId || !feeStructureId || !paymentDetails || !installmentNumber) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, fee structure ID, payment details, and installment number are required'
      });
    }

    // Verify student and fee structure exist
    const [student, feeStructure] = await Promise.all([
      Student.findById(studentId),
      FeeStructure.findById(feeStructureId)
    ]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found'
      });
    }

    // Create payment record
    const payment = new FeePayment({
      student: studentId,
      feeStructure: feeStructureId,
      paymentDetails: {
        ...paymentDetails,
        paymentDate: paymentDetails.paymentDate || new Date()
      },
      feeBreakdown: feeBreakdown || {},
      academicYear: feeStructure.academicYear,
      installmentNumber,
      remarks,
      processedBy: req.user.id
    });

    await payment.save();

    // Update or create fee due record
    const feeDue = await FeeDue.findOne({
      student: studentId,
      feeStructure: feeStructureId,
      installmentNumber,
      academicYear: feeStructure.academicYear
    });

    if (feeDue) {
      feeDue.paidAmount += paymentDetails.amount;
      await feeDue.save();
    }

    // Populate the payment for response
    await payment.populate([
      { path: 'student', select: 'name class studentId' },
      { path: 'feeStructure', select: 'class academicYear' },
      { path: 'processedBy', select: 'name' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: { payment }
    });

  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording payment',
      error: error.message
    });
  }
});

// @route   GET /api/admin/fees/student/:studentId
// @desc    Get fee details for a specific student
// @access  Private (Admin only)
router.get('/fees/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.query;

    const currentYear = new Date().getFullYear();
    const yearFilter = academicYear || `${currentYear}-${currentYear + 1}`;

    // Get student details
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get fee structure for student's class
    const feeStructure = await FeeStructure.findOne({
      class: student.class,
      academicYear: yearFilter,
      isActive: true
    });

    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: 'Fee structure not found for this class and academic year'
      });
    }

    // Get payment history and pending dues
    const [payments, dues] = await Promise.all([
      FeePayment.find({ student: studentId, academicYear: yearFilter })
        .populate('feeStructure', 'class')
        .populate('processedBy', 'name')
        .sort({ 'paymentDetails.paymentDate': -1 }),
      
      FeeDue.find({ student: studentId, academicYear: yearFilter })
        .populate('feeStructure', 'class')
        .sort({ dueDate: 1 })
    ]);

    const totalPaid = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.paymentDetails.amount, 0);

    const totalDue = dues
      .filter(d => d.status !== 'paid')
      .reduce((sum, d) => sum + d.remainingAmount, 0);

    res.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          class: student.class,
          studentId: student.studentId
        },
        feeStructure,
        payments,
        dues,
        summary: {
          totalPaid,
          totalDue,
          totalFeeAmount: feeStructure.totalAmount
        }
      }
    });

  } catch (error) {
    console.error('Get student fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student fee details',
      error: error.message
    });
  }
});

// @route   GET /api/admin/reports
// @desc    Generate various reports
// @access  Private (Admin only)
router.get('/reports', (req, res) => {
  res.json({
    success: true,
    message: 'Reports endpoint - To be implemented',
    data: {
      endpoint: 'GET /api/admin/reports',
      query_params: ['type', 'class', 'date_from', 'date_to'],
      report_types: ['academic', 'financial', 'attendance', 'enrollment']
    }
  });
});

module.exports = router;