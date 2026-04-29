import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, AlignLeft, CheckCircle2, Plus, Flag, Users, ArrowLeft } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useTeams } from '../../hooks/useTeams';

const QuickAdd = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [team, setTeam] = useState('none');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const { addTask } = useTasks();
  const { teams, createTeam } = useTeams();

  useEffect(() => {
    if (isOpen) {
      setTitle(''); setDescription(''); setPriority('medium');
      setDueDate(''); setTags(''); setTeam('none');
      setIsCreatingTeam(false); setNewTeamName('');
    }
  }, [isOpen]);

  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setErrorMsg('');
    let targetTeamId = (team && team !== 'none') ? team : null;
    try {
      if (isCreatingTeam && newTeamName.trim()) {
        const { data: createdTeam, error: teamError } = await createTeam(newTeamName.trim());
        if (teamError) throw teamError;
        targetTeamId = createdTeam.id;
      }
      const tagList = tags.split(',').map(t => t.trim()).filter(t => t !== '');
      const { error } = await addTask({ title, description, priority, due_date: dueDate || null, tags: tagList, team_id: targetTeamId });
      if (error) throw error;
      onClose();
    } catch (err) {
      console.error("Creation Error:", err);
      setErrorMsg(err.message || 'Failed to create task/team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`task-panel-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="task-panel-dropdown" onClick={e => e.stopPropagation()}>
        <div className="panel-header" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="close-btn"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-main">
            <input autoFocus type="text" placeholder="What needs to be done?" className="title-input" value={title} onChange={e => setTitle(e.target.value)} required />
            <div className="input-group">
              <label className="input-label"><AlignLeft size={14} /> Description</label>
              <textarea placeholder="Add more context or details..." value={description} onChange={e => setDescription(e.target.value)} rows={3} className="description-area" />
            </div>
          </div>
          <div className="form-sidebar">
            <div className="setting-item">
              <label><Calendar size={14} /> Due Date</label>
              <div className="input-container">
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="modern-input" />
              </div>
            </div>
            <div className="setting-item">
              <label><Tag size={14} /> Tags</label>
              <div className="input-container">
                <input type="text" placeholder="Design, Dev..." value={tags} onChange={e => setTags(e.target.value)} className="modern-input" />
              </div>
            </div>
            <div className="setting-item" style={{ gridColumn: 'span 2' }}>
              <label><Users size={14} /> {isCreatingTeam ? 'New Team Name' : 'Assign to Team'}</label>
              <div className="input-container">
                {isCreatingTeam ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="modern-input" placeholder="Enter team name..." value={newTeamName} onChange={e => setNewTeamName(e.target.value)} autoFocus />
                    <button type="button" className="close-btn" onClick={() => { setIsCreatingTeam(false); setTeam('none'); }} style={{ padding: '0 12px' }}><ArrowLeft size={16} /></button>
                  </div>
                ) : (
                  <>
                    <select className="modern-input" value={team} onChange={e => { if (e.target.value === 'new') { setIsCreatingTeam(true); } else { setTeam(e.target.value); } }} style={{ appearance: 'none' }}>
                      <option value="none">No Team (Personal)</option>
                      {teams?.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                      <option value="new" style={{ color: 'var(--primary-accent)', fontWeight: 600 }}>+ Add New Team</option>
                    </select>
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}><Plus size={14} style={{ transform: 'rotate(45deg)' }} /></div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="priority-section">
            <label className="input-label"><Flag size={14} /> Priority Level</label>
            <div className="priority-grid">
              {['low', 'medium', 'high'].map(p => (
                <button key={p} type="button" className={`priority-card ${p} ${priority === p ? 'active' : ''}`} onClick={() => setPriority(p)}>
                  <div className="dot"></div><span className="capitalize">{p}</span>
                </button>
              ))}
            </div>
          </div>
          {errorMsg && (
            <div style={{ color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{errorMsg}</div>
          )}
          <button type="submit" className={`submit-btn ${loading ? 'loading' : ''}`} disabled={loading || !title.trim()}>
            {loading ? <div className="spinner"></div> : <><CheckCircle2 size={20} /><span>Create Task</span></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickAdd;
