import React from 'react';
import { Home, Users, History, Settings, Plus, LogOut, User, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';

const MainLayout = ({ children, currentView, onViewChange, onQuickAdd }) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
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
            <div className="logo" onClick={() => onViewChange('home')} style={{ cursor: 'pointer' }}>
              <CheckCircle2 size={22} className="logo-icon" />
              <span>TaskManager</span>
            </div>
            
            <nav className="nav-links">
              {navItems.map(item => (
                <div 
                  key={item.id}
                  className={`nav-link ${currentView === item.id ? 'active' : ''}`}
                  onClick={() => onViewChange(item.id)}
                >
                  {item.label}
                </div>
              ))}
            </nav>
          </div>

          <div className="header-right">
            <button 
              className="add-task-btn" 
              onClick={onQuickAdd} 
              title="Quick Add"
            >
              <Plus size={22} />
            </button>

            {(theme === 'light' || theme === 'dark') && (
              <button className="nav-link" onClick={toggleTheme} title="Toggle Theme">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            )}
            
            <div className="user-badge" onClick={() => onViewChange('settings')}>
              <User size={16} className="accent" />
              <span className="font-semibold text-sm truncate user-name" style={{ maxWidth: '100px' }}>
                {username}
              </span>
            </div>

            <button className="nav-link danger" onClick={() => signOut()} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      
      <main className="content page-enter">
        {children}
      </main>

      <nav className="bottom-nav">
        {navItems.slice(0, 2).map(Item => (
          <div 
            key={Item.id}
            className={`bottom-nav-item ${currentView === Item.id ? 'active' : ''}`}
            onClick={() => onViewChange(Item.id)}
          >
            <Item.icon size={20} />
            <span>{Item.label}</span>
          </div>
        ))}

        <button className="bottom-nav-add" onClick={onQuickAdd} title="Quick Add">
          <Plus size={24} />
        </button>

        {navItems.slice(2).map(Item => (
          <div 
            key={Item.id}
            className={`bottom-nav-item ${currentView === Item.id ? 'active' : ''}`}
            onClick={() => onViewChange(Item.id)}
          >
            <Item.icon size={20} />
            <span>{Item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default MainLayout;
