const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const mongoose = require('mongoose');
const { Student } = require('../models');
const { Route, Vehicle, TransportAllocation } = require('../models/Transport');

// Helpers
const toTitle = (str) => (str || '').charAt(0).toUpperCase() + (str || '').slice(1).toLowerCase();
const now = () => new Date();

// -----------------
// Routes CRUD
// -----------------

// List routes
router.get('/routes', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const routes = await Route.find({}).sort({ routeName: 1 });
    res.json({ success: true, data: routes });
  } catch (error) {
    console.error('Transport GET /routes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch routes' });
  }
});

// Create route
router.post('/routes', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      routeName,
      startLocation,
      endLocation,
      stops = [], // array of strings from UI
      distance,
      estimatedTime,
      fare
    } = req.body || {};

    if (!routeName || !startLocation || !endLocation || distance === undefined || estimatedTime === undefined) {
      return res.status(400).json({ success: false, message: 'Missing required route fields' });
    }

    const routeNumber = `R-${Date.now()}`;
    const mappedStops = Array.isArray(stops)
      ? stops.filter(Boolean).map((s) => ({
          stopName: String(s),
          stopTime: '07:30',
          coordinates: {},
          pickupFee: Number(fare || 0)
        }))
      : [];

    const doc = await Route.create({
      routeNumber,
      routeName,
      startLocation,
      endLocation,
      stops: mappedStops,
      totalDistance: Number(distance),
      estimatedDuration: Number(estimatedTime),
      baseFare: Number(fare || 0),
      isActive: true
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('Transport POST /routes error:', error);
    res.status(500).json({ success: false, message: 'Failed to create route' });
  }
});

// Update route
router.put('/routes/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      routeName,
      startLocation,
      endLocation,
      stops = [],
      distance,
      estimatedTime,
      fare,
      isActive
    } = req.body || {};

    const mappedStops = Array.isArray(stops)
      ? stops.filter(Boolean).map((s) => ({
          stopName: String(s),
          stopTime: '07:30',
          coordinates: {},
          pickupFee: Number(fare || 0)
        }))
      : undefined;

    const doc = await Route.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Route not found' });

    if (routeName !== undefined) doc.routeName = routeName;
    if (startLocation !== undefined) doc.startLocation = startLocation;
    if (endLocation !== undefined) doc.endLocation = endLocation;
    if (distance !== undefined) doc.totalDistance = Number(distance);
    if (estimatedTime !== undefined) doc.estimatedDuration = Number(estimatedTime);
    if (isActive !== undefined) doc.isActive = !!isActive;

    if (mappedStops !== undefined) {
      doc.stops = mappedStops;
    } else if (fare !== undefined && Array.isArray(doc.stops)) {
      const newFee = Number(fare || 0);
      doc.stops = doc.stops.map(s => ({
        stopName: s.stopName,
        stopTime: s.stopTime,
        coordinates: s.coordinates || {},
        pickupFee: newFee
      }));
    }

    if (fare !== undefined) {
      doc.baseFare = Number(fare || 0);
    }

    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Transport PUT /routes/:id error:', error);
    res.status(500).json({ success: false, message: 'Failed to update route' });
  }
});

// Delete route
router.delete('/routes/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Route.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, message: 'Route deleted' });
  } catch (error) {
    console.error('Transport DELETE /routes/:id error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete route' });
  }
});

// -----------------
// Vehicles CRUD
// -----------------

router.get('/vehicles', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}).populate('route').sort({ vehicleNumber: 1 });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Transport GET /vehicles error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vehicles' });
  }
});

router.post('/vehicles', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      vehicleNumber,
      vehicleType,
      capacity,
      driverName,
      driverPhone,
      routeId
    } = req.body || {};

    if (!vehicleNumber || !vehicleType || capacity === undefined || !driverName || !driverPhone || !routeId) {
      return res.status(400).json({ success: false, message: 'Missing required vehicle fields' });
    }

    const doc = await Vehicle.create({
      vehicleNumber: String(vehicleNumber).toUpperCase(),
      vehicleType: toTitle(vehicleType),
      capacity: Number(capacity),
      driver: {
        name: driverName,
        phone: driverPhone,
        licenseNumber: `TEMP-${String(vehicleNumber).toUpperCase()}`
      },
      route: routeId,
      isActive: true
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('Transport POST /vehicles error:', error);
    res.status(500).json({ success: false, message: 'Failed to create vehicle' });
  }
});

