import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('task_history')
        .select(`*, tasks(title)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching history:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchHistory();
    else { setHistory([]); setLoading(false); }
  }, [user]);

  const clearHistory = async () => {
    try {
      const { error } = await supabase.from('task_history').delete().eq('user_id', user.id);
      if (error) throw error;
      setHistory([]);
      return { error: null };
    } catch (err) {
      console.error('Error clearing history:', err.message);
      return { error: err };
    }
  };

  return { history, loading, refresh: fetchHistory, clearHistory };
};
