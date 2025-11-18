const mongoose = require('mongoose');

const onlineClassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  className: {
    type: String,
    required: true,
    enum: ['NS', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 300
  },
  platform: {
    type: String,
    required: true,
    enum: ['zoom', 'meet', 'teams']
  },
  meetingLink: {
    type: String,
    required: false,
    default: '#'
  },
  meetingId: {
    type: String,
    trim: true
  },
  accessCode: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed'],
    default: 'scheduled'
  },
  description: {
    type: String,
    trim: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
onlineClassSchema.index({ className: 1, date: 1, status: 1 });
onlineClassSchema.index({ faculty: 1, date: 1 });
onlineClassSchema.index({ date: 1, time: 1 });

// Method to generate meeting links based on platform
onlineClassSchema.methods.generateMeetingLink = function() {
  const platform = this.platform;
  
  switch (platform) {
    case 'zoom':
      this.meetingLink = `https://zoom.us/j/${Math.floor(Math.random() * 1000000000)}`;
      this.meetingId = Math.floor(Math.random() * 1000000000).toString();
      this.accessCode = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      break;
    case 'meet':
      this.meetingLink = `https://meet.google.com/${Math.random().toString(36).substr(2, 9)}`;
      break;
    case 'teams':
      this.meetingLink = `https://teams.microsoft.com/l/meetup-join/19:${Math.random().toString(36).substr(2, 16)}`;
      break;
    default:
      this.meetingLink = '#';
  }
};

// Pre-save middleware to generate meeting link and update timestamp
onlineClassSchema.pre('save', function(next) {
  if (!this.meetingLink || this.meetingLink === '#') {
    this.generateMeetingLink();
  }
  this.updatedAt = Date.now();
  next();
});

// Method to get students by class
onlineClassSchema.statics.getByClass = function(className, options = {}) {
  const query = { className, ...options };
  return this.find(query)
    .populate('faculty', 'employeeId department designation')
    .populate('students', 'studentId rollNumber')
    .sort({ date: 1, time: 1 });
};

// Method to get classes by faculty
onlineClassSchema.statics.getByFaculty = function(facultyId, options = {}) {
  const query = { faculty: facultyId, ...options };
  return this.find(query)
    .populate('students', 'studentId rollNumber user')
    .sort({ date: -1, time: -1 });
};

// Method to update status
onlineClassSchema.statics.updateStatus = function(id, status) {
  return this.findByIdAndUpdate(
    id,
    { status, updatedAt: Date.now() },
    { new: true }
  );
};

// Method to get upcoming classes
onlineClassSchema.statics.getUpcoming = function(limit = 10) {
  const now = new Date();
  return this.find({
    $or: [
      { date: { $gt: now } },
      { date: now, time: { $gte: now.toTimeString().slice(0, 5) } }
    ],
    status: 'scheduled'
  })
    .populate('faculty', 'employeeId department designation')
    .populate('students', 'studentId rollNumber user')
    .sort({ date: 1, time: 1 })
    .limit(limit);
};

// Method to get classes for a specific date range
onlineClassSchema.statics.getByDateRange = function(startDate, endDate, options = {}) {
  const query = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    ...options
  };
  return this.find(query)
    .populate('faculty', 'employeeId department designation')
    .populate('students', 'studentId rollNumber user')
    .sort({ date: 1, time: 1 });
};

module.exports = mongoose.model('OnlineClass', onlineClassSchema);