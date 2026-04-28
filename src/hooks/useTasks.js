import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    fetchTasks();

    const channelName = `tasks_${user.id}_${Math.random().toString(36).slice(2)}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks((prev) => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTasks((prev) => prev.map((t) => (t.id === payload.new.id ? payload.new : t)));
        } else if (payload.eventType === 'DELETE') {
          setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, fetchTasks]);

  // Fire-and-forget: never blocks the main operation
  const logHistory = async (taskId, action, details) => {
    try {
      await supabase.from('task_history').insert([{
        task_id: taskId || null,
        user_id: user.id,
        action,
        details,
      }]);
    } catch (err) {
      console.warn('History log failed (non-critical):', err.message);
    }
  };

  const addTask = async (taskData) => {
    try {
      const username = profile?.username || user.user_metadata?.username || user.email?.split('@')[0];
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...taskData, user_id: user.id, creator_username: username }])
        .select()
        .single();

      if (error) throw error;

      // Non-blocking history log
      logHistory(data.id, 'CREATED', { title: taskData.title });

      return { data, error: null };
    } catch (err) {
      console.error('Error adding task:', err.message);
      return { data: null, error: err };
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      logHistory(id, 'UPDATED', updates);

      return { data, error: null };
    } catch (err) {
      console.error('Error updating task:', err.message);
      return { data: null, error: err };
    }
  };

  const deleteTask = async (id) => {
    try {
      logHistory(id, 'DELETED', {});
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (err) {
      console.error('Error deleting task:', err.message);
      return { error: err };
    }
  };

  const fetchTaskHistory = async (taskId) => {
    try {
      const { data, error } = await supabase
        .from('task_history')
        .select('*, profiles:user_id(username, avatar_url)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching task history:', err.message);
      return [];
    }
  };

  return { tasks, loading, addTask, updateTask, deleteTask, fetchTaskHistory, refresh: fetchTasks };
};
