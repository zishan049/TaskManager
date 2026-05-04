import React, { useState, useEffect } from 'react';
import { X, Calendar, Tag, AlignLeft, CheckCircle2, Plus, Flag, Users, ArrowLeft, Clock } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useTeams } from '../../hooks/useTeams';

const QuickAdd = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [isTimeFocused, setIsTimeFocused] = useState(false);
  const [tags, setTags] = useState('');
  const [team, setTeam] = useState('none');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const { addTask } = useTasks();
  const { teams, createTeam } = useTeams();
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
    if (isOpen) {
      setTitle(''); setDescription(''); setPriority('medium');
      setDueDate(''); setDueTime(''); setTags(''); setTeam('none');
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
      const { error } = await addTask({ 
        title, 
        description, 
        priority, 
        due_date: dueDate || null, 
        due_time: parseTime(dueTime, hour12) || null,
        tags: tagList, 
        team_id: targetTeamId 
      });
      if (error) throw error;
      onClose();
    } catch (err) {
      console.error("Creation Error:", err);
      setErrorMsg(err.message || 'Failed to create task/team');
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hours = Math.floor(i / 2);
    const minutes = i % 2 === 0 ? '00' : '30';
    const time24 = `${hours.toString().padStart(2, '0')}:${minutes}`;
    return formatTime(time24, hour12);
  });

  const filteredTimeOptions = timeOptions.filter(t => t.includes(dueTime));

  return (
    <div className={`task-panel-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="task-panel-dropdown" onClick={e => e.stopPropagation()}>
        <div className="panel-header" style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 100 }}>
          <button onClick={onClose} className="close-btn" style={{ padding: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.2s' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="task-form" style={{ padding: '1rem 1rem 0.75rem 1rem', gap: '0.75rem' }}>
          <div className="form-main" style={{ gap: '0.5rem' }}>
            <input autoFocus type="text" placeholder="What needs to be done?" className="title-input" value={title} onChange={e => setTitle(e.target.value)} required style={{ marginTop: '0.25rem', fontSize: '1.05rem', marginRight: '42px' }} />

            <div className="input-group">
              <label className="input-label" style={{ marginBottom: '0.2rem' }}><AlignLeft size={14} /> Description</label>
              <textarea placeholder="Add details..." value={description} onChange={e => setDescription(e.target.value)} rows={2} className="description-area" style={{ padding: '0.5rem' }} />
            </div>
          </div>
          <div className="form-sidebar" style={{ gap: '0.5rem', padding: '0.6rem' }}>
            <div className="setting-item">
              <label style={{ marginBottom: '0.2rem' }}><Calendar size={14} /> Due Date</label>
              <div className="input-container">
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="modern-input" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }} />
              </div>
            </div>

            <div className="setting-item">
              <label style={{ marginBottom: '0.2rem' }}><Tag size={14} /> Tags</label>
              <div className="input-container">
                <input type="text" placeholder="Design..." value={tags} onChange={e => setTags(e.target.value)} className="modern-input" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem' }} />
              </div>
            </div>

            <div className="setting-item" style={{ gridColumn: 'span 2' }}>
              <label style={{ marginBottom: '0.2rem' }}><Clock size={14} /> Due Time</label>
              <div className="input-container" style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder={hour12 ? "HH:MM AM/PM" : "HH:MM"}
                  value={dueTime} 
                  onChange={e => setDueTime(e.target.value)} 
                  onFocus={() => setIsTimeFocused(true)}
                  onBlur={() => setTimeout(() => setIsTimeFocused(false), 200)}
                  className="modern-input" 
                  style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.75rem', fontFamily: 'var(--font-digital)', letterSpacing: '1px' }} 
                />
                {isTimeFocused && (
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 'calc(100% + 4px)', 
                    left: 0, 
                    right: 0, 
                    background: 'var(--surface-color)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '10px', 
                    maxHeight: '140px', 
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
                        onClick={() => setDueTime(t)}
                        style={{ 
                          padding: '6px 12px', 
                          textAlign: 'left', 
                          background: 'transparent', 
                          border: 'none', 
                          color: 'var(--text-primary)', 
                          fontSize: '0.8rem',
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
                    <select className="modern-input" value={team} onChange={e => { if (e.target.value === 'new') { setIsCreatingTeam(true); } else { setTeam(e.target.value); } }} style={{ appearance: 'none', padding: '0.6rem 0.75rem', fontSize: '0.85rem' }}>
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
          <div className="priority-section" style={{ gap: '0.4rem' }}>
            <label className="input-label" style={{ marginBottom: '0.1rem' }}><Flag size={14} /> Priority Level</label>
            <div className="priority-grid">
              {['low', 'medium', 'high'].map(p => (
                <button key={p} type="button" className={`priority-card ${p} ${priority === p ? 'active' : ''}`} onClick={() => setPriority(p)} style={{ padding: '0.4rem' }}>
                  <div className="dot"></div><span className="capitalize" style={{ fontSize: '0.85rem' }}>{p}</span>
                </button>
              ))}
            </div>
          </div>
          {errorMsg && (
            <div style={{ color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px' }}>{errorMsg}</div>
          )}
          <button type="submit" className={`submit-btn ${loading ? 'loading' : ''}`} disabled={loading || !title.trim()} style={{ padding: '0.75rem', marginTop: '0.25rem' }}>
            {loading ? <div className="spinner"></div> : <><CheckCircle2 size={18} /><span>Create Task</span></>}
          </button>
        </form>

      </div>
    </div>
  );
};

export default QuickAdd;
