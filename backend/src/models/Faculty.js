const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  // Reference to User model
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    unique: true
  },
  
  // Faculty Identification
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // Professional Information
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    enum: [
      'Principal', 'Vice Principal', 'Head Teacher', 'Senior Teacher', 
      'Teacher', 'Assistant Teacher', 'PGT', 'TGT', 'PRT', 
      'Lab Assistant', 'Librarian', 'Sports Teacher', 'Music Teacher',
      'Art Teacher', 'Computer Teacher', 'Counselor'
    ]
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: [
      'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
      'Physics', 'Chemistry', 'Biology', 'Computer Science',
      'Physical Education', 'Arts', 'Music', 'Library',
      'Administration', 'Counseling'
    ]
  },
  
  // Academic Qualifications
  qualifications: [{
    degree: { 
      type: String, 
      required: true,
      trim: true 
    },
    subject: { 
      type: String, 
      trim: true 
    },
    institution: { 
      type: String, 
      required: true,
      trim: true 
    },
    year: { 
      type: Number, 
      required: true,
      min: 1950,
      max: new Date().getFullYear()
    },
    percentage: { 
      type: Number, 
      min: 0, 
      max: 100 
    }
  }],
  
  // Teaching Experience
  experience: {
    totalYears: { 
      type: Number, 
      required: true,
      min: 0 
    },
    previousSchools: [{
      schoolName: { type: String, trim: true },
      designation: { type: String, trim: true },
      fromDate: { type: Date },
      toDate: { type: Date },
      subjects: [{ type: String, trim: true }]
    }]
  },
  
  // Current Assignment
  subjects: [{
    type: String,
    required: true,
    trim: true
  }],
  classes: [{
    class: { 
      type: String, 
      required: true,
      enum: ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    section: { 
      type: String, 
      required: true,
      trim: true,
      uppercase: true 
    },
    subject: { 
      type: String, 
      required: true,
      trim: true 
    },
    isClassTeacher: { 
      type: Boolean, 
      default: false 
    }
  }],
  
  // Employment Details
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required']
  },
  employmentType: {
    type: String,
    required: [true, 'Employment type is required'],
    enum: ['permanent', 'temporary', 'contract', 'guest']
  },
  salary: {
    basic: { type: Number, required: true, min: 0 },
    allowances: {
      hra: { type: Number, default: 0 },
      da: { type: Number, default: 0 },
      ta: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    deductions: {
      pf: { type: Number, default: 0 },
      esi: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },
  
  // Schedule and Availability
  workingHours: {
    startTime: { 
      type: String, 
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time in HH:MM format']
    },
    endTime: { 
      type: String, 
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time in HH:MM format']
    },
    workingDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }]
  },
  
  // Performance and Evaluation
  performanceRatings: [{
    academicYear: { 
      type: String, 
      required: true,
      match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
    },
    rating: { 
      type: Number, 
      required: true,
      min: 1, 
      max: 5 
    },
    comments: { type: String, trim: true },
    evaluatedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    evaluationDate: { type: Date, required: true }
  }],
  
  // Professional Development
  trainings: [{
    title: { type: String, required: true, trim: true },
    organizer: { type: String, required: true, trim: true },
    duration: { type: Number, required: true }, // in hours
    completionDate: { type: Date, required: true },
    certificateNumber: { type: String, trim: true }
  }],
  
  // Leave Management
  leaveBalance: {
    casual: { type: Number, default: 12 },
    sick: { type: Number, default: 12 },
    earned: { type: Number, default: 20 },
    maternity: { type: Number, default: 180 },
    paternity: { type: Number, default: 15 }
  },
  
  // Contact and Emergency Information
  emergencyContact: {
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    phone: { 
      type: String, 
      required: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    }
  },
  
  // Bank Details
  bankDetails: {
    accountNumber: { 
      type: String, 
      required: true,
      trim: true 
    },
    ifscCode: { 
      type: String, 
      required: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Please enter a valid IFSC code']
    },
    bankName: { 
      type: String, 
      required: true,
      trim: true 
    },
    branchName: { 
      type: String, 
      required: true,
      trim: true 
    }
  },
  
  // Documents
  documents: {
    resume: { type: String }, // File path
    certificates: [{ type: String }], // File paths
    experienceCertificates: [{ type: String }], // File paths
    photograph: { type: String }, // File path
    aadharCard: { type: String }, // File path
    panCard: { type: String }, // File path
    bankPassbook: { type: String } // File path
  },
  
  // Status and Flags
  status: {
    type: String,
    enum: ['active', 'inactive', 'on_leave', 'terminated', 'retired'],
    default: 'active'
  },
  isHOD: {
    type: Boolean,
    default: false
  },
  
  // Additional Information
  specializations: [{ type: String, trim: true }],
  achievements: [{
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    date: { type: Date },
    category: { 
      type: String, 
      enum: ['teaching', 'research', 'publication', 'award', 'other'] 
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total salary
facultySchema.virtual('totalSalary').get(function() {
  const salary = this.salary;
  const totalAllowances = salary.allowances.hra + salary.allowances.da + 
                         salary.allowances.ta + salary.allowances.medical + 
                         salary.allowances.other;
  const totalDeductions = salary.deductions.pf + salary.deductions.esi + 
                         salary.deductions.tax + salary.deductions.other;
  return salary.basic + totalAllowances - totalDeductions;
});

// Virtual for years of service
facultySchema.virtual('yearsOfService').get(function() {
  if (!this.joiningDate) return 0;
  const today = new Date();
  const joining = new Date(this.joiningDate);
  return Math.floor((today - joining) / (365.25 * 24 * 60 * 60 * 1000));
});

// Virtual for total leave balance
facultySchema.virtual('totalLeaveBalance').get(function() {
  const leave = this.leaveBalance;
  return leave.casual + leave.sick + leave.earned;
});

// Indexes for better query performance
facultySchema.index({ employeeId: 1 });
facultySchema.index({ department: 1 });
facultySchema.index({ designation: 1 });
facultySchema.index({ status: 1 });
facultySchema.index({ 'classes.class': 1, 'classes.section': 1 });
facultySchema.index({ subjects: 1 });

// Pre-save middleware to generate employee ID
facultySchema.pre('save', async function(next) {
  if (this.isNew && !this.employeeId) {
    try {
      const year = new Date().getFullYear().toString().slice(-2);
      const count = await this.constructor.countDocuments();
      this.employeeId = `EMP${year}${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Static method to find faculty by department
facultySchema.statics.findByDepartment = function(department) {
  return this.find({ 
    department: department, 
    status: 'active' 
  }).populate('user', 'firstName lastName email phone');
};

// Static method to find class teachers
facultySchema.statics.findClassTeachers = function() {
  return this.find({ 
    'classes.isClassTeacher': true, 
    status: 'active' 
  }).populate('user', 'firstName lastName email phone');
};

// Static method to find faculty by subject
facultySchema.statics.findBySubject = function(subject) {
  return this.find({ 
    subjects: subject, 
    status: 'active' 
  }).populate('user', 'firstName lastName email phone');
};

// Instance method to get teaching load
facultySchema.methods.getTeachingLoad = function() {
  return {
    totalClasses: this.classes.length,
    subjects: this.subjects,
    classTeacherOf: this.classes.filter(c => c.isClassTeacher)
  };
};

// Instance method to calculate leave taken
facultySchema.methods.calculateLeaveTaken = async function(year) {
  void year;
  // This would typically involve querying leave records
  // For now, return a placeholder
  return {
    casual: 0,
    sick: 0,
    earned: 0,
    total: 0
  };
};

module.exports = mongoose.model('Faculty', facultySchema);