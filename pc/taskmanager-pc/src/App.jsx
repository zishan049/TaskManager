import React, { useState, useEffect } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { useAuth } from './contexts/AuthContext';

import { useTasks } from './hooks/useTasks';
import { ListTodo } from 'lucide-react';
import TitleBar from './components/TitleBar';
import MainLayout from './components/layout/MainLayout';
import AuthPage from './pages/AuthPage';
import TaskList from './components/tasks/TaskList';
import QuickAdd from './components/tasks/QuickAdd';
import TeamPage from './pages/TeamPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import TaskSidebar from './components/tasks/TaskSidebar';
import MiniCalendar from './components/ui/MiniCalendar';
import LoadingScreen from './components/ui/LoadingScreen';
import ContextMenu from './components/ui/ContextMenu';
import { useNavigation } from './contexts/NavigationContext';


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
  const [calendarFilterDate, setCalendarFilterDate] = useState(null);

  const visibleTasks = React.useMemo(() => {
    if (!tasks) return [];
    if (!calendarFilterDate) return tasks;
    const filterDate = new Date(calendarFilterDate);
    return tasks.filter(t => {
      if (!t.due_date) return false;
      const taskDate = new Date(t.due_date);
      return taskDate.getDate() === filterDate.getDate() &&
             taskDate.getMonth() === filterDate.getMonth() &&
             taskDate.getFullYear() === filterDate.getFullYear();
    });
  }, [tasks, calendarFilterDate]);

  useEffect(() => {
    if (user) {
      // Navigation is now handled by the context which reads from localStorage on init
    }
  }, [user]);

  if (showSplash) {
    return <LoadingScreen onComplete={() => setShowSplash(false)} duration={2000} />;
  }

  if (isLoggingOut) {
    return <LoadingScreen onComplete={() => {}} duration={2500} title="See you soon!" status="Signing you out safely..." />;
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
          <div className="dashboard">
            <section className="welcome-section">
              <div className="welcome-header">
                <img src="/favicon.svg" alt="logo" className="accent" width={24} height={24} />
                <h2 className="welcome-title">
                  Hello, {profile?.username || user.user_metadata?.username || user.email?.split('@')[0]}
                </h2>
              </div>
              <p className="welcome-subtitle">
                {profile?.bio || "Here's what's happening with your tasks today."}
              </p>
            </section>

            <div className="stats-row">
              <div className="stat-box">
                <span className="stat-num">{(tasks || []).filter(t => t.status !== 'done').length}</span>
                <span className="stat-label">To Do</span>
              </div>
              <div className="stat-box">
                <span className="stat-num" style={{ color: 'var(--success)' }}>{(tasks || []).filter(t => t.status === 'done').length}</span>
                <span className="stat-label">Done</span>
              </div>
              <div className="stat-box">
                <span className="stat-num" style={{ color: 'var(--primary-accent)' }}>
                  {tasks?.length > 0 ? Math.round(((tasks || []).filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%
                </span>
                <span className="stat-label">Productivity</span>
              </div>
            </div>

            <div className="dashboard-main-grid">
              <section className="tasks-preview">
                <div className="card-title"><ListTodo size={18} /><span>Active Tasks</span></div>
                <TaskList 
                  tasks={visibleTasks} 
                  loading={tasksLoading} 
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                  onTaskClick={(task) => { setSelectedTaskId(task.id); setIsSidebarOpen(true); }}
                />
              </section>
              <aside className="dashboard-sidebar">
                <MiniCalendar tasks={tasks || []} selectedDate={calendarFilterDate} onSelectDate={setCalendarFilterDate} />
              </aside>
            </div>
          </div>
        );
      case 'team':
        return <TeamPage />;
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
      <div className={`beta-badge ${hasUpdate ? 'update-available' : ''}`} onClick={() => hasUpdate && setCurrentView('settings')}>
        {hasUpdate ? 'Update' : 'Beta'}
      </div>

    </>
  );
}

function App() {
  return (<ErrorBoundary><AppContent /></ErrorBoundary>);
}

export default App;
