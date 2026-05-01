import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X, Bell, MessageSquare, UserPlus, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const NotificationContext = createContext({});

const ICON_MAP = {
  success: <CheckCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  danger: <XCircle size={18} />,
  ping: <Bell size={18} className="ping-icon-anim" />,
  invite: <UserPlus size={18} />,
  chat: <MessageSquare size={18} />,
  info: <Info size={18} />,
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((notification) => {
    const id = uuidv4();
    const newNotification = {
      id,
      type: 'info', // info, success, warning, danger, ping, invite
      title: '',
      message: '',
      duration: 5000,
      ...notification
    };

    setNotifications(prev => [...prev, newNotification]);

    if (newNotification.duration !== Infinity) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
    
    return id;
  }, [removeNotification]);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      case 'danger': return <XCircle size={18} />;
      case 'ping': return <Bell size={18} className="ping-icon-anim" />;
      case 'invite': return <UserPlus size={18} />;
      case 'chat': return <MessageSquare size={18} />;
      default: return <Info size={18} />;
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <div className="global-notification-container">
        {notifications.map((n) => (
          <div 
            key={n.id} 
            className={`notification-toast ${n.type} ${n.onClick ? 'clickable' : ''} slide-in-right`}
            onClick={() => {
              if (n.onClick) {
                n.onClick();
                removeNotification(n.id);
              }
            }}
          >
            <div className="notification-icon">
              {getIcon(n.type)}
            </div>
            <div className="notification-content">
              {n.title && <div className="notification-title">{n.title}</div>}
              <div className="notification-message">{n.message}</div>
            </div>
            <button 
              className="notification-close" 
              onClick={(e) => {
                e.stopPropagation();
                removeNotification(n.id);
              }}
            >
              <X size={14} />
            </button>

            {n.duration !== Infinity && (
              <div 
                className="notification-progress" 
                style={{ animationDuration: `${n.duration}ms` }}
              ></div>
            )}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

