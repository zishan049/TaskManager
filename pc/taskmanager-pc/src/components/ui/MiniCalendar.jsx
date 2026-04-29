import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const MiniCalendar = ({ tasks, selectedDate, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const taskDates = useMemo(() => {
    const dates = new Set();
    const parseAsLocal = (dStr) => {
      if (!dStr) return null;
      if (typeof dStr === 'string' && dStr.includes('-')) {
        const [y, m, d] = dStr.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m - 1, d).toDateString();
      }
      return new Date(dStr).toDateString();
    };

    tasks?.forEach(t => {
      if (t.due_date && t.status !== 'done') {
        const ds = parseAsLocal(t.due_date);
        if (ds) dates.add(ds);
      }
    });
    return dates;
  }, [tasks]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isToday = (day) => day && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    const d = new Date(year, month, day);
    return d.toDateString() === new Date(selectedDate).toDateString();
  };
  const hasTask = (day) => {
    if (!day) return false;
    return taskDates.has(new Date(year, month, day).toDateString());
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const d = new Date(year, month, day);
    if (onSelectDate) {
      if (selectedDate && new Date(d).toDateString() === new Date(selectedDate).toDateString()) {
        onSelectDate(null);
      } else {
        onSelectDate(d);
      }
    }
  };

  return (
    <div className="mini-calendar-container">
      <div className="calendar-header">
        <div className="calendar-title">
          <Calendar size={16} className="accent" />
          <span>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="calendar-actions">
          <button className="btn-icon-small" onClick={prevMonth}><ChevronLeft size={16} /></button>
          <button className="btn-icon-small" onClick={nextMonth}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="calendar-grid">
        {weekdays.map(w => <div key={w} className="calendar-weekday">{w}</div>)}
        {days.map((day, i) => (
          <div key={i}
            className={`calendar-day ${!day ? 'empty' : ''} ${isToday(day) ? 'today' : ''} ${isSelected(day) ? 'selected' : ''}`}
            onClick={() => handleDayClick(day)}
            style={{ cursor: day ? 'pointer' : 'default' }}
          >
            {day}
            {hasTask(day) && <div className="task-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MiniCalendar;
