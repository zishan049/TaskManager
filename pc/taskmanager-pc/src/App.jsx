import React, { useState, useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { version } from '../package.json';
import { useAuth } from './contexts/AuthContext';
import { getCurrentWindow } from '@tauri-apps/api/window';

import { useTasks } from './hooks/useTasks';import TitleBar from './components/TitleBar';
import MainLayout from './components/layout/MainLayout';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import TeamPage from './pages/TeamPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import DiaryPage from './pages/DiaryPage';
import TaskSidebar from './components/tasks/TaskSidebar';
import QuickAdd from './components/tasks/QuickAdd';
import LoadingScreen from './components/ui/LoadingScreen';
import ContextMenu from './components/ui/ContextMenu';
import { useNavigation } from './contexts/NavigationContext';
import './styles/diary.css';


class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("App Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', marginTop: '10vh' }}>
          <h1 className="danger">Something went wrong</h1>
          <p className="text-secondary" style={{ marginTop: '1rem' }}>{this.state.error?.toString()}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '2rem' }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}





function AppContent() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { tasks, loading: tasksLoading, updateTask, deleteTask } = useTasks();
  const { currentView, setCurrentView } = useNavigation();
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();
        if (update) {
          setHasUpdate(true);
        } else {
          setHasUpdate(false);
        }
      } catch (err) {
        console.error('Update check failed:', err);
      }
    };

    checkForUpdates();
    // Check for updates every hour
    const interval = setInterval(checkForUpdates, 3600000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e) => {
      // F11: Toggle Fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        const appWindow = getCurrentWindow();
        const isFullscreen = await appWindow.isFullscreen();
        await appWindow.setFullscreen(!isFullscreen);
      }

      // Escape: Exit Fullscreen
      if (e.key === 'Escape') {
        const appWindow = getCurrentWindow();
        const isFullscreen = await appWindow.isFullscreen();
        if (isFullscreen) {
          await appWindow.setFullscreen(false);
        }
      }

      // Navigation Shortcuts (Alt + Key)
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'h':
          case 'home':
            e.preventDefault();
            setCurrentView('home');
            break;
          case 't':
            e.preventDefault();
            setCurrentView('team');
            break;
          case 'd':
            e.preventDefault();
            setCurrentView('diary');
            break;
          case 's':
            e.preventDefault();
            setCurrentView('settings');
            break;
          case 'y': // HistorY
            e.preventDefault();
            setCurrentView('history');
            break;
          case 'q':
            e.preventDefault();
            setIsQuickAddOpen(prev => !prev);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentView]);

  const handleLogout = async () => {

    setIsLoggingOut(true);
    // Wait for animation duration minus fade out
    setTimeout(async () => {
      await signOut();
      setIsLoggingOut(false);
    }, 2500);

  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSplashComplete = React.useCallback(() => {
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (user) {
      // Navigation is now handled by the context which reads from localStorage on init
    }
  }, [user]);

  if (showSplash) {
    return <LoadingScreen onComplete={handleSplashComplete} duration={2000} />;
  }

  if (isLoggingOut) {
    return <LoadingScreen onComplete={() => {}} duration={2500} title="See you soon!" status="Signing you out safely..." isLogout={true} />;
  }


  if (authLoading) {
    return (<><TitleBar /><div className="loading-screen" style={{ paddingTop: '32px' }}><div className="loader"></div></div></>);
  }

  if (!user) {
    return <><TitleBar /><AuthPage /></>;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomePage 
            profile={profile}
            user={user}
            tasks={tasks}
            tasksLoading={tasksLoading}
            updateTask={updateTask}
            deleteTask={deleteTask}
            onTaskClick={(task) => { setSelectedTaskId(task.id); setIsSidebarOpen(true); }}
          />
        );
      case 'team':
        return <TeamPage />;
      case 'diary':
        return <DiaryPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };


  return (
    <>
      <TitleBar />
      <ContextMenu 
        currentView={currentView}
        onViewChange={handleViewChange}
        onQuickAdd={() => setIsQuickAddOpen(true)}
        onLogout={handleLogout}
        username={user?.user_metadata?.username || user?.email?.split('@')[0] || 'Guest'}
      />
      <MainLayout 
        currentView={currentView} 
        onViewChange={handleViewChange} 
        onQuickAdd={() => setIsQuickAddOpen(prev => !prev)}
        onLogout={handleLogout}
      >
        {renderView()}
      </MainLayout>
      <QuickAdd isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
      <TaskSidebar task={tasks?.find(t => t.id === selectedTaskId)} isOpen={isSidebarOpen} onClose={() => { setIsSidebarOpen(false); setSelectedTaskId(null); }} />
      <div className={`beta-badge animate-badge ${hasUpdate ? 'update-available' : ''}`} onClick={() => hasUpdate && setCurrentView('settings')}>
        <div className="beta-badge-content">
          <span className="label">{hasUpdate ? 'Update' : 'Beta'}</span>
          <span className="version">v{version}</span>
        </div>
      </div>

    </>
  );
}

function App() {
  return (<ErrorBoundary><AppContent /></ErrorBoundary>);
}

export default App;
