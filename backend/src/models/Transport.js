const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  routeName: {
    type: String,
    required: true,
    trim: true
  },
  startLocation: {
    type: String,
    required: true,
    trim: true
  },
  endLocation: {
    type: String,
    required: true,
    trim: true
  },
  stops: [{
    stopName: {
      type: String,
      required: true,
      trim: true
    },
    stopTime: {
      type: String,
      required: true // "07:30"
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    pickupFee: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalDistance: {
    type: Number, // in kilometers
    required: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true
  },
  baseFare: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  vehicleType: {
    type: String,
    enum: ['Bus', 'Van', 'Car'],
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  driver: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true
    },
    experience: Number // in years
  },
  conductor: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  schedule: {
    morningPickup: {
      startTime: String, // "06:30"
      endTime: String    // "08:30"
    },
    eveningDrop: {
      startTime: String, // "14:00"
      endTime: String    // "16:00"
    }
  },
  maintenance: {
    lastService: Date,
    nextService: Date,
    insuranceExpiry: Date,
    fitnessExpiry: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const transportAllocationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  pickupStop: {
    type: String,
    required: true
  },
  dropStop: {
    type: String,
    required: true
  },
  monthlyFee: {
    type: Number,
    required: true,
    min: 0
  },
  academicYear: {
    type: String,
    required: true,
    default: () => {
      const year = new Date().getFullYear();
      return `${year}-${year + 1}`;
    }
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  }
}, {
  timestamps: true
});

// Indexes
// Removed explicit routeNumber index to avoid duplication with unique: true on field
routeSchema.index({ isActive: 1 });

// Removed explicit vehicleNumber index to avoid duplication with unique: true on field
vehicleSchema.index({ route: 1 });
vehicleSchema.index({ isActive: 1 });

transportAllocationSchema.index({ student: 1, academicYear: 1 });
transportAllocationSchema.index({ route: 1, vehicle: 1 });
transportAllocationSchema.index({ isActive: 1 });

const Route = mongoose.model('Route', routeSchema);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);
const TransportAllocation = mongoose.model('TransportAllocation', transportAllocationSchema);

module.exports = {
  Route,
  Vehicle,
  TransportAllocation
};