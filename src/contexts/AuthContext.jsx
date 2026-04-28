  import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

const SUPABASE_URL = 'https://jfodsivsowybgbdjtukv.supabase.co';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [newUserData, setNewUserData] = useState(null);

  const fetchProfile = async (userId, userMeta = {}) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // PGRST116 = no rows found — create the profile for existing users
      if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            username: userMeta.username || userMeta.email?.split('@')[0] || `user_${userId.slice(0, 5)}`,
            full_name: userMeta.full_name || null,
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Could not create profile:', insertError.message);
          return;
        }
        data = newProfile;
      } else if (error) {
        console.error('Error fetching profile:', error.message);
        return;
      }

      setProfile(data);

      // Apply saved theme
      if (data?.theme_preference) {
        document.documentElement.setAttribute('data-theme', data.theme_preference);
        localStorage.setItem('theme', data.theme_preference);

        // Repair logic: ensure theme_color matches preference
        const themeColors = {
          light: '#3b82f6', dark: '#60a5fa', cyberpunk: '#00f3ff',
          nord: '#88c0d0', aura: '#7aa2f7', midnight: '#a855f7',
          emerald: '#10b981', crimson: '#f43f5e', gold: '#fbbf24', sapphire: '#3b82f6'
        };
        const expectedColor = themeColors[data.theme_preference] || '#3b82f6';
        
        if (data.theme_color !== expectedColor) {
          await supabase.from('profiles').update({ theme_color: expectedColor }).eq('id', userId);
          data.theme_color = expectedColor;
        }
      }
    } catch (err) {
      console.error('fetchProfile error:', err.message);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, {
          ...session.user.user_metadata,
          email: session.user.email,
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, {
          ...session.user.user_metadata,
          email: session.user.email,
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    signUp: async (data) => {
      const res = await supabase.auth.signUp(data);
      if (res.data?.session) {
        setSession(res.data.session);
        setUser(res.data.session.user);
        fetchProfile(res.data.session.user.id, res.data.session.user.user_metadata);
      }
      return res;
    },
    signIn: async (data) => {
      const res = await supabase.auth.signInWithPassword(data);
      if (res.data?.session) {
        setSession(res.data.session);
        setUser(res.data.session.user);
        fetchProfile(res.data.session.user.id, res.data.session.user.user_metadata);
      }
      return res;
    },

    signOut: async () => {
      setProfile(null);
      return supabase.auth.signOut();
    },

    // Updates both Supabase Auth metadata AND the public profiles table
    updateProfile: async (attributes) => {
      // 1. Update Auth metadata (only for auth-relevant fields)
      const authFields = {};
      if (attributes.username) authFields.username = attributes.username;
      if (attributes.full_name) authFields.full_name = attributes.full_name;
      if (attributes.avatar_url) authFields.avatar_url = attributes.avatar_url;

      if (Object.keys(authFields).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({ data: authFields });
        if (authError) return { error: authError };
      }

      // 2. Build profile fields to update (only defined values)
      const profileFields = {};
      if (attributes.username !== undefined) profileFields.username = attributes.username;
      if (attributes.full_name !== undefined) profileFields.full_name = attributes.full_name;
      if (attributes.avatar_url !== undefined) profileFields.avatar_url = attributes.avatar_url;
      if (attributes.theme_preference !== undefined) profileFields.theme_preference = attributes.theme_preference;
      if (attributes.theme_color !== undefined) profileFields.theme_color = attributes.theme_color;
      if (attributes.bio !== undefined) profileFields.bio = attributes.bio;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...profileFields }, { onConflict: 'id' });

      if (!profileError) fetchProfile(user.id, {});
      return { error: profileError || null };
    },

    // Updates password and tracks the timestamp in profiles table
    updatePassword: async (newPassword) => {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (!error) {
        // Record when password was last updated
        await supabase
          .from('profiles')
          .update({ password_updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (profile) fetchProfile(user.id, {});
      }
      return { data, error };
    },

    updateEmail: (newEmail) => supabase.auth.updateUser({ email: newEmail }),

    // Calls the Edge Function which uses service_role to fully delete the auth user
    // This cascades and deletes ALL associated data (tasks, history, teams, etc.)
    deleteAccount: async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentSession.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete account');

      // Sign out locally after successful deletion
      setProfile(null);
      await supabase.auth.signOut();
      return { error: null };
    },

    user,
    profile,
    session,
    loading,
    showSuccessPopup,
    setShowSuccessPopup,
    newUserData,
    setNewUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
