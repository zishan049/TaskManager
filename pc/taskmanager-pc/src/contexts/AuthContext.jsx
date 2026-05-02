import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

const SUPABASE_URL = 'https://jfodsivsowybgbdjtukv.supabase.co';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId, userMeta = {}) => {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            username: userMeta.username || userMeta.email?.split('@')[0] || `user_${userId.slice(0, 5)}`,
            full_name: userMeta.full_name || null,
            email: userMeta.email || null,
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

      if (data?.theme_preference) {
        document.documentElement.setAttribute('data-theme', data.theme_preference);
        localStorage.setItem('theme', data.theme_preference);
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
      let loginEmail = data.email;
      
      // If it's not an email format, try to find by username
      if (!loginEmail.includes('@')) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('username', loginEmail)
          .single();
        
        if (profileError || !profileData?.email) {
          return { error: new Error('User not found with that username') };
        }
        loginEmail = profileData.email;
      }

      const res = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: data.password
      });

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
    updateProfile: async (attributes) => {
      const authFields = {};
      if (attributes.username) authFields.username = attributes.username;
      if (attributes.full_name !== undefined) authFields.full_name = attributes.full_name;
      if (attributes.avatar_url) authFields.avatar_url = attributes.avatar_url;

      if (Object.keys(authFields).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({ data: authFields });
        if (authError) return { error: authError };
      }

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
    deleteAccount: async () => {
      try {
        // 1. Find all images sent by this user in ANY team to clean up storage
        const { data: messages } = await supabase
          .from('team_messages')
          .select('metadata')
          .eq('user_id', user.id);

        const imageUrls = messages
          ?.map(m => m.metadata?.image_url)
          .filter(url => url && url.includes('chat-attachments')) || [];

        if (imageUrls.length > 0) {
          const filePaths = imageUrls.map(url => {
            const bucketToken = 'chat-attachments/';
            if (url.includes(bucketToken)) {
              const path = url.split(bucketToken)[1].split('?')[0];
              // Handle potential public/ prefix if getPublicUrl was used
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

        // 2. Call the RPC function to delete the auth user
        // This will trigger the database cascades we set up to delete profile, messages, etc.
        const { error: rpcError } = await supabase.rpc('delete_own_account');
        if (rpcError) throw rpcError;

        // Sign out as the final step (clears local session)
        setProfile(null);
        await supabase.auth.signOut();
        return { error: null };
      } catch (err) {
        console.error('deleteAccount error:', err.message);
        return { error: err };
      }
    },
    updatePassword: async (new_password) => {
      const { error } = await supabase.auth.updateUser({ password: new_password });
      return { error };
    },
    user,
    profile,
    session,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
