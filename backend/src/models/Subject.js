const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Subject code cannot exceed 20 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [10, 'Credits cannot exceed 10'],
    default: 1
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department name cannot exceed 100 characters']
  },
  session: {
    type: Number,
    min: [1, 'Session must be at least 1'],
    max: [8, 'Session cannot exceed 8']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  syllabus: {
    type: String,
    trim: true
  },
  objectives: [{
    type: String,
    trim: true
  }],
  // Academic year and term
  academicYear: {
    type: String,
    trim: true
  },
  term: {
    type: String,
    enum: ['Fall', 'Spring', 'Summer'],
    trim: true
  },
  // Faculty assignment
  assignedFaculty: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  }],
  // Course association
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  // Schedule information
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    startTime: String,
    endTime: String,
    room: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
// Removed explicit code index to avoid duplication with unique: true on field
subjectSchema.index({ department: 1 });
subjectSchema.index({ session: 1 });
subjectSchema.index({ isActive: 1 });
subjectSchema.index({ academicYear: 1, term: 1 });

// Virtual for full name
subjectSchema.virtual('fullName').get(function() {
  return `${this.code} - ${this.name}`;
});

// Pre-save middleware
subjectSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Static methods
subjectSchema.statics.findByDepartment = function(department) {
  return this.find({ department, isActive: true });
};

subjectSchema.statics.findBySession = function(session) {
  return this.find({ session, isActive: true });
};

subjectSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true });
};

// Instance methods
subjectSchema.methods.addPrerequisite = function(subjectId) {
  if (!this.prerequisites.includes(subjectId)) {
    this.prerequisites.push(subjectId);
  }
  return this.save();
};

subjectSchema.methods.removePrerequisite = function(subjectId) {
  this.prerequisites = this.prerequisites.filter(
    prereq => !prereq.equals(subjectId)
  );
  return this.save();
};

subjectSchema.methods.assignFaculty = function(facultyId) {
  if (!this.assignedFaculty.includes(facultyId)) {
    this.assignedFaculty.push(facultyId);
  }
  return this.save();
};

subjectSchema.methods.removeFaculty = function(facultyId) {
  this.assignedFaculty = this.assignedFaculty.filter(
    faculty => !faculty.equals(facultyId)
  );
  return this.save();
};

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;