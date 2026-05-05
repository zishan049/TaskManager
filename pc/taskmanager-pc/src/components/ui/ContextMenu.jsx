import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { Home, Users, History, Settings, Plus, LogOut, Sun, Moon, Palette, Maximize2, Minimize2, Cpu, Circle, Zap, Flame, Crown, Droplets, Clock, Book } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';

const ContextMenu = ({ currentView, onViewChange, onQuickAdd, onLogout, username }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);
  const { theme, toggleTheme, setTheme } = useTheme();
  const { updateProfile } = useAuth();

  const [dashboardSettings, setDashboardSettings] = useState(() => {
    const saved = localStorage.getItem('dashboard_settings');
    return saved ? JSON.parse(saved) : { showClock: true };
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('dashboard_settings');
      if (saved) setDashboardSettings(JSON.parse(saved));
    };
    window.addEventListener('dashboard_settings_updated', handleStorageChange);
    return () => window.removeEventListener('dashboard_settings_updated', handleStorageChange);
  }, []);

  const toggleClock = () => {
    const newSettings = { ...dashboardSettings, showClock: !dashboardSettings.showClock };
    setDashboardSettings(newSettings);
    localStorage.setItem('dashboard_settings', JSON.stringify(newSettings));
    window.dispatchEvent(new CustomEvent('dashboard_settings_updated'));
  };

  const themes = [
    { id: 'light', icon: Sun, color: '#3b82f6' },
    { id: 'dark', icon: Moon, color: '#3b82f6' },
    { id: 'aura', icon: Palette, color: '#7aa2f7' },
    { id: 'emerald', icon: Zap, color: '#10b981' },
    { id: 'gold', icon: Crown, color: '#fbbf24' }
  ];


  const handleThemeChange = async (themeId) => {
    setTheme(themeId);
    const themeObj = themes.find(t => t.id === themeId);
    try {
      await updateProfile({ 
        theme_preference: themeId, 
        theme_color: themeObj?.color || '#3b82f6' 
      });
    } catch (err) {
      console.error("Theme save failed:", err);
    }
  };

  const [isPositioned, setIsPositioned] = useState(false);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    setIsPositioned(false);
    setVisible(true);
    setPosition({ x: e.clientX, y: e.clientY });
  }, []);

  useLayoutEffect(() => {
    if (visible && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      
      let newX = position.x;
      let newY = position.y;
      
      if (position.x + menuRect.width > screenWidth) {
        newX = screenWidth - menuRect.width - 10;
      }
      if (position.y + menuRect.height > screenHeight) {
        newY = screenHeight - menuRect.height - 10;
      }

      newX = Math.max(10, newX);
      newY = Math.max(10, newY);
      
      setPosition({ x: newX, y: newY });
      setIsPositioned(true);
    }
  }, [visible, position.x, position.y]);

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
        opacity: isPositioned ? 1 : 0
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
        <div className={`context-item ${currentView === 'diary' ? 'active' : ''}`} onClick={() => handleItemClick(() => onViewChange('diary'))}>
          <Book size={18} />
          <span>My Journal</span>
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

        <div className={`context-item ${dashboardSettings.showClock ? 'active' : ''}`} onClick={() => handleItemClick(toggleClock)}>
          <Clock size={18} />
          <span>{dashboardSettings.showClock ? 'Hide Dashboard Clock' : 'Show Dashboard Clock'}</span>
        </div>
        
        {(theme === 'light' || theme === 'dark') ? (
          <div className="context-item" onClick={() => handleItemClick(toggleTheme)}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span>Toggle Theme</span>
          </div>
        ) : (
          <div className="context-theme-selector">
            <div className="context-item header-item">
              <Palette size={18} />
              <span>Change Theme</span>
            </div>
            <div className="context-theme-grid">
              {themes.map(t => (
                <div 
                  key={t.id} 
                  className={`theme-dot ${theme === t.id ? 'active' : ''}`}
                  onClick={() => handleItemClick(() => handleThemeChange(t.id))}
                  title={t.id.charAt(0).toUpperCase() + t.id.slice(1)}
                >
                  <t.icon size={14} />
                </div>
              ))}
            </div>
          </div>
        )}
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
