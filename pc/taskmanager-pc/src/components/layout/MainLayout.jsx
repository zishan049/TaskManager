import React from 'react';
import { Home, Users, History, Settings, Plus, LogOut, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';

const MainLayout = ({ children, currentView, onViewChange, onQuickAdd, onLogout }) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      signOut();
    }
  };

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'team', icon: Users, label: 'Teams' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const username = user?.user_metadata?.username || user?.email?.split('@')[0] || 'Guest';

  return (
    <div className="main-layout">
      <header className="header">
        <div className="header-container">
          <div className="header-left">
            <div className="logo-group" onClick={() => onViewChange('home')}>
              <div className="logo">
                <img src="/favicon.svg" alt="TaskManager" className="theme-aware-logo" />
                <span className="logo-text">TaskManager</span>
              </div>
              <span className="logo-tagline">Let's Get Shit Done!!</span>
            </div>

            <nav className="nav-links">
              {navItems.map(item => (
                <div key={item.id} className={`nav-link ${currentView === item.id ? 'active' : ''}`} onClick={() => onViewChange(item.id)}>
                  {item.label}
                </div>
              ))}
            </nav>
          </div>
          <div className="header-right">
            <button className="add-task-btn" onClick={onQuickAdd} title="Quick Add"><Plus size={22} /></button>
            {(theme === 'light' || theme === 'dark') && (
              <button className="nav-link" onClick={toggleTheme} title="Toggle Theme">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            )}
            <div className="user-badge" onClick={() => onViewChange('settings')}>
              <User size={16} className="accent" />
              <span className="user-name" style={{ maxWidth: '100px', fontWeight: 600, fontSize: '0.875rem' }}>{username}</span>
            </div>
            <button className="nav-link danger" onClick={handleLogoutClick} title="Logout"><LogOut size={18} /></button>
          </div>
        </div>
      </header>
      <div className="theme-watermark" aria-hidden="true" />
      <main className="content page-enter">{children}</main>
    </div>
  );
};

export default MainLayout;
