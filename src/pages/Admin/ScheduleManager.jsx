import React, { useState, useEffect } from 'react';
import { useLoading } from '../../hooks/useLoading';
import { useNotification } from '../../hooks/useNotification';
import { adminAPI, subjectAPI, studentAPI } from '../../services/api.js';
import './ScheduleManager.css';

const ScheduleManager = () => {
  const { loading, setLoading } = useLoading();
  const { showNotification } = useNotification();
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [viewMode, setViewMode] = useState('week'); // 'week', 'day', 'list'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  const [formData, setFormData] = useState({
    className: '',
    subject: '',
    teacher: '',
    employeeId: '',
    room: '',
    day: '',
    startTime: '',
    endTime: '',
    duration: '',
    type: 'regular', // regular, exam, event
    description: '',
    recurring: true
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  // Fixed class options requested by Admin
  const DEFAULT_CLASSES = ['NS', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  const [classes, setClasses] = useState(DEFAULT_CLASSES);
  const [subjects, setSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [studentsRes, subjectsRes, schedulesRes, facultiesRes] = await Promise.all([
        adminAPI.getStudents({ params: { page: 1, limit: 100 }, retry: true }),
        subjectAPI.getSubjects({ retry: true }),
        adminAPI.getSchedules({ retry: true }),
        // Fetch a larger set of faculty to populate the Assign Faculty dropdown
        adminAPI.getFaculty({ params: { page: 1, limit: 100 }, retry: true })
      ]);

      // Normalize API shapes defensively
      const studentsData = studentsRes.data?.data?.students
        || studentsRes.data?.students
        || studentsRes.data?.data
        || [];
      const coursesData = subjectsRes.data?.data?.subjects
        || subjectsRes.data?.subjects
        || subjectsRes.data?.data
        || subjectsRes.data
        || [];
      const schedulesData = schedulesRes.data?.data?.schedules
        || schedulesRes.data?.schedules
        || schedulesRes.data?.data
        || schedulesRes.data
        || [];
      const facultyDataRaw = facultiesRes.data?.data?.faculty
        || facultiesRes.data?.faculty
        || facultiesRes.data?.data
        || [];
      const facultyOptions = (facultyDataRaw || []).map(f => ({ id: f.id || f._id, name: f.name, employeeId: f.employeeId }));
      setFaculties(facultyOptions);
      // Build class list from Admin students and fallback to classes present in schedules
      const classSet = new Set(
        (studentsData || [])
          .map(s => s.class)
          .filter(Boolean)
          .map(c => String(c).trim().toUpperCase())
      );
      // Derive subjects from available subjects (use subjectName or name)
      const subjectSet = new Set((coursesData || []).map(s => s.subjectName || s.name).filter(Boolean));

      const normalizedSchedules = (schedulesData || []).map(s => ({
        id: s._id || s.id,
        className: s.className || s.class?.name || s.class,
        subject: s.subject || s.course?.courseName || s.courseName,
        teacher: s.teacher || s.faculty?.name || s.instructor,
        facultyId: (s.faculty && (s.faculty._id || s.faculty.id || s.faculty)) || undefined,
        room: s.room,
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.duration,
        type: s.type || 'regular',
        description: s.description || '',
        recurring: Boolean(s.recurring)
      }));

      setSchedules(normalizedSchedules);
      // Add classes found in schedules
      normalizedSchedules.forEach(s => {
        if (s.className) classSet.add(String(s.className).trim().toUpperCase());
        if (s.subject) subjectSet.add(String(s.subject).trim());
      });
      // Merge fixed classes with discovered classes
      const classesList = Array.from(new Set([...
        DEFAULT_CLASSES,
        ...Array.from(classSet)
      ]));
      const subjectsList = Array.from(subjectSet);
      setClasses(classesList);
      setSubjects(subjectsList);
    } catch (error) {
      showNotification(error.userMessage || 'Error fetching schedules', 'error');
      // Fallback to default classes so dropdowns remain usable
      setClasses(DEFAULT_CLASSES);
      setSubjects([]);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-calculate duration when times change
    if (name === 'startTime' || name === 'endTime') {
      const start = name === 'startTime' ? value : formData.startTime;
      const end = name === 'endTime' ? value : formData.endTime;
      
      if (start && end) {
        const startMinutes = timeToMinutes(start);
        const endMinutes = timeToMinutes(end);
        const duration = endMinutes - startMinutes;
        
        if (duration > 0) {
          setFormData(prev => ({ ...prev, duration: duration.toString() }));
        }
      }
    }
  };

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure a faculty is selected so schedules appear on faculty dashboard
      if (!formData.employeeId) {
        showNotification('Please select a faculty for this schedule.', 'error');
        setLoading(false);
        return;
      }
      // Validate time conflict
      const hasConflict = schedules.some(schedule => {
        if (editingSchedule && schedule.id === editingSchedule.id) return false;
        
        return schedule.day === formData.day &&
               schedule.room === formData.room &&
               ((timeToMinutes(formData.startTime) >= timeToMinutes(schedule.startTime) &&
                 timeToMinutes(formData.startTime) < timeToMinutes(schedule.endTime)) ||
                (timeToMinutes(formData.endTime) > timeToMinutes(schedule.startTime) &&
                 timeToMinutes(formData.endTime) <= timeToMinutes(schedule.endTime)));
      });

      if (hasConflict) {
        showNotification('Time conflict detected! Please choose a different time or room.', 'error');
        setLoading(false);
        return;
      }

      const payload = {
        className: formData.className,
        subject: formData.subject,
        teacher: formData.teacher,
        room: formData.room,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: parseInt(formData.duration),
        type: formData.type,
        description: formData.description,
        recurring: Boolean(formData.recurring),
        ...(formData.employeeId ? { employeeId: formData.employeeId } : {})
      };

      if (editingSchedule) {
        await adminAPI.updateSchedule(editingSchedule.id, payload);
        setSchedules(prev => prev.map(schedule => 
          schedule.id === editingSchedule.id 
            ? { ...payload, id: editingSchedule.id }
            : schedule
        ));
        showNotification('Schedule updated successfully', 'success');
      } else {
        const res = await adminAPI.createSchedule(payload);
        const created = res.data?.data || res.data || payload;
        const newSchedule = { ...created, id: created._id || created.id || Date.now() };
        setSchedules(prev => [...prev, newSchedule]);
        showNotification('Schedule created successfully', 'success');
      }

      resetForm();
    } catch (error) {
      showNotification(error.userMessage || 'Error saving schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    const matchedFaculty = faculties.find(f => String(f.id) === String(schedule.facultyId));
    setFormData({
      ...schedule,
      employeeId: matchedFaculty?.employeeId || '',
      duration: schedule.duration.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    setLoading(true);
    try {
      await adminAPI.deleteSchedule(scheduleId);
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
      showNotification('Schedule deleted successfully', 'success');
    } catch (error) {
      showNotification(error.userMessage || 'Error deleting schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      className: '',
      subject: '',
      teacher: '',
      employeeId: '',
      room: '',
      day: '',
      startTime: '',
      endTime: '',
      duration: '',
      type: 'regular',
      description: '',
      recurring: true
    });
    setEditingSchedule(null);
    setShowForm(false);
  };

  const getFilteredSchedules = () => {
    return schedules.filter(schedule => {
      const matchesClass = !filterClass || schedule.className === filterClass;
      const matchesSubject = !filterSubject || schedule.subject === filterSubject;
      return matchesClass && matchesSubject;
    });
  };

  const getSchedulesByDay = (day) => {
    return getFilteredSchedules()
      .filter(schedule => schedule.day === day)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };

  const renderWeekView = () => {
    return (
      <div className="week-view">
        <div className="week-header">
          <div className="time-column">Time</div>
          {days.map(day => (
            <div key={day} className="day-column">{day}</div>
          ))}
        </div>
        <div className="week-body">
          {timeSlots.map(time => (
            <div key={time} className="time-row">
              <div className="time-cell">{time}</div>
              {days.map(day => {
                const daySchedules = getSchedulesByDay(day);
                const currentSchedule = daySchedules.find(schedule => 
                  timeToMinutes(schedule.startTime) <= timeToMinutes(time) &&
                  timeToMinutes(schedule.endTime) > timeToMinutes(time)
                );
                
                return (
                  <div key={`${day}-${time}`} className="schedule-cell">
                    {currentSchedule && timeToMinutes(currentSchedule.startTime) === timeToMinutes(time) && (
                      <div 
                        className={`schedule-item ${currentSchedule.type}`}
                        style={{
                          height: `${(currentSchedule.duration / 30) * 40}px`
                        }}
                        onClick={() => handleEdit(currentSchedule)}
                      >
                        <div className="schedule-title">{currentSchedule.subject}</div>
                        <div className="schedule-class">{currentSchedule.className}</div>
                        <div className="schedule-teacher">{currentSchedule.teacher}</div>
                        <div className="schedule-room">{currentSchedule.room}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const filteredSchedules = getFilteredSchedules();
    const groupedSchedules = days.reduce((acc, day) => {
      acc[day] = filteredSchedules.filter(schedule => schedule.day === day)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      return acc;
    }, {});

    return (
      <div className="list-view">
        {days.map(day => (
          <div key={day} className="day-section">
            <h3 className="day-title">{day}</h3>
            {groupedSchedules[day].length === 0 ? (
              <p className="no-schedules">No schedules for this day</p>
            ) : (
              <div className="schedules-list">
                {groupedSchedules[day].map(schedule => (
                  <div key={schedule.id} className={`schedule-card ${schedule.type}`}>
                    <div className="schedule-time">
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                    <div className="schedule-info">
                      <h4>{schedule.subject}</h4>
                      <p><strong>Class:</strong> {schedule.className}</p>
                      <p><strong>Teacher:</strong> {schedule.teacher}</p>
                      <p><strong>Room:</strong> {schedule.room}</p>
                      {schedule.description && (
                        <p><strong>Description:</strong> {schedule.description}</p>
                      )}
                    </div>
                    <div className="schedule-actions">
                      <button onClick={() => handleEdit(schedule)} className="btn-edit">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(schedule.id)} className="btn-delete">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="schedule-manager">
      <div className="schedule-header">
        <h2>Schedule Manager</h2>
        <div className="header-actions">
          <div className="view-modes">
            <button 
              className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week View
            </button>
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
            disabled={loading}
          >
            Add Schedule
          </button>
        </div>
      </div>

      <div className="schedule-filters">
        <div className="filter-group">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="filter-select"
          >
            <option value="">All Classes</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="filter-select"
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="schedule-form-modal">
            <div className="modal-header">
              <h3>{editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="schedule-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Class *</label>
                  <select
                    name="className"
                    value={formData.className}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    placeholder="Subject name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Assign Faculty *</label>
                  <select
                    name="employeeId"
                    value={formData.employeeId || ''}
                    onChange={(e) => {
                      const selected = faculties.find(f => String(f.employeeId) === String(e.target.value));
                      setFormData(prev => ({
                        ...prev,
                        employeeId: e.target.value || '',
                        teacher: selected?.name || prev.teacher
                      }));
                    }}
                    required
                  >
                    <option value="">Select Faculty</option>
                    {faculties.map(f => (
                      <option key={f.employeeId} value={f.employeeId}>{f.name} ({f.employeeId})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Teacher *</label>
                  <input
                    type="text"
                    name="teacher"
                    value={formData.teacher}
                    onChange={handleInputChange}
                    required
                    placeholder="Teacher name"
                  />
                </div>
                <div className="form-group">
                  <label>Room *</label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    required
                    placeholder="Room number/name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Day *</label>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Day</option>
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="regular">Regular Class</option>
                    <option value="exam">Exam</option>
                    <option value="event">Special Event</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="15"
                    max="180"
                    step="15"
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Additional notes or description..."
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="recurring"
                    checked={formData.recurring}
                    onChange={handleInputChange}
                  />
                  Recurring weekly
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="schedule-content">
        {loading ? (
          <div className="loading-message">Loading schedules...</div>
        ) : viewMode === 'week' ? (
          renderWeekView()
        ) : (
          renderListView()
        )}
      </div>
    </div>
  );
};

export default ScheduleManager;