router.put('/vehicles/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      vehicleNumber,
      vehicleType,
      capacity,
      driverName,
      driverPhone,
      routeId,
      isActive
    } = req.body || {};

    const update = {
      ...(vehicleNumber !== undefined && { vehicleNumber: String(vehicleNumber).toUpperCase() }),
      ...(vehicleType !== undefined && { vehicleType: toTitle(vehicleType) }),
      ...(capacity !== undefined && { capacity: Number(capacity) }),
      ...(driverName !== undefined && { driver: { ...(driverPhone !== undefined ? { phone: driverPhone } : {}), name: driverName } }),
      ...(driverPhone !== undefined && { driver: { ...(driverName !== undefined ? { name: driverName } : {}), phone: driverPhone } }),
      ...(routeId !== undefined && { route: routeId }),
      ...(isActive !== undefined && { isActive: !!isActive })
    };

    const doc = await Vehicle.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Transport PUT /vehicles/:id error:', error);
    res.status(500).json({ success: false, message: 'Failed to update vehicle' });
  }
});

router.delete('/vehicles/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Vehicle.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    res.json({ success: true, message: 'Vehicle deleted' });
  } catch (error) {
    console.error('Transport DELETE /vehicles/:id error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete vehicle' });
  }
});

// -----------------
// Allocations CRUD
// -----------------

router.get('/allocations', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const allocations = await TransportAllocation.find({})
      .populate('student')
      .populate('route')
      .populate('vehicle')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: allocations });
  } catch (error) {
    console.error('Transport GET /allocations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch allocations' });
  }
});

router.post('/allocations', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { studentId, routeId, vehicleId, pickupStop, dropStop, fare } = req.body || {};
    if (!studentId || !routeId || !vehicleId || !pickupStop || !dropStop) {
      return res.status(400).json({ success: false, message: 'Missing required allocation fields' });
    }

    const startDate = now();
    const endDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    let resolvedStudent = studentId;
    if (!mongoose.isValidObjectId(resolvedStudent)) {
      const sDoc = await Student.findOne({ studentId: String(studentId).toUpperCase() }).select('_id');
      if (!sDoc) {
        return res.status(400).json({ success: false, message: 'Invalid student identifier' });
      }
      resolvedStudent = sDoc._id;
    }

    const doc = await TransportAllocation.create({
      student: resolvedStudent,
      route: routeId,
      vehicle: vehicleId,
      pickupStop,
      dropStop,
      monthlyFee: Number(fare || 0),
      startDate,
      endDate,
      isActive: true
    });

    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    console.error('Transport POST /allocations error:', error);
    res.status(500).json({ success: false, message: 'Failed to create allocation' });
  }
});

router.put('/allocations/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, routeId, vehicleId, pickupStop, dropStop, fare, isActive } = req.body || {};

    let studentUpdate;
    if (studentId !== undefined) {
      if (mongoose.isValidObjectId(studentId)) {
        studentUpdate = studentId;
      } else {
        const sDoc = await Student.findOne({ studentId: String(studentId).toUpperCase() }).select('_id');
        if (!sDoc) {
          return res.status(400).json({ success: false, message: 'Invalid student identifier' });
        }
        studentUpdate = sDoc._id;
      }
    }

    const update = {
      ...(studentUpdate !== undefined && { student: studentUpdate }),
      ...(routeId !== undefined && { route: routeId }),
      ...(vehicleId !== undefined && { vehicle: vehicleId }),
      ...(pickupStop !== undefined && { pickupStop }),
      ...(dropStop !== undefined && { dropStop }),
      ...(fare !== undefined && { monthlyFee: Number(fare) }),
      ...(isActive !== undefined && { isActive: !!isActive })
    };

    const doc = await TransportAllocation.findByIdAndUpdate(id, update, { new: true });
    if (!doc) return res.status(404).json({ success: false, message: 'Allocation not found' });
    res.json({ success: true, data: doc });
  } catch (error) {
    console.error('Transport PUT /allocations/:id error:', error);
    res.status(500).json({ success: false, message: 'Failed to update allocation' });
  }
});

router.delete('/allocations/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await TransportAllocation.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ success: false, message: 'Allocation not found' });
    res.json({ success: true, message: 'Allocation deleted' });
  } catch (error) {
    console.error('Transport DELETE /allocations/:id error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete allocation' });
  }
});

module.exports = router;