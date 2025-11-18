import React, { useState, useEffect } from 'react';
import config from '../../config/config.js';
import api from '../../services/api';
import { 
  FaBus, 
  FaRoute, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaUsers,
  FaMapMarkerAlt,
  FaClock,
  FaSearch,
  FaFilter
} from 'react-icons/fa';

export default function TransportManagement() {
  // E2E toggle: switch between real and E2E endpoints
  const E2E = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_E2E_MODE === 'true');
  const TRANSPORT_BASE = E2E ? '/e2e/transport' : '/transport';
  const [activeTab, setActiveTab] = useState('routes');
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [newRoute, setNewRoute] = useState({
    routeName: '',
    startLocation: '',
    endLocation: '',
    stops: [''],
    distance: '',
    estimatedTime: '',
    fare: ''
  });

  const [newVehicle, setNewVehicle] = useState({
    vehicleNumber: '',
    vehicleType: 'bus',
    capacity: '',
    driverName: '',
    driverPhone: '',
    routeId: ''
  });

  const [newAllocation, setNewAllocation] = useState({
    studentId: '',
    routeId: '',
    vehicleId: '',
    pickupStop: '',
    dropStop: '',
    fare: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [routesRes, vehiclesRes, allocationsRes] = await Promise.all([
        api.get(`${TRANSPORT_BASE}/routes`),
        api.get(`${TRANSPORT_BASE}/vehicles`),
        api.get(`${TRANSPORT_BASE}/allocations`)
      ]);

      const routesData = routesRes.data;
      if (routesData.success) setRoutes(routesData.data);

      const vehiclesData = vehiclesRes.data;
      if (vehiclesData.success) setVehicles(vehiclesData.data);

      const allocationsData = allocationsRes.data;
      if (allocationsData.success) setAllocations(allocationsData.data);

      setError('');
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.userMessage || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'routes') {
        const response = await api.get(`${TRANSPORT_BASE}/routes`);
        const data = response.data;
        if (data.success) setRoutes(data.data);
      } else if (activeTab === 'vehicles') {
        const response = await api.get(`${TRANSPORT_BASE}/vehicles`);
        const data = response.data;
        if (data.success) setVehicles(data.data);
      } else if (activeTab === 'allocations') {
        const response = await api.get(`${TRANSPORT_BASE}/allocations`);
        const data = response.data;
        if (data.success) setAllocations(data.data);
      }
      setError('');
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.userMessage || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  async function handleSave(e) {
    e.preventDefault();
    try {
      const response =
        activeTab === 'routes'
          ? (editingItem
              ? await api.put(`${TRANSPORT_BASE}/routes/${editingItem._id}`, newRoute)
              : await api.post(`${TRANSPORT_BASE}/routes`, newRoute))
          : activeTab === 'vehicles'
          ? (editingItem
              ? await api.put(`${TRANSPORT_BASE}/vehicles/${editingItem._id}`, newVehicle)
              : await api.post(`${TRANSPORT_BASE}/vehicles`, newVehicle))
          : (editingItem
              ? await api.put(`${TRANSPORT_BASE}/allocations/${editingItem._id}`, newAllocation)
              : await api.post(`${TRANSPORT_BASE}/allocations`, newAllocation));

      const data = response.data;
      if (data.success) {
        fetchData();
        resetForm();
        setShowModal(false);
        setEditingItem(null);
        setError('');
      } else {
        setError(data.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving:', error);
      setError(error.userMessage || 'Failed to save');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const currentTab = activeTab;
      const response =
        currentTab === 'routes'
          ? await api.delete(`${TRANSPORT_BASE}/routes/${id}`)
          : currentTab === 'vehicles'
          ? await api.delete(`${TRANSPORT_BASE}/vehicles/${id}`)
          : await api.delete(`${TRANSPORT_BASE}/allocations/${id}`);

      const data = response.data;
      if (data.success) {
        fetchData();
        setError('');
      } else {
        setError(data.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      setError(error.userMessage || 'Failed to delete');
    }
  }

  const resetForm = () => {
    setNewRoute({
      routeName: '',
      startLocation: '',
      endLocation: '',
      stops: [''],
      distance: '',
      estimatedTime: '',
      fare: ''
    });
    setNewVehicle({
      vehicleNumber: '',
      vehicleType: 'bus',
      capacity: '',
      driverName: '',
      driverPhone: '',
      routeId: ''
    });
    setNewAllocation({
      studentId: '',
      routeId: '',
      vehicleId: '',
      pickupStop: '',
      dropStop: '',
      fare: ''
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    if (activeTab === 'routes') {
      setNewRoute({
        routeName: item.routeName,
        startLocation: item.startLocation,
        endLocation: item.endLocation,
        stops: Array.isArray(item.stops) ? item.stops.map(s => s.stopName || s) : [],
        distance: String(item.distance ?? item.totalDistance ?? ''),
        estimatedTime: String(item.estimatedTime ?? item.estimatedDuration ?? ''),
        fare: String(item.fare ?? (Array.isArray(item.stops) ? (item.stops[0]?.pickupFee ?? '') : ''))
      });
    } else if (activeTab === 'vehicles') {
      setNewVehicle({
        vehicleNumber: item.vehicleNumber,
        vehicleType: item.vehicleType,
        capacity: String(item.capacity ?? ''),
        driverName: item.driver?.name || item.driverName || '',
        driverPhone: item.driver?.phone || item.driverPhone || '',
        routeId: item.route?._id || item.routeId?._id || item.routeId || ''
      });
    } else if (activeTab === 'allocations') {
      setNewAllocation({
        studentId: item.student?._id || item.studentId?._id || item.studentId || '',
        routeId: item.route?._id || item.routeId?._id || item.routeId || '',
        vehicleId: item.vehicle?._id || item.vehicleId?._id || item.vehicleId || '',
        pickupStop: item.pickupStop,
        dropStop: item.dropStop,
        fare: String(item.fare ?? item.monthlyFee ?? '')
      });
    }
    setShowModal(true);
  };

  const addStop = () => {
    setNewRoute({...newRoute, stops: [...newRoute.stops, '']});
  };

  const removeStop = (index) => {
    const newStops = newRoute.stops.filter((_, i) => i !== index);
    setNewRoute({...newRoute, stops: newStops});
  };

  const updateStop = (index, value) => {
    const newStops = [...newRoute.stops];
    newStops[index] = value;
    setNewRoute({...newRoute, stops: newStops});
  };

  const getFilteredData = () => {
    let data = [];
    if (activeTab === 'routes') data = routes;
    else if (activeTab === 'vehicles') data = vehicles;
    else if (activeTab === 'allocations') data = allocations;

    return data.filter(item => {
      const searchFields = [];
      if (activeTab === 'routes') {
        searchFields.push(item.routeName, item.startLocation, item.endLocation);
      } else if (activeTab === 'vehicles') {
        searchFields.push(item.vehicleNumber, item.driverName, item.vehicleType);
      } else if (activeTab === 'allocations') {
        searchFields.push(
          item.student?.name || item.studentId?.name || '',
          item.student?.studentId || item.studentId || '',
          item.route?.routeName || item.routeId?.routeName || '',
          item.vehicle?.vehicleNumber || item.vehicleId?.vehicleNumber || ''
        );
      }
      return searchFields.some(field => 
        field.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  const getRouteFare = (route) => {
    if (Array.isArray(route.stops) && route.stops.length) {
      const entry = route.stops.find(s => s && s.pickupFee !== undefined && s.pickupFee !== null);
      const num = Number(entry?.pickupFee);
      if (Number.isFinite(num)) return num;
    }
    const fallback = Number(route.baseFare ?? route.fare);
    return Number.isFinite(fallback) ? fallback : 0;
  };

  const formatINR = (amount) => {
    try {
      const num = Number(amount);
      if (!Number.isFinite(num)) return '₹0';
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(num);
    } catch (_) {
      return '₹0';
    }
  };

  return (
    <div className="transport-management">
      <div className="header">
        <h1><FaBus /> Transport Management</h1>
        <button 
          className="add-btn"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <FaPlus /> Add {activeTab.slice(0, -1)}
        </button>
      </div>

      <div className="tabs">
        <button 
          className={activeTab === 'routes' ? 'active' : ''}
          onClick={() => setActiveTab('routes')}
        >
          <FaRoute /> Routes
        </button>
        <button 
          className={activeTab === 'vehicles' ? 'active' : ''}
          onClick={() => setActiveTab('vehicles')}
        >
          <FaBus /> Vehicles
        </button>
        <button 
          className={activeTab === 'allocations' ? 'active' : ''}
          onClick={() => setActiveTab('allocations')}
        >
          <FaUsers /> Allocations
        </button>
      </div>

      <div className="search-bar">
        <FaSearch />
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="content">
          {activeTab === 'routes' && (
            <div className="routes-grid">
              {getFilteredData().map((route) => (
                <div key={route._id} className="route-card">
                  <div className="card-header">
                    <h3>{route.routeName}</h3>
                    <div className="card-actions">
                      <button onClick={() => handleEdit(route)} className="edit-btn">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(route._id)} className="delete-btn">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="route-info">
                    <div className="route-path">
                      <FaMapMarkerAlt /> {route.startLocation} → {route.endLocation}
                    </div>
                    <div className="route-details">
                      <span><FaClock /> {(route.estimatedTime ?? route.estimatedDuration) ?? '-'} min</span>
                      <span>{formatINR(getRouteFare(route))}</span>
                      <span>{(route.distance ?? route.totalDistance) ?? '-'} km</span>
                    </div>
                    <div className="stops">
                      <strong>Stops:</strong> {Array.isArray(route.stops) && route.stops.length > 0 
                        ? route.stops.map(s => (s?.stopName || s?.name || s?.title || s || '')).filter(Boolean).join(', ')
                        : [route.startLocation, route.endLocation].filter(Boolean).join(', ') || '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="vehicles-grid">
              {getFilteredData().map((vehicle) => (
                <div key={vehicle._id} className="vehicle-card">
                  <div className="card-header">
                    <h3>{vehicle.vehicleNumber}</h3>
                    <div className="card-actions">
                      <button onClick={() => handleEdit(vehicle)} className="edit-btn">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(vehicle._id)} className="delete-btn">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="vehicle-info">
                    <div className="vehicle-type">{vehicle.vehicleType}</div>
                    <div className="capacity">Capacity: {vehicle.capacity} students</div>
                    <div className="driver-info">
                      <strong>Driver:</strong> {vehicle.driver?.name || '-'}
                      <br />
                      <strong>Phone:</strong> {vehicle.driver?.phone || '-'}
                    </div>
                    {(vehicle.route || vehicle.routeId) && (
                      <div className="assigned-route">
                        <strong>Route:</strong> {(vehicle.route?.routeName) || (vehicle.routeId?.routeName) || vehicle.routeId || '-'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'allocations' && (
            <div className="allocations-table">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Pickup Stop</th>
                    <th>Drop Stop</th>
                    <th>Fare</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData().map((allocation) => (
                    <tr key={allocation._id}>
                      <td>{[allocation.student?.name || allocation.studentId?.name, allocation.student?.studentId || allocation.studentId].filter(Boolean).join(' - ') || '-'}</td>
                      <td>{allocation.route?.routeName || allocation.routeId?.routeName || ''}</td>
                      <td>{allocation.vehicle?.vehicleNumber || allocation.vehicleId?.vehicleNumber || ''}</td>
                      <td>{allocation.pickupStop}</td>
                      <td>{allocation.dropStop}</td>
                      <td>{formatINR(allocation.fare ?? allocation.monthlyFee ?? 0)}</td>
                      <td>
                        <div className="table-actions">
                          <button onClick={() => handleEdit(allocation)} className="edit-btn">
                            <FaEdit />
                          </button>
                          <button onClick={() => handleDelete(allocation._id)} className="delete-btn">
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSave} className="modal-form">
              {activeTab === 'routes' && (
                <>
                  <div className="form-group">
                    <label>Route Name *</label>
                    <input
                      type="text"
                      value={newRoute.routeName}
                      onChange={(e) => setNewRoute({...newRoute, routeName: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Location *</label>
                      <input
                        type="text"
                        value={newRoute.startLocation}
                        onChange={(e) => setNewRoute({...newRoute, startLocation: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>End Location *</label>
                      <input
                        type="text"
                        value={newRoute.endLocation}
                        onChange={(e) => setNewRoute({...newRoute, endLocation: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Stops</label>
                    {newRoute.stops.map((stop, index) => (
                      <div key={index} className="stop-input">
                        <input
                          type="text"
                          value={stop}
                          onChange={(e) => updateStop(index, e.target.value)}
                          placeholder={`Stop ${index + 1}`}
                        />
                        {newRoute.stops.length > 1 && (
                          <button type="button" onClick={() => removeStop(index)}>
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addStop} className="add-stop-btn">
                      <FaPlus /> Add Stop
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Distance (km) *</label>
                      <input
                        type="number"
                        value={newRoute.distance}
                        onChange={(e) => setNewRoute({...newRoute, distance: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Estimated Time (minutes) *</label>
                      <input
                        type="number"
                        value={newRoute.estimatedTime}
                        onChange={(e) => setNewRoute({...newRoute, estimatedTime: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Fare (₹) *</label>
                    <input
                      type="number"
                      value={newRoute.fare}
                      onChange={(e) => setNewRoute({...newRoute, fare: e.target.value})}
                      required
                    />
                  </div>
                </>
              )}

              {activeTab === 'vehicles' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Vehicle Number *</label>
                      <input
                        type="text"
                        value={newVehicle.vehicleNumber}
                        onChange={(e) => setNewVehicle({...newVehicle, vehicleNumber: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Vehicle Type *</label>
                      <select
                        value={newVehicle.vehicleType}
                        onChange={(e) => setNewVehicle({...newVehicle, vehicleType: e.target.value})}
                        required
                      >
                        <option value="bus">Bus</option>
                        <option value="van">Van</option>
                        <option value="car">Car</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Capacity *</label>
                    <input
                      type="number"
                      value={newVehicle.capacity}
                      onChange={(e) => setNewVehicle({...newVehicle, capacity: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Driver Name *</label>
                      <input
                        type="text"
                        value={newVehicle.driverName}
                        onChange={(e) => setNewVehicle({...newVehicle, driverName: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Driver Phone *</label>
                      <input
                        type="tel"
                        value={newVehicle.driverPhone}
                        onChange={(e) => setNewVehicle({...newVehicle, driverPhone: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Assigned Route</label>
                    <select
                      value={newVehicle.routeId}
                      onChange={(e) => setNewVehicle({...newVehicle, routeId: e.target.value})}
                    >
                      <option value="">Select Route</option>
                      {routes.map(route => (
                        <option key={route._id} value={route._id}>{route.routeName}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {activeTab === 'allocations' && (
                <>
                  <div className="form-group">
                    <label>Student ID *</label>
                    <input
                      type="text"
                      value={newAllocation.studentId}
                      onChange={(e) => setNewAllocation({...newAllocation, studentId: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Route *</label>
                      <select
                        value={newAllocation.routeId}
                        onChange={(e) => setNewAllocation({...newAllocation, routeId: e.target.value})}
                        required
                      >
                        <option value="">Select Route</option>
                        {routes.map(route => (
                          <option key={route._id} value={route._id}>{route.routeName}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Vehicle *</label>
                      <select
                        value={newAllocation.vehicleId}
                        onChange={(e) => setNewAllocation({...newAllocation, vehicleId: e.target.value})}
                        required
                      >
                        <option value="">Select Vehicle</option>
                        {vehicles.map(vehicle => (
                          <option key={vehicle._id} value={vehicle._id}>{vehicle.vehicleNumber}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Pickup Stop *</label>
                      <input
                        type="text"
                        value={newAllocation.pickupStop}
                        onChange={(e) => setNewAllocation({...newAllocation, pickupStop: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Drop Stop *</label>
                      <input
                        type="text"
                        value={newAllocation.dropStop}
                        onChange={(e) => setNewAllocation({...newAllocation, dropStop: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Fare (₹) *</label>
                    <input
                      type="number"
                      value={newAllocation.fare}
                      onChange={(e) => setNewAllocation({...newAllocation, fare: e.target.value})}
                      required
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

<style>{`
        .transport-management {
          padding: 20px;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .header h1 {
          color: #333;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .add-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s;
        }

        .add-btn:hover {
          transform: translateY(-2px);
        }

        .tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .tabs button {
          padding: 12px 20px;
          border: none;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .tabs button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .search-bar {
          position: relative;
          margin-bottom: 20px;
          max-width: 400px;
        }

        .search-bar svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
        }

        .search-bar input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .routes-grid, .vehicles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .route-card, .vehicle-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .route-card:hover, .vehicle-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .card-header h3 {
          margin: 0;
          color: #333;
        }

        .card-actions {
          display: flex;
          gap: 8px;
        }

        .edit-btn, .delete-btn {
          background: none;
          border: none;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .edit-btn {
          color: #007bff;
        }

        .edit-btn:hover {
          background: #e3f2fd;
        }

        .delete-btn {
          color: #dc3545;
        }

        .delete-btn:hover {
          background: #ffebee;
        }

        .route-info, .vehicle-info {
          font-size: 14px;
        }

        .route-path {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-weight: 500;
          color: #333;
        }

        .route-details {
          display: flex;
          gap: 15px;
          margin-bottom: 10px;
          color: #666;
        }

        .stops {
          color: #666;
          line-height: 1.5;
        }

        .vehicle-type {
          background: #e3f2fd;
          color: #1976d2;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 10px;
        }

        .capacity {
          font-weight: 500;
          margin-bottom: 10px;
        }

        .driver-info, .assigned-route {
          color: #666;
          margin-bottom: 8px;
        }

        .allocations-table {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .allocations-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .allocations-table th {
          background: #f8f9fa;
          padding: 15px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 1px solid #dee2e6;
        }

        .allocations-table td {
          padding: 15px;
          border-bottom: 1px solid #dee2e6;
        }

        .table-actions {
          display: flex;
          gap: 8px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
          margin: 0;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-form {
          padding: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .form-group input, .form-group select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .stop-input {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
          align-items: center;
        }

        .stop-input input {
          flex: 1;
        }

        .stop-input button {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px;
          border-radius: 4px;
          cursor: pointer;
        }

        .add-stop-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 14px;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .modal-actions button {
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .modal-actions button[type="button"] {
          background: #f8f9fa;
          border: 1px solid #ddd;
          color: #666;
        }

        .modal-actions button[type="submit"] {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
        }

        @media (max-width: 768px) {
          .transport-management {
            padding: 15px;
          }

          .header {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .tabs {
            flex-wrap: wrap;
          }

          .routes-grid, .vehicles-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .modal {
            width: 95%;
            margin: 20px;
          }

          .allocations-table {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}