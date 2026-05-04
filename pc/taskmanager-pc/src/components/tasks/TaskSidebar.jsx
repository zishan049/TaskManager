import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, AlignLeft, Flag, Clock, CheckCircle2, Circle, Users, History, Trash2, Send, StickyNote } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../ui/ConfirmModal';
import { useTeams } from '../../contexts/TeamsContext';

const TaskSidebar = ({ task, isOpen, onClose }) => {
  const { updateTask, deleteTask, fetchTaskHistory, addPersonalNote, deletePersonalNote } = useTasks();
  const { user, profile } = useAuth();
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('');
  const [isTimeFocused, setIsTimeFocused] = useState(false);
  const [editTags, setEditTags] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [historyEntries, setHistoryEntries] = useState([]);
  const { teamNotes, fetchTeamNotes } = useTeams();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const bottomRef = useRef(null);
  const [hour12, setHour12] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('dashboard_settings');
    if (saved) {
      const settings = JSON.parse(saved);
      if (settings.hour12 !== undefined) setHour12(settings.hour12);
    }
  }, []);

  const formatTime = (time24, is12h) => {
    if (!time24) return '';
    if (!is12h) return time24;
    const [h, m] = time24.split(':');
    if (!h || !m) return time24;
    const hh = parseInt(h);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const parseTime = (timeStr, is12h) => {
    if (!timeStr) return '';
    if (!is12h) return timeStr;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return timeStr;
    let [_, h, m, ampm] = match;
    let hh = parseInt(h);
    if (ampm.toUpperCase() === 'PM' && hh < 12) hh += 12;
    if (ampm.toUpperCase() === 'AM' && hh === 12) hh = 0;
    return `${hh.toString().padStart(2, '0')}:${m}`;
  };

  useEffect(() => {
    if (task) {
      setEditTitle(task.title || '');
      setEditDesc(task.description || '');
      setEditPriority(task.priority || 'medium');
      setEditDueDate(task.due_date ? task.due_date.split('T')[0] : '');
      setEditDueTime(formatTime(task.due_time || '', hour12));
      setEditTags(task.tags?.join(', ') || '');
      setEditNotes(task.notes || '');
      loadHistory(task.id);
      if (task.team_id) fetchTeamNotes(task.team_id);
    }
  }, [task, hour12]);

  const loadHistory = async (taskId) => {
    const data = await fetchTaskHistory(taskId);
    setHistoryEntries(data || []);
  };

  const handleSaveField = async (field, value) => {
    if (!task) return;
    const updates = {};
    if (field === 'tags') {
      updates.tags = value.split(',').map(t => t.trim()).filter(Boolean);
    } else if (field === 'due_time') {
      updates.due_time = parseTime(value, hour12);
    } else {
      updates[field] = value;
    }
    await updateTask(task.id, updates);
  };

  const handleDelete = async () => {
    if (!task) return;
    await deleteTask(task.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleToggleStatus = async () => {
    if (!task) return;
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTask(task.id, { status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null });
  };



  if (!task) return null;

  const combinedHistory = [
    ...historyEntries.filter(e => e.action !== 'NOTE').map(e => ({
      id: e.id,
      action: e.action.replace('_', ' '),
      created_at: e.created_at,
      type: 'history'
    })),
    ...(teamNotes[task.team_id] || [])
      .filter(n => n.task_id === task.id)
      .map(n => ({
        id: n.id,
        action: `NOTE by @${n.user?.username || 'user'}`,
        content: n.content,
        created_at: n.created_at,
        type: 'team_note'
      }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = i % 2 === 0 ? '00' : '30';
    const time24 = `${hours.toString().padStart(2, '0')}:${minutes}`;
    return formatTime(time24, hour12);
  });

  const filteredTimeOptions = timeOptions.filter(t => t.includes(editDueTime));

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />
      <div className={`task-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <div className="sidebar-status-wrap">
              <button className={`task-status-toggle-large ${task.status}`} onClick={handleToggleStatus} title="Toggle Status">
                {task.status === 'done' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
            </div>
            <div className="sidebar-header-actions">
              <button onClick={() => setShowDeleteConfirm(true)} className="sidebar-action-btn delete" title="Delete Task"><Trash2 size={18} /></button>
              <button onClick={onClose} className="sidebar-action-btn" title="Close"><X size={20} /></button>
            </div>
          </div>
          <div className="sidebar-title-area">
            <textarea 
              className="sidebar-title-input" 
              value={editTitle} 
              onChange={e => setEditTitle(e.target.value)} 
              onBlur={() => handleSaveField('title', editTitle)}
              rows="1"
              placeholder="Task Title"
            />
          </div>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-grid">
            <div className="sidebar-section">
              <div className="section-header"><Flag size={14} className="accent" /><h3>Priority</h3></div>
              <div className="priority-pill-group">
                {['low', 'medium', 'high'].map(p => (
                  <button key={p} className={`priority-pill-mini ${p} ${editPriority === p ? 'active' : ''}`}
                    onClick={() => { setEditPriority(p); handleSaveField('priority', p); }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <div className="section-header"><Calendar size={14} className="accent" /><h3>Due Date</h3></div>
              <div className="date-input-wrapper">
                <input type="date" className="minimal-input" style={{ width: '100%', colorScheme: 'dark', color: 'var(--text-primary)' }} value={editDueDate} onChange={e => { setEditDueDate(e.target.value); handleSaveField('due_date', e.target.value); }} />
              </div>
            </div>

            <div className="sidebar-section">
              <div className="section-header"><Clock size={14} className="accent" /><h3>Due Time</h3></div>
              <div className="date-input-wrapper" style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder={hour12 ? "HH:MM AM/PM" : "HH:MM"}
                  className="minimal-input" 
                  value={editDueTime} 
                  onChange={e => setEditDueTime(e.target.value)}
                  onFocus={() => setIsTimeFocused(true)}
                  onBlur={() => {
                    handleSaveField('due_time', editDueTime);
                    setTimeout(() => setIsTimeFocused(false), 200);
                  }}
                  style={{ width: '100%', fontFamily: 'var(--font-digital)', letterSpacing: '1px' }} 
                />
                {isTimeFocused && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 'calc(100% + 8px)', 
                    left: 0, 
                    right: 0, 
                    background: 'var(--surface-color)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px', 
                    maxHeight: '180px', 
                    overflowY: 'auto', 
                    zIndex: 100,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {filteredTimeOptions.map(t => (
                      <button 
                        key={t} 
                        type="button" 
                        onClick={() => { setEditDueTime(t); handleSaveField('due_time', t); }}
                        style={{ 
                          padding: '8px 12px', 
                          textAlign: 'left', 
                          background: 'transparent', 
                          border: 'none', 
                          color: 'var(--text-primary)', 
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-digital)',
                          letterSpacing: '0.05em',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.target.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.target.style.background = 'transparent'}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>


          <div className="sidebar-section">
            <div className="section-header"><Tag size={14} className="accent" /><h3>Tags</h3></div>
            <input type="text" className="minimal-input" value={editTags} onChange={e => setEditTags(e.target.value)} onBlur={() => handleSaveField('tags', editTags)} placeholder="e.g. design, urgent" />
          </div>

          <div className="sidebar-section">
            <div className="section-header"><AlignLeft size={14} className="accent" /><h3>Description</h3></div>
            <textarea className="sidebar-desc-area" value={editDesc} onChange={e => setEditDesc(e.target.value)} onBlur={() => handleSaveField('description', editDesc)} placeholder="Write something more about this task..." rows={4} />
          </div>

          <div className="sidebar-divider" />

          <div className="sidebar-section">
            <div className="section-header"><StickyNote size={14} className="accent" /><h3>Notes</h3></div>
            <div className="notes-container">
              <textarea 
                className="sidebar-desc-area" 
                value={editNotes} 
                onChange={e => setEditNotes(e.target.value)} 
                onBlur={() => handleSaveField('notes', editNotes)}
                placeholder="Write your task notes here..." 
                rows={6} 
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '8px' }}
              />
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-header"><History size={14} className="accent" /><h3>Activity</h3></div>
            <div className="modern-history-list">
              {combinedHistory.length === 0 ? (
                <p className="empty-history">No history found.</p>
              ) : (
                combinedHistory.slice(0, 15).map(entry => (
                  <div key={entry.id} className={`history-item ${entry.type}`}>
                    <div className="history-indicator" />
                    <div className="history-content">
                      <span className="history-text">{entry.action}</span>
                      {entry.content && <p className="history-subtext">{entry.content}</p>}
                      <span className="history-date">{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Delete Task?"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete Task"
        type="danger"
      />
    </>
  );
};

export default TaskSidebar;
