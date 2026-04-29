import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, Users, History, Settings, Plus, LogOut, Sun, Moon, Palette, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

const ContextMenu = ({ currentView, onViewChange, onQuickAdd, onLogout, username }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    
    // Calculate position to keep menu within viewport
    const x = e.clientX;
    const y = e.clientY;
    
    setPosition({ x, y });
    setVisible(true);
  }, []);

  const handleClick = useCallback(() => {
    if (visible) setVisible(false);
  }, [visible]);

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
    };
  }, [handleContextMenu, handleClick]);

  if (!visible) return null;

  const handleItemClick = (action) => {
    setVisible(false);
    action();
  };

  return (
    <div 
      ref={menuRef}
      className="context-menu"
      style={{ 
        top: position.y, 
        left: position.x,
        transform: `translate(${position.x + 220 > window.innerWidth ? '-100%' : '0'}, ${position.y + 350 > window.innerHeight ? '-100%' : '0'})`
      }}
    >
      <div className="context-header">
        <div className="context-user">
          <div className="context-user-avatar">{username.charAt(0).toUpperCase()}</div>
          <div className="context-user-info">
            <span className="context-user-name">{username}</span>
            <span className="context-user-status">Online</span>
          </div>
        </div>
      </div>

      <div className="context-divider" />

      <div className="context-group">
        <div className="context-item primary" onClick={() => handleItemClick(onQuickAdd)}>
          <Plus size={18} />
          <span>Quick Add Task</span>
          <kbd>N</kbd>
        </div>
      </div>

      <div className="context-divider" />

      <div className="context-group">
        <div className={`context-item ${currentView === 'home' ? 'active' : ''}`} onClick={() => handleItemClick(() => onViewChange('home'))}>
          <Home size={18} />
          <span>Dashboard</span>
        </div>
        <div className={`context-item ${currentView === 'team' ? 'active' : ''}`} onClick={() => handleItemClick(() => onViewChange('team'))}>
          <Users size={18} />
          <span>Teams</span>
        </div>
        <div className={`context-item ${currentView === 'history' ? 'active' : ''}`} onClick={() => handleItemClick(() => onViewChange('history'))}>
          <History size={18} />
          <span>History</span>
        </div>
      </div>

      <div className="context-divider" />

      <div className="context-group">
        <div className={`context-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => handleItemClick(() => onViewChange('settings'))}>
          <Settings size={18} />
          <span>Settings</span>
        </div>
        <div className="context-item" onClick={() => handleItemClick(toggleTheme)}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          <span>Toggle Theme</span>
        </div>
      </div>

      <div className="context-divider" />

      <div className="context-group">
        <div className="context-item danger" onClick={() => handleItemClick(onLogout)}>
          <LogOut size={18} />
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
};

export default ContextMenu;
