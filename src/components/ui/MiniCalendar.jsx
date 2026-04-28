import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function MiniCalendar({ tasks = [], selectedDate, onSelectDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Create an array of tasks that have valid dates to check against
  const tasksWithDates = useMemo(() => {
    return tasks
      .filter(t => t.due_date || t.created_at)
      .map(t => new Date(t.due_date || t.created_at));
  }, [tasks]);

  const hasTaskOnDate = (day) => {
    return tasksWithDates.some(taskDate => 
      taskDate.getDate() === day &&
      taskDate.getMonth() === currentDate.getMonth() &&
      taskDate.getFullYear() === currentDate.getFullYear()
    );
  };

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const handleDayClick = (day) => {
    if (onSelectDate) {
      const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      // Toggle off if same date is clicked
      if (selectedDate && 
          selectedDate.getDate() === day && 
          selectedDate.getMonth() === currentDate.getMonth() && 
          selectedDate.getFullYear() === currentDate.getFullYear()) {
        onSelectDate(null);
      } else {
        onSelectDate(clickedDate);
      }
    }
  };

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const hasTask = hasTaskOnDate(d);
    const isSelected = selectedDate && 
                       selectedDate.getDate() === d && 
                       selectedDate.getMonth() === currentDate.getMonth() && 
                       selectedDate.getFullYear() === currentDate.getFullYear();
    
    days.push(
      <div 
        key={d} 
        className={`calendar-day ${isToday(d) ? 'today' : ''} ${hasTask ? 'has-task' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => handleDayClick(d)}
        style={{ cursor: onSelectDate ? 'pointer' : 'default' }}
      >
        <span className="day-number">{d}</span>
        {hasTask && <div className="task-dot"></div>}
      </div>
    );
  }

  return (
    <div className="mini-calendar-container">
      <div className="calendar-header">
        <div className="calendar-title">
          <CalendarIcon size={18} className="accent" />
          <span>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
        </div>
        <div className="calendar-actions">
          <button onClick={prevMonth} className="btn-icon-small" aria-label="Previous month"><ChevronLeft size={18} /></button>
          <button onClick={nextMonth} className="btn-icon-small" aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="calendar-grid">
        {dayNames.map(name => (
          <div key={name} className="calendar-weekday">{name}</div>
        ))}
        {days}
      </div>
    </div>
  );
}
