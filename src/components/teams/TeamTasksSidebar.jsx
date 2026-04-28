import React, { useState, useEffect, useMemo } from 'react';
import { X, CheckCircle2, Circle, Clock, AlertCircle, Calendar, ClipboardList, ChevronRight, MessageSquare, Send, StickyNote } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useTeams } from '../../contexts/TeamsContext';
import { useAuth } from '../../contexts/AuthContext';
import { Trash2 } from 'lucide-react';
import TaskSidebar from '../tasks/TaskSidebar';

// Sub-component for individual notes to keep main render clean
const NoteItem = ({ note, currentUserId, onDelete }) => (
  <div className="daily-note-item">
    <div className="note-user-info">
      <div 
        className="note-user-avatar" 
        style={{ backgroundColor: note.user?.theme_color || '#3b82f6' }}
      >
        {note.user?.avatar_url ? (
          <img src={note.user.avatar_url} alt="" />
        ) : (
          note.user?.username?.[0]?.toUpperCase() || '?'
        )}
      </div>
      <div className="note-meta-details">
        <span className="note-username">{note.user?.username}</span>
        <span className="note-time">
          {new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      {note.user_id === currentUserId && (
        <button 
          className="delete-note-btn"
          onClick={() => onDelete(note.id)}
          title="Delete note"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
    <p className="note-content">{note.content}</p>
  </div>
);

const TeamTasksSidebar = ({ team, tasks, isOpen, onClose }) => {
  const { updateTask } = useTasks();
  const { user } = useAuth();
  const { teamNotes, addDailyNote, fetchTeamNotes, deleteDailyNote } = useTeams();
  const [selectedTask, setSelectedTask] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [taggedTaskId, setTaggedTaskId] = useState('');

  const activeNotes = teamNotes[team?.id] || [];

  const groupedNotes = useMemo(() => {
    const general = [];
    const taskGroups = {};

    activeNotes.forEach(note => {
      if (note.task_id) {
        if (!taskGroups[note.task_id]) {
          taskGroups[note.task_id] = {
            title: note.task?.title || 'Unknown Task',
            notes: []
          };
        }
        taskGroups[note.task_id].notes.push(note);
      } else {
        general.push(note);
      }
    });

    return { general, taskGroups };
  }, [activeNotes]);

  useEffect(() => {
    if (isOpen && team?.id) {
      fetchTeamNotes(team.id);
    }
  }, [isOpen, team?.id, fetchTeamNotes]);

  const toggleStatus = async (e, task) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await updateTask(task.id, { 
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    });
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || submittingNote) return;

    setSubmittingNote(true);
    const { error } = await addDailyNote(team.id, noteContent, taggedTaskId || null);
    if (!error) {
      setNoteContent('');
      setTaggedTaskId('');
    }
    setSubmittingNote(false);
  };

  if (!team) return null;

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
      />
      <div className={`task-sidebar team-tasks-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="header-top-minimal">
            <div className="header-title-center">
              <ClipboardList size={16} className="header-icon-mini" />
              <h2 className="sidebar-title-center">Tasks assigned to {team.name}</h2>
            </div>
            <button onClick={onClose} className="close-sidebar-btn-top" aria-label="Close sidebar">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">
            <div className="section-header">
              <ClipboardList size={16} />
              <h3>Tasks</h3>
            </div>
            <div className="section-scrollable">
              {tasks.length === 0 ? (
                <div className="empty-state mini">
                  <p>No active tasks.</p>
                </div>
              ) : (
                <div className="team-tasks-list">
                  {tasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`team-task-item ${task.status} clickable`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="task-item-main">
                        <button 
                          className={`task-status-toggle ${task.status}`}
                          onClick={(e) => toggleStatus(e, task)}
                        >
                          {task.status === 'done' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                        </button>
                        
                        <div className="task-item-content">
                          <div className="task-item-header">
                            <h4 className="task-item-title">{task.title}</h4>
                            <ChevronRight size={14} className="details-arrow" />
                          </div>
                          <div className="task-item-meta">
                            <span className={`priority-indicator ${task.priority}`}>
                              {task.priority === 'high' && <AlertCircle size={12} />}
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="section-header">
              <StickyNote size={16} />
              <h3>Daily Notes</h3>
            </div>
            <div className="section-scrollable">
              {activeNotes.length === 0 ? (
                <div className="empty-state mini">
                  <p>No work updates yet today.</p>
                </div>
              ) : (
                <div className="daily-notes-list">
                  {/* General Updates First */}
                  {groupedNotes.general.length > 0 && (
                    <div className="note-group">
                      <div className="note-group-header">General Updates</div>
                      {groupedNotes.general.map(note => (
                        <NoteItem 
                          key={note.id} 
                          note={note} 
                          currentUserId={user?.id}
                          onDelete={deleteDailyNote}
                        />
                      ))}
                    </div>
                  )}

                  {/* Task-specific Updates */}
                  {Object.entries(groupedNotes.taskGroups).map(([taskId, group]) => (
                    <div key={taskId} className="note-group">
                      <div className="note-group-header">
                        <ClipboardList size={12} />
                        {group.title}
                      </div>
                      {group.notes.map(note => (
                        <NoteItem 
                          key={note.id} 
                          note={note} 
                          currentUserId={user?.id}
                          onDelete={deleteDailyNote}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <form onSubmit={handleAddNote} className="note-input-container">
              <div className="note-input-wrapper">
                <select 
                  className="note-task-select"
                  value={taggedTaskId}
                  onChange={e => setTaggedTaskId(e.target.value)}
                  title="Tag a task"
                >
                  <option value="">No task</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
                <textarea 
                  placeholder="Update on your progress..." 
                  value={noteContent}
                  onChange={e => {
                    setNoteContent(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddNote(e);
                    }
                  }}
                  rows="1"
                  disabled={submittingNote}
                />
              </div>
              <button type="submit" disabled={!noteContent.trim() || submittingNote}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      <TaskSidebar 
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
};

export default TeamTasksSidebar;
