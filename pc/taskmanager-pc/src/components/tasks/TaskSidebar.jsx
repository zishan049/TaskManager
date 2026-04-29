import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, AlignLeft, Flag, Clock, CheckCircle2, Circle, Users, History, Trash2, Send, StickyNote } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from '../ui/ConfirmModal';

const TaskSidebar = ({ task, isOpen, onClose }) => {
  const { updateTask, deleteTask, fetchTaskHistory, addPersonalNote, deletePersonalNote } = useTasks();
  const { user, profile } = useAuth();
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editTags, setEditTags] = useState('');
  const [historyEntries, setHistoryEntries] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (task) {
      setEditTitle(task.title || '');
      setEditDesc(task.description || '');
      setEditPriority(task.priority || 'medium');
      setEditDueDate(task.due_date || '');
      setEditTags(task.tags?.join(', ') || '');
      loadHistory(task.id);
    }
  }, [task]);

  const loadHistory = async (taskId) => {
    const data = await fetchTaskHistory(taskId);
    setHistoryEntries(data || []);
  };

  const handleSaveField = async (field, value) => {
    if (!task) return;
    const updates = {};
    if (field === 'tags') {
      updates.tags = value.split(',').map(t => t.trim()).filter(Boolean);
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

  const history = historyEntries.filter(e => e.action !== 'NOTE');

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
                <input type="date" className="minimal-input" value={editDueDate} onChange={e => { setEditDueDate(e.target.value); handleSaveField('due_date', e.target.value); }} />
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
                value={task.notes || ''} 
                onChange={e => handleSaveField('notes', e.target.value)} 
                placeholder="Write your task notes here..." 
                rows={6} 
                style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '8px' }}
              />
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-header"><History size={14} className="accent" /><h3>Activity</h3></div>
            <div className="modern-history-list">
              {history.length === 0 ? (
                <p className="empty-history">No history found.</p>
              ) : (
                history.slice(0, 8).map(entry => (
                  <div key={entry.id} className="history-item">
                    <div className="history-indicator" />
                    <div className="history-content">
                      <span className="history-text">{entry.action.replace('_', ' ')}</span>
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
