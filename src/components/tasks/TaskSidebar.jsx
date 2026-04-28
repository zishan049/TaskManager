import React, { useEffect, useState } from 'react';
import { X, Clock, Tag, User, Trash2, CheckCircle2, AlertCircle, Calendar, AlignLeft, Info } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';

const TaskSidebar = ({ task, isOpen, onClose }) => {
  const { deleteTask, updateTask } = useTasks();
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayTask, setDisplayTask] = useState(task);

  // Update displayTask when task changes, but only if it's not null
  // This allows the sidebar to keep showing data while it slides out
  useEffect(() => {
    if (task) {
      setDisplayTask(task);
    }
  }, [task]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);


  const handleDelete = async () => {
    if (displayTask && window.confirm('Are you sure you want to delete this task?')) {
      setIsDeleting(true);
      const { error } = await deleteTask(displayTask.id);
      if (!error) onClose();
      setIsDeleting(false);
    }
  };

  const toggleStatus = async () => {
    if (!displayTask) return;
    const newStatus = displayTask.status === 'done' ? 'todo' : 'done';
    await updateTask(displayTask.id, { 
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    });
  };

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
      />
      <div className={`task-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="header-top">
            <span className={`priority-pill ${displayTask?.priority}`}>
              {displayTask?.priority}
            </span>
            
            <div className="header-actions-right">
              <button 
                className={`action-btn compact ${displayTask?.status === 'done' ? 'completed' : ''}`}
                onClick={toggleStatus}
              >
                <CheckCircle2 size={16} />
                <span className="btn-text">{displayTask?.status === 'done' ? 'Completed' : 'Done'}</span>
              </button>
              <button 
                className="action-btn compact danger" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 size={16} />
              </button>
              <div className="header-divider"></div>
              <button onClick={onClose} className="close-sidebar-btn" aria-label="Close sidebar">
                <X size={20} />
              </button>
            </div>
          </div>
          
          <h2 className="sidebar-title">{displayTask?.title}</h2>
        </div>

        <div className="sidebar-content">
          <div className="detail-section">
            <h3 className="section-label">
              <AlignLeft size={16} /> Description
            </h3>
            <p className="description-text">
              {displayTask?.description || "No description provided."}
            </p>
          </div>

          <div className="detail-section">
            <h3 className="section-label">
              <Info size={16} /> Task Details
            </h3>
            <div className="meta-grid">
              <div className="meta-box">
                <Calendar size={18} className="meta-icon" />
                <div className="meta-info">
                  <span className="label">Due Date</span>
                  <span className="value">
                    {displayTask?.due_date ? new Date(displayTask.due_date).toLocaleDateString() : 'No date'}
                  </span>
                </div>
              </div>

              <div className="meta-box">
                <User size={18} className="meta-icon" />
                <div className="meta-info">
                  <span className="label">Created By</span>
                  <span className="value">{displayTask?.creator_username || 'System'}</span>
                </div>
              </div>

              <div className="meta-box">
                <Clock size={18} className="meta-icon" />
                <div className="meta-info">
                  <span className="label">Created At</span>
                  <span className="value">
                    {displayTask?.created_at ? new Date(displayTask.created_at).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>

              {displayTask?.completed_at && (
                <div className="meta-box success">
                  <CheckCircle2 size={18} className="meta-icon" />
                  <div className="meta-info">
                    <span className="label">Completed On</span>
                    <span className="value">
                      {new Date(displayTask.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {displayTask?.tags?.length > 0 && (
            <div className="detail-section">
              <h3 className="section-label">
                <Tag size={16} /> Tags
              </h3>
              <div className="tag-cloud">
                {displayTask.tags.map(tag => (
                  <span key={tag} className="sidebar-tag">#{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TaskSidebar;
