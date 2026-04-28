import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTasks } from './hooks/useTasks';
import { ListTodo, User, Info, LogOut, RefreshCw } from 'lucide-react';
import MainLayout from './components/layout/MainLayout';
import AuthPage from './pages/AuthPage';
import TaskList from './components/tasks/TaskList';
import QuickAdd from './components/tasks/QuickAdd';
import TeamPage from './pages/TeamPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import TaskSidebar from './components/tasks/TaskSidebar';
import MiniCalendar from './components/ui/MiniCalendar';

// Simple Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("App Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-screen" style={{ padding: '2rem', textAlign: 'center', marginTop: '10vh' }}>
          <h1 className="danger">Something went wrong</h1>
          <p className="text-secondary" style={{ marginTop: '1rem' }}>{this.state.error?.toString()}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: '2rem' }}>
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user, profile, loading: authLoading, showSuccessPopup } = useAuth();
  const { tasks, loading: tasksLoading, updateTask, deleteTask } = useTasks();
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('taskmanager_view') || 'home';
  });

  const handleViewChange = (view) => {
    setCurrentView(view);
    localStorage.setItem('taskmanager_view', view);
  };
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [calendarFilterDate, setCalendarFilterDate] = useState(null);

  const visibleTasks = React.useMemo(() => {
    if (!tasks) return [];
    if (!calendarFilterDate) return tasks;
    
    return tasks.filter(t => {
      const taskDate = new Date(t.due_date || t.created_at);
      return taskDate.getDate() === calendarFilterDate.getDate() &&
             taskDate.getMonth() === calendarFilterDate.getMonth() &&
             taskDate.getFullYear() === calendarFilterDate.getFullYear();
    });
  }, [tasks, calendarFilterDate]);

  // Reset to home after login/signup popup closes
  useEffect(() => {
    if (!showSuccessPopup && user) {
      const stored = localStorage.getItem('taskmanager_view');
      if (stored) setCurrentView(stored);
    }
  }, [showSuccessPopup, user]);

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!user || showSuccessPopup) {
    return <AuthPage />;
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
                <span className="stat-num">
                  {(tasks || []).filter(t => t.status !== 'done').length}
                </span>
                <span className="stat-label">To Do</span>
              </div>
              <div className="stat-box">
                <span className="stat-num" style={{ color: 'var(--success)' }}>
                  {(tasks || []).filter(t => t.status === 'done').length}
                </span>
                <span className="stat-label">Done</span>
              </div>
              <div className="stat-box">
                <span className="stat-num" style={{ color: 'var(--primary-accent)' }}>
                  {tasks?.length > 0 
                    ? Math.round(((tasks || []).filter(t => t.status === 'done').length / tasks.length) * 100) 
                    : 0}%
                </span>
                <span className="stat-label">Productivity</span>
              </div>
            </div>

            <div className="dashboard-main-grid">
              <section className="tasks-preview">
                <div className="card-title">
                  <ListTodo size={18} />
                  <span>Active Tasks</span>
                </div>
                <TaskList 
                  tasks={visibleTasks} 
                  loading={tasksLoading} 
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                  onTaskClick={(task) => {
                    setSelectedTaskId(task.id);
                    setIsSidebarOpen(true);
                  }}
                />
              </section>

              <aside className="dashboard-sidebar">
                <MiniCalendar 
                  tasks={tasks || []} 
                  selectedDate={calendarFilterDate}
                  onSelectDate={setCalendarFilterDate}
                />
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
      <MainLayout 
        currentView={currentView} 
        onViewChange={handleViewChange} 
        onQuickAdd={() => {
          console.log('Toggling QuickAdd');
          setIsQuickAddOpen(prev => !prev);
        }}
      >
        {renderView()}
      </MainLayout>

      <QuickAdd 
        isOpen={isQuickAddOpen} 
        onClose={() => setIsQuickAddOpen(false)} 
      />

      <TaskSidebar 
        task={tasks?.find(t => t.id === selectedTaskId)}
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          setSelectedTaskId(null);
        }}
      />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
