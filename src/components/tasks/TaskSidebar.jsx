import React, { useEffect, useState } from 'react';
import { X, Clock, Tag, User, Trash2, CheckCircle2, AlertCircle, Calendar, AlignLeft, Info, Users, Send, StickyNote } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useTeams } from '../../contexts/TeamsContext';
import { useAuth } from '../../contexts/AuthContext';

const TaskSidebar = ({ task, isOpen, onClose }) => {
  const { deleteTask, updateTask, fetchTaskHistory, addPersonalNote, deletePersonalNote } = useTasks();
  const { teams, teamNotes, addDailyNote, fetchTeamNotes, deleteDailyNote } = useTeams();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayTask, setDisplayTask] = useState(task);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [personalNotes, setPersonalNotes] = useState([]);

  const assignedTeam = teams?.find(t => t.id === displayTask?.team_id);

  // Fetch notes when sidebar opens for a team task
  useEffect(() => {
    if (isOpen && displayTask?.team_id) {
      fetchTeamNotes(displayTask.team_id);
    }
  }, [isOpen, displayTask?.team_id, fetchTeamNotes]);

  // Fetch personal notes when sidebar opens for a non-team task
  useEffect(() => {
    if (isOpen && displayTask?.id && !assignedTeam) {
      fetchTaskHistory(displayTask.id).then(history => {
        const pNotes = history
          .filter(h => h.action === 'NOTE')
          .map(h => ({
            id: h.id,
            content: h.details?.content,
            created_at: h.created_at,
            user_id: h.user_id,
            user: {
              username: h.profiles?.username || user?.user_metadata?.username,
              avatar_url: h.profiles?.avatar_url,
              theme_color: h.profiles?.theme_color || '#3b82f6'
            }
          }));
        setPersonalNotes(pNotes);
      });
    }
  }, [isOpen, displayTask?.id, assignedTeam, fetchTaskHistory, user]);

  const taskNotes = (teamNotes[displayTask?.team_id] || []).filter(note => note.task_id === displayTask?.id);
  const activeNotes = assignedTeam ? taskNotes : personalNotes;

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || submittingNote) return;
    setSubmittingNote(true);
    
    if (assignedTeam) {
      const { error } = await addDailyNote(displayTask.team_id, noteContent, displayTask.id);
      if (!error) setNoteContent('');
    } else {
      const { data, error } = await addPersonalNote(displayTask.id, noteContent);
      if (!error && data) {
        setPersonalNotes(prev => [{
          id: data.id,
          content: data.details?.content,
          created_at: data.created_at,
          user_id: data.user_id,
          user: {
            username: data.profiles?.username || user?.user_metadata?.username || 'You',
            avatar_url: data.profiles?.avatar_url,
            theme_color: data.profiles?.theme_color || '#3b82f6'
          }
        }, ...prev]);
        setNoteContent('');
      }
    }
    setSubmittingNote(false);
  };

  const handleDeleteNote = async (noteId) => {
    if (assignedTeam) {
      await deleteDailyNote(noteId);
    } else {
      await deletePersonalNote(noteId);
      setPersonalNotes(prev => prev.filter(n => n.id !== noteId));
    }
  };

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
        <div className="sidebar-header" style={{ paddingBottom: 0, borderBottom: 'none' }}>
          <div className="header-top" style={{ display: 'flex', width: '100%' }}>
            <div className="header-actions-right" style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
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
        </div>

        <div className="sidebar-content">
          <div className="task-main-heading" style={{ marginBottom: '24px' }}>
            <h2 className="sidebar-title" style={{ marginTop: 0, marginBottom: '12px', fontSize: '1.5rem' }}>{displayTask?.title}</h2>
            <span className={`priority-pill ${displayTask?.priority}`} style={{ display: 'inline-flex' }}>
              {displayTask?.priority}
            </span>
          </div>

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

          {assignedTeam && (
            <div className="detail-section">
              <h3 className="section-label">
                <Users size={16} /> Assigned Team
              </h3>
              <div className="team-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div 
                  className="team-color-dot" 
                  style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: assignedTeam.color || '#3b82f6' }}
                />
                <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>{assignedTeam.name}</span>
              </div>
            </div>
          )}

          <div className="detail-section">
            <h3 className="section-label" style={{ marginBottom: '16px' }}>
              <StickyNote size={16} /> Daily Notes
            </h3>
            
            <div className="daily-notes-container" style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px' }}>
              <div className="notes-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
                {activeNotes.length === 0 ? (
                  <div className="empty-state mini" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '0.9rem' }}>No daily notes for this task yet.</p>
                  </div>
                ) : (
                  activeNotes.map(note => (
                    <div key={note.id} className="daily-note-item" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', position: 'relative' }}>
                      <div className="note-user-info" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div 
                          className="note-user-avatar" 
                          style={{ 
                            width: '24px', height: '24px', borderRadius: '50%', 
                            backgroundColor: note.user?.theme_color || '#3b82f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', overflow: 'hidden'
                          }}
                        >
                          {note.user?.avatar_url ? (
                            <img src={note.user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            note.user?.username?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        <div className="note-meta-details" style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flex: 1 }}>
                          <span className="note-username" style={{ fontWeight: '600', fontSize: '0.85rem' }}>{note.user?.username}</span>
                          <span className="note-time" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {note.user_id === user?.id && (
                          <button 
                            className="delete-note-btn action-btn compact danger"
                            onClick={() => handleDeleteNote(note.id)}
                            title="Delete note"
                            style={{ padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        </div>
                        <p className="note-content" style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {note.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddNote} className="note-input-form" style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Add a daily note..."
                    className="form-input"
                    disabled={submittingNote}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                  <button 
                    type="submit" 
                    className="primary-btn" 
                    disabled={!noteContent.trim() || submittingNote}
                    style={{ padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Send size={18} />
                  </button>
                </form>
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
