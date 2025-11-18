import React, { useState, useEffect } from 'react';
import config from '../../config/config.js';
import api from '../../services/api';
import { 
  FaCalendarAlt, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye,
  FaFilter,
  FaSearch
} from 'react-icons/fa';

export default function AcademicCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [filters, setFilters] = useState({
    eventType: '',
    targetAudience: '',
    startDate: '',
    endDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventType: 'Academic Event',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    isAllDay: true,
    location: '',
    targetAudience: ['All'],
    priority: 'Medium',
    color: '#007bff'
  });

  // Must match backend enum in AcademicCalendar model
  const eventTypes = [
    { value: 'Holiday', label: 'Holiday' },
    { value: 'Exam', label: 'Exam' },
    { value: 'Parent Meeting', label: 'Parent Meeting' },
    { value: 'Sports Event', label: 'Sports Event' },
    { value: 'Cultural Event', label: 'Cultural Event' },
    { value: 'Academic Event', label: 'Academic Event' },
    { value: 'Administrative', label: 'Administrative' },
    { value: 'Fee Due Date', label: 'Fee Due Date' },
    { value: 'Admission', label: 'Admission' },
    { value: 'Result Declaration', label: 'Result Declaration' },
    { value: 'Vacation', label: 'Vacation' }
  ];

  const targetAudienceOptions = [
    { value: 'All', label: 'All' },
    { value: 'Students', label: 'Students' },
    { value: 'Faculty', label: 'Faculty' },
    { value: 'Admin', label: 'Admin' },
    { value: 'Parents', label: 'Parents' }
  ];

  const priorityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' }
  ];

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.eventType) params.eventType = filters.eventType; // Already exact enum
      if (filters.targetAudience) params.targetAudience = filters.targetAudience; // Exact enum
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/calendar', { params });
      const data = response.data;
      if (data.success) {
        setEvents(data.data);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(error.userMessage || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingEvent) {
        response = await api.put(`/calendar/${editingEvent._id}`, newEvent);
      } else {
        response = await api.post('/calendar', newEvent);
      }

      const data = response.data;
      if (data.success) {
        fetchEvents();
        resetForm();
        setShowAddModal(false);
        setEditingEvent(null);
        setError('');
      } else {
        setError(data.message || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setError(error.userMessage || 'Failed to save event');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await api.delete(`/calendar/${eventId}`);
      const data = response.data;
      if (data.success) {
        fetchEvents();
        setError('');
      } else {
        setError(data.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setError(error.userMessage || 'Failed to delete event');
    }
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      description: '',
      eventType: 'Academic Event',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      isAllDay: true,
      location: '',
      targetAudience: ['All'],
      priority: 'Medium',
      color: '#007bff'
    });
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startDate: event.startDate.split('T')[0],
      endDate: event.endDate.split('T')[0],
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      isAllDay: event.isAllDay,
      location: event.location || '',
      targetAudience: event.targetAudience,
      priority: event.priority,
      color: event.color || '#007bff'
    });
    setShowAddModal(true);
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="academic-calendar">
      <div className="header">
        <h1><FaCalendarAlt /> Academic Calendar</h1>
        <button 
          className="add-btn"
          onClick={() => {
            resetForm();
            setEditingEvent(null);
            setShowAddModal(true);
          }}
        >
          <FaPlus /> Add Event
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          value={filters.eventType}
          onChange={(e) => setFilters({...filters, eventType: e.target.value})}
        >
          <option value="">All Types</option>
          {eventTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <select
          value={filters.targetAudience}
          onChange={(e) => setFilters({...filters, targetAudience: e.target.value})}
        >
          <option value="">All Audiences</option>
          {targetAudienceOptions.map(audience => (
            <option key={audience.value} value={audience.value}>{audience.label}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({...filters, startDate: e.target.value})}
          placeholder="Start Date"
        />

        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({...filters, endDate: e.target.value})}
          placeholder="End Date"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading events...</div>
      ) : (
        <div className="events-grid">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div key={event._id} className="event-card" style={{borderLeft: `4px solid ${event.color}`}}>
                <div className="event-header">
                  <h3>{event.title}</h3>
                  <div className="event-actions">
                    <button onClick={() => handleEdit(event)} className="edit-btn">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(event._id)} className="delete-btn">
                      <FaTrash />
                    </button>
                  </div>
                </div>
                
                <p className="event-description">{event.description}</p>
                
                <div className="event-details">
                  <div className="event-meta">
                    <span className={`event-type ${event.eventType}`}>{event.eventType}</span>
                    <span className={`priority ${event.priority}`}>{event.priority} priority</span>
                  </div>
                  
                  <div className="event-date">
                    <strong>Date:</strong> {formatDate(event.startDate)}
                    {event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
                  </div>
                  
                  {!event.isAllDay && (event.startTime || event.endTime) && (
                    <div className="event-time">
                      <strong>Time:</strong> 
                      {event.startTime && formatTime(event.startTime)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </div>
                  )}
                  
                  {event.location && (
                    <div className="event-location">
                      <strong>Location:</strong> {event.location}
                    </div>
                  )}
                  
                  <div className="event-audience">
                    <strong>Audience:</strong> {event.targetAudience.join(', ')}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-events">
              <FaCalendarAlt />
              <p>No events found</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingEvent ? 'Edit Event' : 'Add New Event'}</h2>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingEvent(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Event Type *</label>
                  <select
                    value={newEvent.eventType}
                    onChange={(e) => setNewEvent({...newEvent, eventType: e.target.value})}
                    required
                  >
                    {eventTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newEvent.isAllDay}
                    onChange={(e) => setNewEvent({...newEvent, isAllDay: e.target.checked})}
                  />
                  All Day Event
                </label>
              </div>

              {!newEvent.isAllDay && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>End Time</label>
                    <input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent({...newEvent, priority: e.target.value})}
                  >
                    {priorityOptions.map(priority => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Target Audience</label>
                  <select
                    multiple
                    value={newEvent.targetAudience}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setNewEvent({...newEvent, targetAudience: values});
                    }}
                  >
                    {targetAudienceOptions.map(audience => (
                      <option key={audience.value} value={audience.value}>{audience.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={newEvent.color}
                    onChange={(e) => setNewEvent({...newEvent, color: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => {
                  setShowAddModal(false);
                  setEditingEvent(null);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

<style>{`
        .academic-calendar {
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

        .filters {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 250px;
        }

        .search-box svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
        }

        .search-box input {
          width: 100%;
          padding: 10px 10px 10px 40px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .filters select, .filters input[type="date"] {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          min-width: 150px;
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

        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .event-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .event-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 15px rgba(0,0,0,0.15);
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .event-header h3 {
          margin: 0;
          color: #333;
          font-size: 18px;
        }

        .event-actions {
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

        .event-description {
          color: #666;
          margin-bottom: 15px;
          line-height: 1.5;
        }

        .event-details {
          font-size: 14px;
        }

        .event-meta {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
        }

        .event-type, .priority {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .event-type.academic { background: #e3f2fd; color: #1976d2; }
        .event-type.examination { background: #fff3e0; color: #f57c00; }
        .event-type.holiday { background: #e8f5e8; color: #388e3c; }
        .event-type.meeting { background: #f3e5f5; color: #7b1fa2; }
        .event-type.event { background: #fce4ec; color: #c2185b; }
        .event-type.deadline { background: #ffebee; color: #d32f2f; }

        .priority.high { background: #ffebee; color: #d32f2f; }
        .priority.medium { background: #fff3e0; color: #f57c00; }
        .priority.low { background: #e8f5e8; color: #388e3c; }

        .event-date, .event-time, .event-location, .event-audience {
          margin-bottom: 8px;
          color: #555;
        }

        .no-events {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .no-events svg {
          font-size: 48px;
          margin-bottom: 15px;
          opacity: 0.5;
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

        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .form-group select[multiple] {
          height: 100px;
        }

        .form-group input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
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
          .academic-calendar {
            padding: 15px;
          }

          .header {
            flex-direction: column;
            gap: 15px;
            align-items: stretch;
          }

          .filters {
            flex-direction: column;
          }

          .search-box {
            min-width: auto;
          }

          .events-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .modal {
            width: 95%;
            margin: 20px;
          }
        }
      `}</style>
    </div>
  );
}