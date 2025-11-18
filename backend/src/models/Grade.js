const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  assessmentType: {
    type: String,
    enum: ['Quiz', 'Assignment', 'Midterm', 'Final', 'Project', 'Presentation', 'Lab', 'Homework'],
    required: true
  },
  assessmentName: {
    type: String,
    required: true,
    trim: true
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 1
  },
  obtainedMarks: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value) {
        return value <= this.maxMarks;
      },
      message: 'Obtained marks cannot exceed maximum marks'
    }
  },
  percentage: {
    type: Number,
    default: function() {
      return (this.obtainedMarks / this.maxMarks) * 100;
    }
  },
  letterGrade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'],
    default: function() {
      const percentage = (this.obtainedMarks / this.maxMarks) * 100;
      if (percentage >= 95) return 'A+';
      if (percentage >= 90) return 'A';
      if (percentage >= 80) return 'B+';
      if (percentage >= 70) return 'B+';
      if (percentage >= 60) return 'B';
      if (percentage >= 50) return 'C';
      if (percentage >= 33) return 'D';
      return 'F';
    }
  },
  gradePoints: {
    type: Number,
    default: function() {
      const percentage = (this.obtainedMarks / this.maxMarks) * 100;
      if (percentage >= 95) return 4.0;
      if (percentage >= 90) return 3.7;
      if (percentage >= 85) return 3.3;
      if (percentage >= 80) return 3.0;
      if (percentage >= 75) return 2.7;
      if (percentage >= 70) return 2.3;
      if (percentage >= 60) return 2.0;
      return 0.0;
    }
  },
  assessmentDate: {
    type: Date,
    required: true
  },
  submissionDate: {
    type: Date,
    default: Date.now
  },
  remarks: {
    type: String,
    trim: true
  },
  academicYear: {
    type: String,
    required: true,
    default: () => {
      const year = new Date().getFullYear();
      return `${year}-${year + 1}`;
    }
  },
  session: {
    type: String,
    enum: ['1', '2'],
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
gradeSchema.index({ student: 1, course: 1, academicYear: 1, session: 1 });
gradeSchema.index({ course: 1, assessmentType: 1 });
gradeSchema.index({ faculty: 1, assessmentDate: 1 });

// Static method to calculate GPA
gradeSchema.statics.calculateGPA = async function(studentId, academicYear, session) {
  const grades = await this.find({
    student: studentId,
    academicYear,
    session,
    isPublished: true
  }).populate('course');
  
  if (grades.length === 0) return 0;
  
  let totalGradePoints = 0;
  let totalCredits = 0;
  
  grades.forEach(grade => {
    totalGradePoints += grade.gradePoints * grade.course.credits;
    totalCredits += grade.course.credits;
  });
  
  return totalCredits > 0 ? totalGradePoints / totalCredits : 0;
};

module.exports = mongoose.model('Grade', gradeSchema);