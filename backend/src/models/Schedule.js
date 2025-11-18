const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema(
  {
    className: { type: String, required: true },
    subject: { type: String, required: true },
    teacher: { type: String, required: true }, // teacher display name
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' }, // optional link to Faculty
    room: { type: String, default: '' },
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },   // HH:mm
    duration: { type: Number, default: 0 },      // minutes
    type: { type: String, enum: ['regular', 'exam', 'event'], default: 'regular' },
    description: { type: String, default: '' },
    recurring: { type: Boolean, default: true },
    academicYear: { type: String }, // e.g. "2024-2025"
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Schedule', ScheduleSchema);