const mongoose = require('mongoose');

const FacultyAssignmentSchema = new mongoose.Schema(
  {
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    courseId: { type: String, required: true },   // aligns with Subject id used in UI
    classId: { type: String, required: true },    // aligns with class id used in UI
    session: { type: String, enum: ['1', '2'], required: true },
    academicYear: { type: String, required: true }, // "YYYY-YYYY"
    assignmentType: { type: String, enum: ['primary', 'secondary', 'substitute'], default: 'primary' },
    startDate: { type: Date },
    endDate: { type: Date },
    workload: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    completed: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FacultyAssignment', FacultyAssignmentSchema);