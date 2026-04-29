import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const TeamsContext = createContext({});

export const TeamsProvider = ({ children }) => {
  const [teams, setTeams] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [presence, setPresence] = useState({}); // { userId: true }
  const [teamNotes, setTeamNotes] = useState({}); // { teamId: [notes] }
  const { user, profile: currentUserProfile } = useAuth();

  const fetchTeams = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const { data: memberships, error: memberError } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', user.id);

      if (memberError) throw memberError;
      if (!memberships || memberships.length === 0) {
        setTeams([]);
        return;
      }

      const teamIds = memberships.map(m => m.team_id);

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          creator:profiles!teams_created_by_profiles_fkey ( username, theme_color ),
          team_members (
            user_id,
            role,
            user:profiles!team_members_user_id_profiles_fkey ( username, avatar_url, theme_color )
          ),
          team_messages (
            id,
            content,
            user_id,
            created_at,
            metadata,
            user:profiles!team_messages_user_id_profiles_fkey ( username, avatar_url, theme_color )
          )
        `)
        .in('id', teamIds)
        .order('created_at', { foreignTable: 'team_messages', ascending: true });

      if (teamsError) throw teamsError;

      const formattedTeams = (teamsData || []).map(team => ({
        ...team,
        members: team.team_members?.map(m => ({
          ...m,
          username: m.user?.username || 'Unknown',
          avatar_url: m.user?.avatar_url,
          theme_color: m.user?.theme_color
        })),
        messages: (team.team_messages || []).map(msg => ({
          ...msg,
          user_metadata: { 
            username: msg.user?.username || 'Unknown',
            avatar_url: msg.user?.avatar_url,
            theme_color: msg.user?.theme_color
          }
        }))
      }));

      setTeams(formattedTeams);
    } catch (err) {
      console.error('Error fetching teams:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchInvites = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: invitesData, error } = await supabase
        .from('team_invites')
        .select(`
          id,
          team_id,
          inviter_id,
          status,
          created_at,
          teams ( name, color, avatar_url )
        `)
        .eq('invitee_id', user.id)
        .eq('status', 'pending');
        
      if (error) throw error;

      if (invitesData && invitesData.length > 0) {
        const inviterIds = [...new Set(invitesData.map(i => i.inviter_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', inviterIds);
        
        const profilesMap = (profiles || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        
        const formattedInvites = invitesData.map(invite => ({
          ...invite,
          inviter: profilesMap[invite.inviter_id]
        }));
        
        setInvites(formattedInvites);
      } else {
        setInvites([]);
      }
    } catch (err) {
      console.error('Error fetching invites:', err.message);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchTeams();
    fetchInvites();

    const channelId = `team_messages_room`; // Use a stable room name or based on user
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'team_messages'
        },
        (payload) => {
          const newMessageData = payload.new;
          
          // Check for Ping Sound
          if (
            newMessageData.metadata?.type === 'ping' && 
            newMessageData.metadata?.pinged_user_id === user?.id &&
            newMessageData.user_id !== user?.id
          ) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.error('Audio play failed:', e));
          }

          setTeams(prevTeams => {
            return prevTeams.map(team => {
              if (team.id !== newMessageData.team_id) return team;
              
              const sender = team.members?.find(m => m.user_id === newMessageData.user_id);
              const newMessage = {
                ...newMessageData,
                user_metadata: { 
                  username: sender?.username || 'Member',
                  theme_color: sender?.theme_color || '#3b82f6'
                }
              };

              const existingMessages = team.messages || [];
              const isDuplicate = existingMessages.some(m => 
                m.id === newMessageData.id || 
                (m.user_id === newMessageData.user_id && m.content === newMessageData.content && m.id.length < 10)
              );

              if (isDuplicate) {
                return {
                  ...team,
                  messages: existingMessages.map(m => 
                    (m.user_id === newMessageData.user_id && m.content === newMessageData.content && m.id.length < 10)
                      ? newMessage
                      : m
                  )
                };
              }
              
              return {
                ...team,
                messages: [...existingMessages, newMessage]
              };
            });
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_daily_notes'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data, error } = await supabase
              .from('team_daily_notes')
              .select(`
                *,
                user:profiles ( username, avatar_url, theme_color ),
                task:tasks ( title )
              `)
              .eq('id', payload.new.id)
              .single();
            
            if (!error && data) {
              setTeamNotes(prev => {
                const currentNotes = prev[data.team_id] || [];
                // Check if note already exists to prevent duplicates
                if (currentNotes.some(n => n.id === data.id)) return prev;
                
                return {
                  ...prev,
                  [data.team_id]: [data, ...currentNotes]
                };
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedNote = payload.old;
            setTeamNotes(prev => {
              const teamId = Object.keys(prev).find(id => 
                prev[id].some(n => n.id === deletedNote.id)
              );
              if (!teamId) return prev;
              return {
                ...prev,
                [teamId]: prev[teamId].filter(n => n.id !== deletedNote.id)
              };
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'team_messages'
        },
        (payload) => {
          const deletedId = payload.old.id;
          setTeams(prev => prev.map(t => ({
            ...t,
            messages: (t.messages || []).filter(m => m.id !== deletedId)
          })));
        }
      )
      .subscribe();

    // Listen for any member changes (joins/kicks) in all my teams
    const membersListener = supabase
      .channel('global_member_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMember = payload.new;
            // Only update if it's for a team we have in state
            setTeams(prev => {
              const teamIndex = prev.findIndex(t => t.id === newMember.team_id);
              if (teamIndex === -1) return prev;

              // Check if member already exists
              if (prev[teamIndex].members?.some(m => m.user_id === newMember.user_id)) return prev;

              // Fetch profile for the new member
              supabase.from('profiles')
                .select('username, theme_color, avatar_url')
                .eq('id', newMember.user_id)
                .single()
                .then(({ data: profile }) => {
                  if (profile) {
                    setTeams(current => current.map(t => 
                      t.id === newMember.team_id 
                        ? { ...t, members: [...(t.members || []), { ...newMember, ...profile }] }
                        : t
                    ));
                  }
                });
              
              return prev;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedMember = payload.old;
            // Handle current user being kicked (redundant but safe)
            if (deletedMember.user_id === user.id) {
              fetchTeams();
              return;
            }

            setTeams(prev => prev.map(t => 
              t.id === deletedMember.team_id 
                ? { ...t, members: (t.members || []).filter(m => m.user_id !== deletedMember.user_id) }
                : t
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(membersListener);
    };
  }, [user, fetchTeams, fetchInvites]);

  const logActivity = async (action, details) => {
    try {
      await supabase.from('task_history').insert([{
        user_id: user.id,
        action,
        details
      }]);
    } catch (err) {
      console.error('Error logging activity:', err.message);
    }
  };

  const createTeam = async (name, description = '', color = '#3b82f6', avatar_url = null) => {
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([{ name, description, color, avatar_url, created_by: user.id }])
        .select()
        .single();

      if (teamError) throw teamError;

      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{ team_id: team.id, user_id: user.id, role: 'owner' }]);

      if (memberError) throw memberError;

      await logActivity('TEAM_CREATED', { name });

      const newTeam = { 
        ...team, 
        team_members: [{ user_id: user.id, role: 'owner' }], 
        messages: [] 
      };
      setTeams(prev => [...prev, newTeam]);
      return { data: newTeam, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      const teamToDelete = teams.find(t => t.id === teamId);
      
      const { data: messages } = await supabase
        .from('team_messages')
        .select('metadata')
        .eq('team_id', teamId);
      
      const imageUrls = messages
        ?.map(m => m.metadata?.image_url)
        .filter(url => url && url.includes('chat-attachments')) || [];

      if (imageUrls.length > 0) {
        const filePaths = imageUrls.map(url => {
          const bucketToken = 'chat-attachments/';
          if (url.includes(bucketToken)) {
            const path = url.split(bucketToken)[1].split('?')[0];
            return path.startsWith('public/') ? path.replace('public/', '') : path;
          }
          return null;
        }).filter(Boolean);

        if (filePaths.length > 0) {
          await supabase.storage
            .from('chat-attachments')
            .remove(filePaths);
        }
      }

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      await logActivity('TEAM_DELETED', { name: teamToDelete?.name || teamId });

      setTeams(prev => prev.filter(t => t.id !== teamId));
      return { error: null };
    } catch (err) {
      console.error('Error deleting team:', err.message);
      return { error: err };
    }
  };

  const uploadTeamFile = async (file) => {
    try {
      const MAX_SIZE = 500 * 1024;
      if (file.size > MAX_SIZE) {
        throw new Error('File exceeds 500KB limit');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `chat/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      return { publicUrl, error: null };
    } catch (err) {
      console.error('Error uploading file:', err.message);
      return { publicUrl: null, error: err };
    }
  };

  const sendMessage = async (teamId, content, metadata = {}) => {
    const tempId = Math.random().toString(36).substring(7);

    const optimisticMessage = {
      id: tempId,
      team_id: teamId,
      user_id: user.id,
      content,
      metadata,
      created_at: new Date().toISOString(),
      user_metadata: {
        username: currentUserProfile?.username || user?.user_metadata?.username || 'You',
        theme_color: currentUserProfile?.theme_color || '#3b82f6'
      }
    };

    // Apply optimistic update
    setTeams(prev => prev.map(t => 
      t.id === teamId ? { ...t, messages: [...(t.messages || []), optimisticMessage] } : t
    ));

    try {
      const { data, error } = await supabase
        .from('team_messages')
        .insert([{ 
          team_id: teamId, 
          user_id: user.id, 
          content,
          metadata
        }])
        .select()
        .single();

      if (error) throw error;

      // Update optimistic message with real ID from database
      setTeams(prev => prev.map(t => 
        t.id === teamId ? { 
          ...t, 
          messages: (t.messages || []).map(m => 
            m.id === tempId ? { ...data, user_metadata: optimisticMessage.user_metadata } : m
          )
        } : t
      ));

      return { data, error: null };
    } catch (err) {
      // Rollback on error
      setTeams(prev => prev.map(t => 
        t.id === teamId ? { ...t, messages: t.messages.filter(m => m.id !== tempId) } : t
      ));
      console.error('Error sending message:', err.message);
      return { data: null, error: err };
    }
  };

  const inviteToTeam = async (teamId, identifier) => {
    try {
      let inviteeId = null;
      let email = null;
      
      if (identifier.includes('@')) {
        email = identifier;
        const { data: userId, error: rpcError } = await supabase.rpc('get_user_id_by_email', { search_email: email });
        if (rpcError) throw rpcError;
        if (userId) inviteeId = userId;
      } else {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', identifier)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }
        if (profile) inviteeId = profile.id;
      }

      if (!inviteeId && !email) {
        throw new Error('User not found');
      }

      if (inviteeId) {
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', teamId)
          .eq('user_id', inviteeId)
          .single();
          
        if (existingMember) {
          throw new Error('User is already a member of this team');
        }
      }

      const { error: inviteError } = await supabase
        .from('team_invites')
        .insert([{ 
          team_id: teamId, 
          inviter_id: user.id,
          invitee_id: inviteeId,
          email: email
        }]);

      if (inviteError) {
        throw inviteError;
      }

      return { error: null };
    } catch (err) {
      console.error('Error inviting user:', err.message);
      return { error: err };
    }
  };

  const kickMember = async (teamId, userId) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      setTeams(prev => prev.map(t => 
        t.id === teamId ? { ...t, members: (t.members || []).filter(m => m.user_id !== userId) } : t
      ));

      return { error: null };
    } catch (err) {
      console.error('Error kicking member:', err.message);
      return { error: err };
    }
  };

  const acceptInvite = async (inviteId, teamId) => {
    try {
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{ team_id: teamId, user_id: user.id, role: 'member' }]);
        
      if (memberError) throw memberError;

      await supabase.from('team_invites').update({ status: 'accepted' }).eq('id', inviteId);
      
      fetchTeams();
      fetchInvites();
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  const declineInvite = async (inviteId) => {
    try {
      await supabase.from('team_invites').update({ status: 'declined' }).eq('id', inviteId);
      fetchInvites();
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  const clearTeamMessages = async (teamId) => {
    try {
      const { error } = await supabase
        .from('team_messages')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id);

      if (error) throw error;

      setTeams(prev => prev.map(t => 
        t.id === teamId ? { ...t, messages: (t.messages || []).filter(m => m.user_id !== user.id) } : t
      ));

      return { error: null };
    } catch (err) {
      console.error('Error clearing messages:', err.message);
      return { error: err };
    }
  };

  // Global Presence Tracking (Shows online as long as logged in)
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('global:presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Flatten the presence state to a simple map of userId -> true
        const onlineUsers = {};
        Object.keys(state).forEach(key => {
          onlineUsers[key] = true;
        });
        setPresence(onlineUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addDailyNote = useCallback(async (teamId, content, taskId = null) => {
    if (!user || !content.trim()) return { error: 'Invalid content' };
    try {
      const { error } = await supabase
        .from('team_daily_notes')
        .insert([{ 
          team_id: teamId, 
          user_id: user.id, 
          content: content.trim(),
          task_id: taskId
        }]);
      return { error };
    } catch (err) {
      return { error: err };
    }
  }, [user]);

  const fetchTeamNotes = useCallback(async (teamId) => {
    try {
      const { data, error } = await supabase
        .from('team_daily_notes')
        .select(`
          *,
          user:profiles ( username, avatar_url, theme_color ),
          task:tasks ( title )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeamNotes(prev => ({ ...prev, [teamId]: data }));
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }, []);

  const deleteDailyNote = useCallback(async (noteId) => {
    try {
      const { error } = await supabase
        .from('team_daily_notes')
        .delete()
        .eq('id', noteId);
      return { error };
    } catch (err) {
      return { error: err };
    }
  }, []);

  const value = useMemo(() => ({
    teams,
    invites,
    loading,
    presence,
    teamNotes,
    createTeam,
    deleteTeam,
    inviteToTeam,
    acceptInvite,
    declineInvite,
    sendMessage,
    clearTeamMessages,
    uploadTeamFile,
    kickMember,
    refresh: fetchTeams,
    refreshInvites: fetchInvites,
    deleteDailyNote,
    addDailyNote,
    fetchTeamNotes
  }), [
    teams, invites, loading, presence, teamNotes, 
    createTeam, deleteTeam, inviteToTeam, acceptInvite, 
    declineInvite, sendMessage, clearTeamMessages, 
    uploadTeamFile, kickMember, fetchTeams, fetchInvites, 
    deleteDailyNote, addDailyNote, fetchTeamNotes
  ]);

  return (
    <TeamsContext.Provider value={value}>
      {children}
    </TeamsContext.Provider>
  );
};

export const useTeams = () => useContext(TeamsContext);
