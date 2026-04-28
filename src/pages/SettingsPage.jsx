import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Trash2, Save, RefreshCw, LogOut, CheckCircle2, Sun, Moon, Cpu, Circle, Wind, Palette, Zap, Flame, Crown, Droplets } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

const SettingsPage = () => {
  const { user, profile, updateProfile, updatePassword, updateEmail, deleteAccount, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState(profile?.username || user?.user_metadata?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Update local state when profile loads
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await updateProfile({ username, bio });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (themeObj) => {
    if (theme === themeObj.id) return;
    setTheme(themeObj.id); // Update local UI instantly
    try {
      await updateProfile({ 
        theme_preference: themeObj.id,
        theme_color: themeObj.color
      });
    } catch (err) {
      console.error("Failed to save theme preference:", err);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await updateEmail(email);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Check your email for the confirmation link!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you absolutely sure? This will delete your profile data and sign you out permanently.')) {
      setLoading(true);
      try {
        await deleteAccount();
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
        setLoading(false);
      }
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Account Settings</h2>
        <p className="text-secondary">Manage your profile and security preferences.</p>
      </div>

      {message.text && (
        <div className={`alert ${message.type}`} style={{ 
          padding: '1rem', 
          borderRadius: 'var(--radius-lg)', 
          marginBottom: '2rem',
          background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <Trash2 size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {/* Profile Info */}
        <div className="card">
          <div className="card-title">
            <User size={18} />
            <span>Profile Information</span>
          </div>
          <form onSubmit={handleUpdateProfile} className="auth-form" style={{ marginTop: '1.5rem' }}>
            <div className="input-field">
              <label>Username</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  placeholder="Enter username"
                />
              </div>
            </div>
            <div className="input-field" style={{ marginTop: '1rem' }}>
              <label>Bio (Operative Status)</label>
              <div className="input-wrapper">
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  placeholder="Tell us about your mission..."
                  rows={3}
                  className="modern-input"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '12px' }}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', gap: '8px' }} disabled={loading}>
              <Save size={16} /> Save Changes
            </button>
          </form>
        </div>

        {/* Security & Access */}
        <div className="card">
          <div className="card-title">
            <Lock size={18} />
            <span>Security & Access</span>
          </div>
          
          {/* Email Section */}
          <div className="settings-section" style={{ marginTop: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <Mail size={14} className="text-tertiary" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email Address</span>
            </div>
            <form onSubmit={handleUpdateEmail} className="auth-form">
              <div className="input-field">
                <div className="input-wrapper">
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.75rem', gap: '8px' }} disabled={loading}>
                <RefreshCw size={14} /> Update Email
              </button>
            </form>
          </div>

          {/* Password Section */}
          <div className="settings-section" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <Lock size={14} className="text-tertiary" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Change Password</span>
            </div>
            <form onSubmit={handleUpdatePassword} className="auth-form">
              <div className="input-field">
                <div className="input-wrapper">
                  <input 
                    type="password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    placeholder="New Password"
                  />
                </div>
              </div>
              <div className="input-field" style={{ marginTop: '0.75rem' }}>
                <div className="input-wrapper">
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm New Password"
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem', gap: '8px' }} disabled={loading}>
                <Lock size={14} /> Update Password
              </button>
            </form>
          </div>
        </div>

        {/* Theme Preference */}
        <div className="card">
          <div className="card-title">
            <Palette size={18} />
            <span>Interface Styles</span>
          </div>
          <p className="text-secondary text-sm" style={{ marginTop: '0.5rem' }}>
            Personalize your tactical interface environment.
          </p>
          <div className="theme-selector-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', 
            gap: '0.75rem', 
            marginTop: '1.5rem' 
          }}>
            {[
              { id: 'light', label: 'Light', icon: Sun, color: '#3b82f6' },
              { id: 'dark', label: 'Dark', icon: Moon, color: '#60a5fa' },
              { id: 'cyberpunk', label: 'Neon', icon: Cpu, color: '#00f3ff' },
              { id: 'nord', label: 'Nord', icon: Wind, color: '#88c0d0' },
              { id: 'aura', label: 'Aura', icon: Palette, color: '#7aa2f7' },
              { id: 'midnight', label: 'OLED', icon: Circle, color: '#a855f7' },
              { id: 'emerald', label: 'Emerald', icon: Zap, color: '#10b981' },
              { id: 'crimson', label: 'Crimson', icon: Flame, color: '#f43f5e' },
              { id: 'gold', label: 'Gold', icon: Crown, color: '#fbbf24' },
              { id: 'sapphire', label: 'Sapphire', icon: Droplets, color: '#3b82f6' }
            ].map((t) => (
              <button 
                key={t.id}
                className={`theme-btn ${theme === t.id ? 'active' : ''}`}
                onClick={() => handleThemeChange(t)}
                style={{
                  padding: '1rem 0.5rem',
                  borderRadius: '12px',
                  border: '1.5px solid var(--border-color)',
                  background: theme === t.id ? 'var(--surface-2)' : 'transparent',
                  borderColor: theme === t.id ? t.color : 'var(--border-color)',
                  boxShadow: theme === t.id ? `0 8px 20px -8px ${t.color}` : 'none',
                  transform: theme === t.id ? 'translateY(-2px)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s var(--transition-smooth)'
                }}
              >
                <t.icon size={20} color={theme === t.id ? t.color : 'var(--text-tertiary)'} />
                <span style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 600, 
                  color: theme === t.id ? 'var(--text-primary)' : 'var(--text-tertiary)' 
                }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card danger-card" style={{ border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div className="card-title" style={{ color: 'var(--danger)' }}>
            <Trash2 size={18} />
            <span>Danger Zone</span>
          </div>
          <p className="text-secondary text-sm" style={{ marginTop: '1rem' }}>
            Deleting your account is permanent and cannot be undone.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              onClick={() => signOut()} 
              className="btn btn-secondary"
              style={{ width: '100%', gap: '8px' }}
            >
              <LogOut size={16} />
              Sign Out
            </button>
            <button 
              onClick={handleDeleteAccount}
              className="btn btn-primary"
              style={{ width: '100%', gap: '8px', background: 'var(--danger)' }}
              disabled={loading}
            >
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
