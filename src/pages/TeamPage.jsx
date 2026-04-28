import React, { useState, useEffect } from 'react';
import { useTeams } from '../hooks/useTeams';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../contexts/AuthContext';
import { Users, UserPlus, Trash2, Send, MessageSquare, Plus, Hash, X, Check, Image as ImageIcon, Paperclip, Loader2, Eraser, ClipboardList } from 'lucide-react';
import TeamTasksSidebar from '../components/teams/TeamTasksSidebar';

const TeamPage = () => {
  const { user } = useAuth();
  const { 
    teams, invites, loading, 
    createTeam, deleteTeam, inviteToTeam, 
    acceptInvite, declineInvite, sendMessage, 
    clearTeamMessages, uploadTeamFile, kickMember,
    presence 
  } = useTeams();
  const { tasks } = useTasks();
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMembersHud, setShowMembersHud] = useState(false);
  const [showTeamTasks, setShowTeamTasks] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  // Removed redundant useTeams call

  const activeTeam = teams.find(t => t.id === activeTeamId) || (teams.length > 0 ? teams[0] : null);
  const teamTasks = tasks.filter(t => t.team_id === activeTeam?.id);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTeam?.messages) {
      scrollToBottom();
    }
  }, [activeTeam?.messages]);

  useEffect(() => {
    if (activeTeam && !activeTeamId) {
      setActiveTeamId(activeTeam.id);
    }
  }, [activeTeam, activeTeamId]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    await createTeam(newTeamName);
    setNewTeamName('');
    setShowCreateModal(false);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !activeTeam) return;
    const { error } = await inviteToTeam(activeTeam.id, inviteEmail);
    if (error) {
      alert(error.message);
    } else {
      alert('Invite sent successfully!');
      setInviteEmail('');
      setShowInviteModal(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      const { error } = await deleteTeam(teamId);
      if (error) {
        alert('Error deleting team: ' + error.message);
      } else {
        if (activeTeamId === teamId) setActiveTeamId(null);
      }
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Clear all your messages from this team? (Only your messages will be deleted from the database)')) {
      await clearTeamMessages(activeTeam.id);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!message.trim() || !activeTeamId) return;
    
    if (sendMessage) {
      await sendMessage(activeTeamId, message);
    }
    setMessage('');
  };

  const handleKickMember = async (userId) => {
    if (!activeTeamId) return;
    const { error } = await kickMember(activeTeamId, userId);
    if (error) {
      alert('Error kicking member: ' + error.message);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeTeamId) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    try {
      setIsUploading(true);
      
      const MAX_SIZE = 500 * 1024;
      if (file.size > MAX_SIZE) {
        alert('File is too large. Maximum size is 500KB.');
        return;
      }

      const { publicUrl, error } = await uploadTeamFile(file);
      
      if (error) throw error;

      if (sendMessage) {
        await sendMessage(activeTeamId, `Sent an image`, { image_url: publicUrl });
      }
    } catch (err) {
      alert('Error uploading image: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          await handleFileSelect({ target: { files: [file] } });
        }
      }
    }
  };

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(true);

  // Close sidebar on mobile when a team is selected
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (window.innerWidth < 768 && activeTeamId) {
      setIsMobileSidebarOpen(false);
    }
  }, [activeTeamId]);

  if (loading) return (
    <div className="loading-screen">
      <div className="loader"></div>
      <p className="text-secondary text-sm">Loading teams...</p>
    </div>
  );

  return (
    <div className={`team-container page-enter ${!isMobileSidebarOpen ? 'mobile-chat-active' : ''} ${showTeamTasks ? 'show-tasks' : ''}`}>
      <aside className={`teams-sidebar ${isMobileSidebarOpen ? 'show' : 'hide'}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} className="accent-glow" />
            <h3 className="sidebar-title">Teams</h3>
          </div>
          <button className="add-team-btn" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
          </button>
        </div>

        <div className="teams-list">
          {invites?.length > 0 && (
            <div className="invites-section" style={{ marginBottom: '1rem' }}>
              <div style={{ padding: '0 1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Pending Invites ({invites.length})
              </div>
              {invites.map(invite => (
                <div key={invite.id} className="team-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Hash size={16} color={invite.teams?.color || 'var(--text-tertiary)'} />
                    <span className="truncate">{invite.teams?.name || 'Unknown Team'}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '24px', marginTop: '-4px' }}>
                    from @{invite.inviter?.username || 'someone'}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1 }}
                      onClick={() => acceptInvite(invite.id, invite.team_id)}
                    >
                      <Check size={14} style={{ marginRight: '4px' }}/> Accept
                    </button>
                    <button 
                      className="btn" 
                      style={{ flex: 1, background: 'var(--surface-2)' }}
                      onClick={() => declineInvite(invite.id)}
                    >
                      <X size={14} style={{ marginRight: '4px' }}/> Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: '0 1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem', marginTop: invites?.length > 0 ? '1rem' : '0' }}>
            Your Teams
          </div>
          {teams.length === 0 ? (
            <div className="empty-state">
              <p className="text-secondary text-xs">No teams yet</p>
            </div>
          ) : (
            teams.map(team => (
              <div 
                key={team.id} 
                className={`team-item ${activeTeamId === team.id ? 'active' : ''}`}
                style={activeTeamId === team.id ? { '--accent': team.color || 'var(--primary-accent)' } : {}}
                onClick={() => setActiveTeamId(team.id)}
              >
                <Hash size={16} color={activeTeamId === team.id ? 'var(--primary-accent)' : (team.color || '#64748b')} />
                <span className="truncate">{team.name}</span>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="chat-container">
        {activeTeam ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3 
                    className={`chat-title clickable ${showMembersHud ? 'active' : ''}`}
                    onClick={() => setShowMembersHud(!showMembersHud)}
                  >
                    {activeTeam.name}
                  </h3>
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    onClick={() => setShowMembersHud(!showMembersHud)}
                  >
                    <span className="member-count">
                      <Users size={12} />
                      {activeTeam.members?.length || 1} members
                    </span>
                    <span className="text-tertiary" style={{ fontSize: '0.75rem' }}>
                      • Created by @{activeTeam.creator?.username || 'unknown'}
                    </span>
                  </div>
                </div>

                {/* Members HUD */}
                {showMembersHud && (
                  <div className="members-hud slide-in-top">
                    <div className="hud-header">
                      <span className="hud-title">Team Members</span>
                      <button className="hud-close" onClick={() => setShowMembersHud(false)}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className="hud-list">
                      {activeTeam.members?.map(member => {
                        const isOnline = !!presence[member.user_id];
                        return (
                          <div key={member.user_id} className="hud-member-item">
                            <div className="hud-member-info">
                              <div className="hud-member-avatar" style={{ '--theme': member.theme_color || 'var(--primary-accent)' }}>
                                {member.username.charAt(0).toUpperCase()}
                                <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></div>
                              </div>
                              <div className="hud-member-details">
                                <span className="hud-member-name">@{member.username} {member.user_id === user.id && '(You)'}</span>
                                <span className="hud-member-role">{member.role}</span>
                              </div>
                            </div>
                            {activeTeam.created_by === user.id && member.user_id !== user.id && (
                              <button 
                                className="kick-btn"
                                onClick={() => handleKickMember(member.user_id)}
                                title={`Kick @${member.username}`}
                              >
                                <X size={14} /> Kick
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="chat-actions">
                {teamTasks.length > 0 && (
                  <button 
                    className={`nav-link-btn ${showTeamTasks ? 'active' : ''}`}
                    onClick={() => setShowTeamTasks(true)}
                    title="View Team Tasks"
                  >
                    <ClipboardList size={18} />
                    <span className="task-count-badge">{teamTasks.length}</span>
                  </button>
                )}
                <button className="nav-link-btn" onClick={() => setShowInviteModal(true)} title="Invite Members">
                  <UserPlus size={18} />
                </button>
                {activeTeam.messages?.some(m => m.user_id === user.id) && (
                  <button className="nav-link-btn danger" onClick={handleClearChat} title="Clear My Messages">
                    <Eraser size={18} />
                  </button>
                )}
                {activeTeam.created_by === user.id && (
                  <button className="nav-link-btn danger" onClick={() => handleDeleteTeam(activeTeam.id)} title="Delete Team">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="chat-messages">
              {activeTeam.messages?.length > 0 ? (
                <>
                  {activeTeam.messages.map((msg) => {
                    const isMe = msg.user_id === user.id;
                    const userColor = msg.user_metadata?.theme_color || 'var(--primary-accent)';
                    
                    return (
                      <div 
                        key={msg.id} 
                        className={`msg ${isMe ? 'sent' : 'received'}`}
                        style={{ 
                          '--bubble-color': userColor,
                          borderLeft: !isMe ? `3px solid ${userColor}` : 'none',
                          borderRight: isMe ? `3px solid ${userColor}` : 'none'
                        }}
                      >
                        <span className="msg-user" style={{ 
                          color: isMe ? 'rgba(255, 255, 255, 0.9)' : userColor, 
                          fontWeight: 900, 
                          fontSize: '0.65rem', 
                          letterSpacing: '0.05em', 
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                          display: 'block',
                          filter: isMe ? 'none' : 'brightness(1.1)' 
                        }}>
                          {msg.user_metadata?.username || (isMe ? 'You' : 'Member')}
                        </span>
                        {msg.metadata?.image_url && (
                          <img src={msg.metadata.image_url} alt="Shared" className="msg-img" onClick={() => window.open(msg.metadata.image_url, '_blank')} />
                        )}
                        <p>{msg.content}</p>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="empty-chat">
                  <MessageSquare size={48} className="text-tertiary" style={{ opacity: 0.2 }} />
                  <p className="text-secondary">Start the conversation</p>
                </div>
              )}
            </div>

            <div className="chat-input-area" onPaste={handlePaste}>
              <form onSubmit={handleSendMessage} className="chat-form">
                <input 
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleFileSelect}
                />
                <button 
                  type="button" 
                  className="nav-link-btn" 
                  style={{ border: 'none', background: 'transparent', width: '32px' }}
                  onClick={triggerFileUpload}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 size={18} className="spin" /> : <ImageIcon size={18} />}
                </button>
                <input 
                  type="text" 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type a message..."
                />
                <button type="submit" className="send-btn" disabled={!message.trim() || isUploading}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="empty-chat" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <div className="accent-glow" style={{ padding: '40px', background: 'rgba(var(--primary-accent-rgb), 0.05)', borderRadius: '50%' }}>
              <Users size={64} className="accent" style={{ opacity: 0.5 }} />
            </div>
            <h2 className="text-primary" style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>Select a Team</h2>
            <p className="text-tertiary" style={{ maxWidth: '300px', textAlign: 'center' }}>Choose a team from the sidebar to start collaborating in real-time.</p>
          </div>
        )}
      </main>

      {/* Modals */}
      {(showCreateModal || showInviteModal) && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setShowInviteModal(false); }}>
          <div className="modal slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{showCreateModal ? 'Create New Team' : 'Invite Member'}</h2>
              <button className="nav-link" onClick={() => { setShowCreateModal(false); setShowInviteModal(false); }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreateTeam : handleInvite} className="auth-form" style={{ marginTop: '1.5rem' }}>
              <div className="input-field">
                <label>{showCreateModal ? 'Team Name' : 'Username or Email'}</label>
                <div className="input-wrapper">
                  <input 
                    type="text"
                    value={showCreateModal ? newTeamName : inviteEmail}
                    onChange={e => showCreateModal ? setNewTeamName(e.target.value) : setInviteEmail(e.target.value)}
                    required 
                    placeholder={showCreateModal ? "Enter team name" : "Enter username or email"}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                {showCreateModal ? 'Create Team' : 'Send Invitation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Team Tasks Sidebar */}
      <TeamTasksSidebar 
        team={activeTeam}
        tasks={teamTasks}
        isOpen={showTeamTasks}
        onClose={() => setShowTeamTasks(false)}
      />
    </div>
  );
};

export default TeamPage;
