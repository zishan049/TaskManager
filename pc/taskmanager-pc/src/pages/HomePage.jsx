import React, { useState, useEffect, useMemo } from 'react';
import { ListTodo } from 'lucide-react';
import TaskList from '../components/tasks/TaskList';
import MiniCalendar from '../components/ui/MiniCalendar';
import '../styles/home.css';

const HomePage = ({ 
  profile, 
  user, 
  tasks, 
  tasksLoading, 
  updateTask, 
  deleteTask, 
  onTaskClick 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarFilterDate, setCalendarFilterDate] = useState(null);
  const [dashboardSettings, setDashboardSettings] = useState(() => {
    const saved = localStorage.getItem('dashboard_settings');
    const settings = saved ? JSON.parse(saved) : { showClock: true, hour12: true };
    if (settings.hour12 === undefined) settings.hour12 = true;
    return settings;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('dashboard_settings');
      if (saved) setDashboardSettings(JSON.parse(saved));
    };
    window.addEventListener('dashboard_settings_updated', handleStorageChange);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      window.removeEventListener('dashboard_settings_updated', handleStorageChange);
      clearInterval(timer);
    };
  }, []);

  const visibleTasks = useMemo(() => {
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

  return (
    <div className="dashboard">
      <section className="welcome-section">
        <div className="welcome-header animate-text">
          <img src="/favicon.svg" alt="logo" className="accent" width={24} height={24} />
          <h2 className="welcome-title">
            Hello, {profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0]}
          </h2>
        </div>
        <p className="welcome-subtitle animate-text">
          {profile?.bio || "Here's what's happening with your tasks today."}
        </p>
      </section>

      <div className="stats-row">
        <div className="stat-box animate-card">
          <span className="stat-num">{(tasks || []).filter(t => t.status !== 'done').length}</span>
          <span className="stat-label">To Do</span>
        </div>
        <div className="stat-box animate-card">
          <span className="stat-num" style={{ color: 'var(--success)' }}>{(tasks || []).filter(t => t.status === 'done').length}</span>
          <span className="stat-label">Done</span>
        </div>
        <div className="stat-box animate-card">
          <span className="stat-num" style={{ color: 'var(--primary-accent)' }}>
            {tasks?.length > 0 ? Math.round(((tasks || []).filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%
          </span>
          <span className="stat-label">Productivity</span>
        </div>
        <div className={`stat-box clock-card animate-card ${!dashboardSettings.showClock ? 'hidden' : ''}`}>
          <span className="clock-time">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: dashboardSettings.hour12 })}
          </span>
          <span className="stat-label">{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <section className="tasks-preview">
          <div className="card-title animate-text"><ListTodo size={18} /><span>Active Tasks</span></div>
          <div className="animate-text">
            <TaskList 
              tasks={visibleTasks} 
              loading={tasksLoading} 
              onUpdate={updateTask}
              onDelete={deleteTask}
              onTaskClick={onTaskClick}
            />
          </div>
        </section>
        <aside className="dashboard-sidebar animate-calendar">
          <MiniCalendar tasks={tasks || []} selectedDate={calendarFilterDate} onSelectDate={setCalendarFilterDate} />
        </aside>
      </div>
    </div>
  );
};

export default HomePage;
