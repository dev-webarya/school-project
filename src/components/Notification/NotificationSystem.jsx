import React, { createContext, useContext, useState, useCallback } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes, FaExclamationCircle } from 'react-icons/fa';
import './NotificationSystem.css';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const NotificationItem = ({ notification, onRemove }) => {
  const { id, type, title, message, duration, persistent } = notification;
  
  const getIcon = () => {
    switch (type) {
      case 'success': return <FaCheckCircle />;
      case 'error': return <FaExclamationCircle />;
      case 'warning': return <FaExclamationTriangle />;
      case 'info': return <FaInfoCircle />;
      default: return <FaInfoCircle />;
    }
  };

  React.useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [id, duration, persistent, onRemove]);

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-icon">
        {getIcon()}
      </div>
      
      <div className="notification-content">
        {title && <div className="notification-title">{title}</div>}
        <div className="notification-message">{message}</div>
      </div>
      
      <button 
        className="notification-close"
        onClick={() => onRemove(id)}
        aria-label="Close notification"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      persistent: false,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options = {}) => {
    return addNotification({
      type: 'success',
      message,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((message, options = {}) => {
    return addNotification({
      type: 'error',
      message,
      duration: 8000, // Longer duration for errors
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return addNotification({
      type: 'warning',
      message,
      duration: 6000,
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return addNotification({
      type: 'info',
      message,
      ...options
    });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    // Compatibility helper for legacy usage: showNotification(message, type)
    showNotification: (message, type = 'info', options = {}) => {
      switch (type) {
        case 'success':
          return showSuccess(message, options);
        case 'error':
          return showError(message, options);
        case 'warning':
          return showWarning(message, options);
        case 'info':
        default:
          return showInfo(message, options);
      }
    }
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Notification Container */}
      <div className="notification-container">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

// Higher-order component for API error handling
export const withNotificationErrorHandler = (Component) => {
  return function WrappedComponent(props) {
    const { showError } = useNotification();
    
    const handleApiError = useCallback((error) => {
      let message = 'An unexpected error occurred';
      
      if (error.response) {
        // Server responded with error status
        message = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        message = 'Network error. Please check your connection.';
      } else {
        // Something else happened
        message = error.message || 'An unexpected error occurred';
      }
      
      showError(message);
    }, [showError]);

    return <Component {...props} onApiError={handleApiError} />;
  };
};

export default NotificationProvider;