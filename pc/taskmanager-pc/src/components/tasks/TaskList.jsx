import React from 'react';
import { CheckCircle2, Circle, Clock, Tag, ListTodo, User, Info, Calendar, Trash2 } from 'lucide-react';
import ConfirmModal from '../ui/ConfirmModal';

const TaskList = ({ tasks, loading, onUpdate, onTaskClick, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [taskToDelete, setTaskToDelete] = React.useState(null);

  if (loading) return (
    <div className="loading-state" style={{ padding: '2rem', textAlign: 'center' }}>
      <div className="loader" style={{ margin: '0 auto 1rem' }}></div>
      <p className="text-secondary text-sm">Fetching tasks...</p>
    </div>
  );

  if (tasks.length === 0) {
    return (
      <div className="empty-tasks" style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.5 }}>
        <ListTodo size={48} style={{ marginBottom: '1rem', margin: '0 auto' }} />
        <p className="text-secondary">No tasks found. Time to relax!</p>
      </div>
    );
  }

  const toggleComplete = (e, task) => {
    e.stopPropagation();
    onUpdate(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setTaskToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      onDelete(taskToDelete);
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    }
  };

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div key={task.id} className={`task-row ${task.status === 'done' ? 'completed' : ''}`} onClick={() => onTaskClick(task)}>
          <div className="hover-details">
            <h5 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-tertiary)', marginBottom: '8px', textTransform: 'uppercase' }}>Details</h5>
            <p className="hover-desc">{task.description || "No description provided."}</p>
            <div className="hover-meta">
              <div className="hover-meta-item"><User size={14} /> <span>{task.creator_username || 'System'}</span></div>
              <div className="hover-meta-item"><Calendar size={14} /> <span>Created {new Date(task.created_at).toLocaleDateString()}</span></div>
              <div className="hover-meta-item"><Info size={14} /> <span>ID: {task.id.slice(0, 8)}...</span></div>
            </div>
            <div className="hover-actions">
              <button className="hover-delete-btn" onClick={(e) => handleDeleteClick(e, task.id)}>
                <Trash2 size={14} /><span>Delete</span>
              </button>
            </div>
          </div>
          <button className="task-check" onClick={(e) => toggleComplete(e, task)}>
            {task.status === 'done' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
          </button>
          <div className="task-info">
            <h4 className="task-title">{task.title}</h4>
            <div className="task-meta">
              <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
              {task.due_date && (
                <span className="meta-item"><Clock size={12} /> {new Date(task.due_date).toLocaleDateString()}</span>
              )}
              {task.tags?.length > 0 && (
                <div className="meta-item">
                  <Tag size={12} />
                  {task.tags.map(tag => (<span key={tag} className="tag">#{tag}</span>))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      <ConfirmModal 
        isOpen={showDeleteConfirm}
        title="Delete Task?"
        message="Are you sure you want to delete this task? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setTaskToDelete(null); }}
        confirmText="Delete Task"
        type="danger"
      />
    </div>
  );
};

export default TaskList;
