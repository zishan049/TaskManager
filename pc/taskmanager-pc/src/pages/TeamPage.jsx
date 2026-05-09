import React, { useState, useEffect } from 'react';
import { useTeams } from '../hooks/useTeams';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../contexts/AuthContext';
import { Users, UserPlus, Trash2, Send, MessageSquare, Plus, Hash, X, Check, Image as ImageIcon, Loader2, Eraser, ClipboardList, LogOut, Bell, UserX } from 'lucide-react';

import TeamTasksSidebar from '../components/teams/TeamTasksSidebar';
import ConfirmModal from '../components/ui/ConfirmModal';

const TeamPage = () => {
  const { user } = useAuth();
  const { teams, invites, loading, createTeam, deleteTeam, inviteToTeam, acceptInvite, declineInvite, sendMessage, clearTeamMessages, uploadTeamFile, kickMember, leaveTeam, presence } = useTeams();

  const { tasks } = useTasks();
  const [activeTeamId, setActiveTeamId] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInviteSuccess, setShowInviteSuccess] = useState(false);
  const [showMembersHud, setShowMembersHud] = useState(false);
  const [showTeamTasks, setShowTeamTasks] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteTeamConfirm, setShowDeleteTeamConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [showKickConfirm, setShowKickConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [memberToKick, setMemberToKick] = useState(null);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);

  const [mentionIndex, setMentionIndex] = useState(-1);
  const fileInputRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const activeTeam = teams.find(t => t.id === activeTeamId) || (teams.length > 0 ? teams[0] : null);
  const teamTasks = tasks.filter(t => t.team_id === activeTeam?.id);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { if (activeTeam?.messages) scrollToBottom(); }, [activeTeam?.messages]);
  useEffect(() => { if (activeTeam && !activeTeamId) setActiveTeamId(activeTeam.id); }, [activeTeam, activeTeamId]);

  const handleCreateTeam = async (e) => { e.preventDefault(); if (!newTeamName.trim()) return; await createTeam(newTeamName); setNewTeamName(''); setShowCreateModal(false); };
  const handleInvite = async (e) => { e.preventDefault(); if (!inviteEmail.trim() || !activeTeam) return; const { error } = await inviteToTeam(activeTeam.id, inviteEmail); if (error) { alert(error.message); } else { setInviteEmail(''); setShowInviteModal(false); setShowInviteSuccess(true); } };
  
  const handleDeleteTeam = async () => { 
    if (!teamToDelete) return;
    const { error } = await deleteTeam(teamToDelete); 
    if (error) alert('Error: ' + error.message); 
    else if (activeTeamId === teamToDelete) setActiveTeamId(null); 
    setShowDeleteTeamConfirm(false);
    setTeamToDelete(null);
  };

  const handleClearChat = async () => { 
    await clearTeamMessages(activeTeam.id); 
    setShowClearChatConfirm(false);
  };

  const handleLeaveTeam = async () => {
    if (!activeTeamId) return;
    const { error } = await leaveTeam(activeTeamId);
    if (error) alert('Error: ' + error.message);
    else setActiveTeamId(null);
    setShowLeaveConfirm(false);
  };

  const handleSendMessage = async (e) => { 
    if (e) e.preventDefault(); 
    if (!message.trim() || !activeTeamId) return; 

    let metadata = {};
    const mentionMatch = message.match(/@(\w+)/);
    if (mentionMatch) {
      const mentionedUsername = mentionMatch[1];
      const mentionedMember = activeTeam.members?.find(m => m.username.toLowerCase() === mentionedUsername.toLowerCase());
      if (mentionedMember) {
        metadata = {
          type: 'ping',
          pinged_user_id: mentionedMember.user_id
        };
      }
    }

    if (sendMessage) await sendMessage(activeTeamId, message, metadata); 
    setMessage(''); 
    setMentionSuggestions([]);
  };
  
  const handlePingUser = async (memberId, username) => {
    if (!activeTeamId || !sendMessage) return;
    await sendMessage(activeTeamId, `@${username} 🔔 PING!`, { 
      type: 'ping', 
      pinged_user_id: memberId 
    });
    setShowMembersHud(false);
  };

  const handleKickMember = async () => { 
    if (!activeTeamId || !memberToKick) return; 
    const { error } = await kickMember(activeTeamId, memberToKick); 
    if (error) alert('Error: ' + error.message); 
    setShowKickConfirm(false);
    setMemberToKick(null);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeTeamId) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image.'); return; }
    try {
      setIsUploading(true);
      if (file.size > 500 * 1024) { alert('Max 500KB.'); return; }
      const { publicUrl, error } = await uploadTeamFile(file);
      if (error) throw error;
      if (sendMessage) await sendMessage(activeTeamId, 'Sent an image', { image_url: publicUrl });
    } catch (err) { alert('Upload error: ' + err.message); }
    finally { setIsUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) { if (item.type.startsWith('image/')) { const file = item.getAsFile(); if (file) await handleFileSelect({ target: { files: [file] } }); } }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessage(val);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch && activeTeam?.members) {
      const query = mentionMatch[1].toLowerCase();
      const suggestions = activeTeam.members
        .filter(m => m.user_id !== user.id && m.username.toLowerCase().startsWith(query))
        .map(m => m.username);
      setMentionSuggestions(suggestions);
      setMentionIndex(0);
    } else {
      setMentionSuggestions([]);
    }
  };

  const handleSuggestionClick = (username) => {
    const cursorPosition = inputRef.current.selectionStart;
    const textBeforeCursor = message.slice(0, cursorPosition);
    const textAfterCursor = message.slice(cursorPosition);
    const newTextBefore = textBeforeCursor.replace(/@(\w*)$/, `@${username} `);
    setMessage(newTextBefore + textAfterCursor);
    setMentionSuggestions([]);
    inputRef.current.focus();
  };

  const handleKeyDown = (e) => {
    if (mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % mentionSuggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSuggestionClick(mentionSuggestions[mentionIndex]);
      } else if (e.key === 'Escape') {
        setMentionSuggestions([]);
      }
    }
  };

  const renderMessageContent = (content) => {
    if (!content) return null;
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);
        const isMember = activeTeam.members?.some(m => m.username.toLowerCase() === username.toLowerCase());
        if (isMember) {
          return <span key={i} className="mention">@{username}</span>;
        }
      }
      return part;
    });
  };

  if (loading) return (<div className="loading-screen"><div className="loader"></div><p className="text-secondary text-sm">Loading teams...</p></div>);

  return (
    <div className={`team-container page-enter ${showTeamTasks ? 'show-tasks' : ''}`}>
      <aside className="teams-sidebar show">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} className="accent-glow" /><h3 className="sidebar-title">Teams</h3>
          </div>
          <button className="add-team-btn" onClick={() => setShowCreateModal(true)}><Plus size={18} /></button>
        </div>
        <div className="team-list">
          {invites?.length > 0 && (
            <div className="invites-section" style={{ marginBottom: '1rem' }}>
              <div style={{ padding: '0 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pending Invites ({invites.length})</div>
              {invites.map(invite => (
                <div key={invite.id} className="team-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Hash size={16} color={invite.teams?.color || 'var(--text-tertiary)'} /><span className="truncate">{invite.teams?.name || 'Unknown'}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '24px' }}>from @{invite.inviter?.username || 'someone'}</span>
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => acceptInvite(invite.id, invite.team_id)}><Check size={14} /> Accept</button>
                    <button className="btn" style={{ flex: 1, background: 'var(--surface-2)' }} onClick={() => declineInvite(invite.id)}><X size={14} /> Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: '0 1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Your Teams</div>
          {teams.length === 0 ? (<div className="empty-state"><p className="text-secondary text-xs">No teams yet</p></div>) : (
            teams.map(team => (
              <div key={team.id} className={`team-item ${activeTeamId === team.id ? 'active' : ''}`} onClick={() => setActiveTeamId(team.id)}>
                <Hash size={16} color={activeTeamId === team.id ? 'var(--primary-accent)' : (team.color || '#64748b')} /><span className="truncate">{team.name}</span>
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
                  <h3 className={`chat-title clickable ${showMembersHud ? 'active' : ''}`} onClick={() => setShowMembersHud(!showMembersHud)}>{activeTeam.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setShowMembersHud(!showMembersHud)}>
                    <span className="member-count"><Users size={12} /> {activeTeam.members?.length || 1} members</span>
                    <span className="text-tertiary" style={{ fontSize: '0.75rem' }}>• Created by @{activeTeam.creator?.username || 'unknown'}</span>
                  </div>
                </div>
                {showMembersHud && (
                  <div className="members-hud slide-in-top">
                    <div className="hud-header"><span className="hud-title">Team Members</span><button className="hud-close" onClick={() => setShowMembersHud(false)}><X size={14} /></button></div>
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
                            <div className="member-actions">
                              {member.user_id !== user.id && (
                                <button className="ping-btn" onClick={() => handlePingUser(member.user_id, member.username)} title="Ping user">
                                  <Bell size={16} />
                                </button>
                              )}
                              {activeTeam.created_by === user.id && member.user_id !== user.id && (
                                <button className="kick-btn" onClick={() => { setMemberToKick(member.user_id); setShowKickConfirm(true); }} title="Kick member">
                                  <UserX size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="chat-actions">
                {teamTasks.length > 0 && (
                  <button className={`nav-link-btn ${showTeamTasks ? 'active' : ''}`} onClick={() => setShowTeamTasks(true)} title="View Tasks">
                    <ClipboardList size={18} /><span className="task-count-badge">{teamTasks.length}</span>
                  </button>
                )}
                <button className="nav-link-btn" onClick={() => setShowInviteModal(true)} title="Invite"><UserPlus size={18} /></button>
                {activeTeam.messages?.some(m => m.user_id === user.id) && (<button className="nav-link-btn danger" onClick={() => setShowClearChatConfirm(true)} title="Clear"><Eraser size={18} /></button>)}
                {activeTeam.created_by === user.id ? (
                  <button className="nav-link-btn danger" onClick={() => { setTeamToDelete(activeTeam.id); setShowDeleteTeamConfirm(true); }} title="Delete Team"><Trash2 size={18} /></button>
                ) : (
                  <button className="nav-link-btn danger" onClick={() => setShowLeaveConfirm(true)} title="Leave Team"><LogOut size={18} /></button>
                )}
              </div>

            </div>
            <div className="chat-messages">
              {activeTeam.messages?.length > 0 ? (
                <>
                  {activeTeam.messages.map(msg => {
                    const isMe = msg.user_id === user.id;
                    const isSystem = msg.metadata?.type === 'system';
                    const isPinged = msg.metadata?.type === 'ping' && msg.metadata?.pinged_user_id === user.id;
                    const userColor = msg.user_metadata?.theme_color || 'var(--primary-accent)';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="system-msg">
                          <span className="system-msg-content">{renderMessageContent(msg.content)}</span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`msg ${isMe ? 'sent' : 'received'} ${isPinged ? 'pinged-msg' : ''}`} style={{ '--bubble-color': userColor, borderLeft: !isMe ? `3px solid ${userColor}` : 'none', borderRight: isMe ? `3px solid ${userColor}` : 'none' }}>
                        <span className="msg-user" style={{ color: isMe ? 'rgba(255,255,255,0.9)' : userColor, fontWeight: 900, fontSize: '0.65rem', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                          {msg.user_metadata?.username || (isMe ? 'You' : 'Member')}
                        </span>
                        {msg.metadata?.image_url && <img src={msg.metadata.image_url} alt="Shared" className="msg-img" onClick={() => window.open(msg.metadata.image_url, '_blank')} />}
                        <p>{renderMessageContent(msg.content)}</p>
                      </div>
                    );

                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="empty-chat"><MessageSquare size={48} className="text-tertiary" style={{ opacity: 0.2 }} /><p className="text-secondary">Start the conversation</p></div>
              )}
            </div>
            <div className="chat-input-area" onPaste={handlePaste}>
              <form onSubmit={handleSendMessage} className="chat-form">
                <div className="chat-input-wrapper">
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileSelect} />
                  <button type="button" className="nav-link-btn" style={{ border: 'none', background: 'transparent', width: '32px', padding: 0 }} onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 size={18} className="spin" /> : <ImageIcon size={18} />}
                  </button>
                  <input 
                    ref={inputRef}
                    type="text" 
                    value={message} 
                    onChange={handleInputChange} 
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..." 
                  />
                  {mentionSuggestions.length > 0 && (
                    <div className="mention-suggestions">
                      {mentionSuggestions.map((suggestion, i) => (
                        <div 
                          key={suggestion} 
                          className={`suggestion-item ${i === mentionIndex ? 'active' : ''}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          @{suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button type="submit" className="send-btn" disabled={!message.trim() || isUploading}><Send size={18} /></button>
              </form>
            </div>
          </>
        ) : (
          <div className="empty-chat" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <div className="accent-glow" style={{ padding: '40px', background: 'rgba(var(--primary-accent-rgb), 0.05)', borderRadius: '50%' }}>
              <Users size={64} className="accent" style={{ opacity: 0.5 }} />
            </div>
            <h2 className="text-primary" style={{ fontWeight: 800, fontSize: '1.5rem' }}>Select a Team</h2>
            <p className="text-tertiary" style={{ maxWidth: '300px', textAlign: 'center' }}>Choose a team from the sidebar.</p>
          </div>
        )}
      </main>

      {(showCreateModal || showInviteModal) && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setShowInviteModal(false); }}>
          <div className="modal slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{showCreateModal ? 'Create New Team' : 'Invite Member'}</h2>
              <button className="nav-link" onClick={() => { setShowCreateModal(false); setShowInviteModal(false); }}><X size={20} /></button>
            </div>
            <form onSubmit={showCreateModal ? handleCreateTeam : handleInvite} className="auth-form" style={{ marginTop: '1.5rem' }}>
              <div className="input-field">
                <label>{showCreateModal ? 'Team Name' : 'Username or Email'}</label>
                <div className="input-wrapper">
                  <input type="text" value={showCreateModal ? newTeamName : inviteEmail} onChange={e => showCreateModal ? setNewTeamName(e.target.value) : setInviteEmail(e.target.value)} required placeholder={showCreateModal ? "Enter team name" : "Enter username or email"} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>{showCreateModal ? 'Create Team' : 'Send Invitation'}</button>
            </form>
          </div>
        </div>
      )}

      <TeamTasksSidebar team={activeTeam} tasks={teamTasks} isOpen={showTeamTasks} onClose={() => setShowTeamTasks(false)} />

      <ConfirmModal 
        isOpen={showDeleteTeamConfirm}
        title="Delete Team?"
        message="Are you sure you want to delete this team? This will remove all members and messages. This action cannot be undone."
        onConfirm={handleDeleteTeam}
        onCancel={() => { setShowDeleteTeamConfirm(false); setTeamToDelete(null); }}
        confirmText="Delete Team"
        type="danger"
      />

      <ConfirmModal 
        isOpen={showClearChatConfirm}
        title="Clear Chat?"
        message="Are you sure you want to clear all your messages in this team? This action cannot be undone."
        onConfirm={handleClearChat}
        onCancel={() => setShowClearChatConfirm(false)}
        confirmText="Clear Chat"
        type="danger"
      />
      <ConfirmModal 
        isOpen={showKickConfirm}
        title="Kick Member?"
        message="Are you sure you want to remove this member from the team?"
        onConfirm={handleKickMember}
        onCancel={() => { setShowKickConfirm(false); setMemberToKick(null); }}
        confirmText="Kick Member"
        type="danger"
      />
      <ConfirmModal 
        isOpen={showLeaveConfirm}
        title="Leave Team?"
        message="Are you sure you want to leave this team? You will no longer have access to its messages or tasks unless invited back."
        onConfirm={handleLeaveTeam}
        onCancel={() => setShowLeaveConfirm(false)}
        confirmText="Leave Team"
        type="danger"
      />

      <ConfirmModal 
        isOpen={showInviteSuccess}
        title="Invite Sent!"
        message={`An invitation has been successfully sent to ${inviteEmail || 'the user'}.`}
        onConfirm={() => { setShowInviteSuccess(false); setInviteEmail(''); }}
        confirmText="Got it"
        type="success"
        singleButton={true}
      />
    </div>
  );
};

export default TeamPage;
