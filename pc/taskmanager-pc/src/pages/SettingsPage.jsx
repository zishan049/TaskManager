import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Trash2, Save, RefreshCw, LogOut, CheckCircle2, Sun, Moon, Cpu, Circle, Palette, Zap, Flame, Crown, Droplets } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';

const SettingsPage = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState(profile?.username || user?.user_metadata?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, checking, available, downloading, finished
  const [updateProgress, setUpdateProgress] = useState(0);
  const [newVersion, setNewVersion] = useState(null);
  const [currentAppVersion, setCurrentAppVersion] = useState('0.1.0');

  useEffect(() => {
    const fetchVersion = async () => {
      try { const v = await getVersion(); setCurrentAppVersion(v); } catch (e) { console.error(e); }
    };
    fetchVersion();
  }, []);

  useEffect(() => { if (profile) { setUsername(profile.username || ''); setBio(profile.bio || ''); } }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const { error } = await updateProfile({ username, bio }); if (error) throw error; setMessage({ type: 'success', text: 'Profile updated!' }); }
    catch (err) { setMessage({ type: 'error', text: err.message }); } finally { setLoading(false); }
  };

  const handleThemeChange = async (themeObj) => {
    if (theme === themeObj.id) return;
    setTheme(themeObj.id);
    try { await updateProfile({ theme_preference: themeObj.id, theme_color: themeObj.color }); } catch (err) { console.error("Theme save failed:", err); }
  };

  const handleCheckUpdates = async () => {
    setUpdateStatus('checking');
    try {
      const update = await check();
      if (update) {
        setNewVersion(update);
        setUpdateStatus('available');
      } else {
        setUpdateStatus('idle');
        setMessage({ type: 'success', text: 'You are on the latest version!' });
      }
    } catch (err) {
      console.error(err);
      setUpdateStatus('idle');
      setMessage({ type: 'error', text: 'Failed to check for updates.' });
    }
  };

  const handleInstallUpdate = async () => {
    if (!newVersion) return;
    setUpdateStatus('downloading');
    try {
      let downloaded = 0;
      let contentLength = 0;
      await newVersion.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) setUpdateProgress(Math.round((downloaded / contentLength) * 100));
            break;
          case 'Finished':
            setUpdateStatus('finished');
            break;
        }
      });
      await relaunch();
    } catch (err) {
      console.error(err);
      setUpdateStatus('idle');
      setMessage({ type: 'error', text: 'Update failed.' });
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Account Settings</h2>
          <p className="text-secondary">Manage your profile and security preferences.</p>
        </div>
      </div>

      {message.text && (
        <div style={{ padding: '1rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: message.type === 'success' ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <Trash2 size={18} />}<span>{message.text}</span>
        </div>
      )}

      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        <div className="card">
          <div className="card-title"><User size={18} /><span>Profile Information</span></div>
          <form onSubmit={handleUpdateProfile} className="auth-form" style={{ marginTop: '1.5rem' }}>
            <div className="input-field"><label>Username</label><div className="input-wrapper"><input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" /></div></div>
            <div className="input-field" style={{ marginTop: '1rem' }}>
              <label>Bio (Operative Status)</label>
              <div className="input-wrapper"><textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about your mission..." rows={3} className="modern-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '12px' }} /></div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', gap: '8px' }} disabled={loading}><Save size={16} /> Save Changes</button>
          </form>
        </div>

        <div className="card">
          <div className="card-title"><Palette size={18} /><span>Interface Styles</span></div>
          <p className="text-secondary text-sm" style={{ marginTop: '0.5rem' }}>Personalize your tactical interface.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem', marginTop: '1.5rem' }}>
            {[
              { id: 'light', label: 'Light', icon: Sun, color: '#3b82f6' },
              { id: 'dark', label: 'Dark', icon: Moon, color: '#60a5fa' },
              { id: 'cyberpunk', label: 'Neon', icon: Cpu, color: '#00f3ff' },
              { id: 'aura', label: 'Aura', icon: Palette, color: '#7aa2f7' },
              { id: 'midnight', label: 'OLED', icon: Circle, color: '#a855f7' },
              { id: 'emerald', label: 'Emerald', icon: Zap, color: '#10b981' },
              { id: 'crimson', label: 'Crimson', icon: Flame, color: '#f43f5e' },
              { id: 'gold', label: 'Gold', icon: Crown, color: '#fbbf24' },
              { id: 'sapphire', label: 'Sapphire', icon: Droplets, color: '#3b82f6' }
            ].map(t => (
              <button key={t.id} className={`theme-btn ${theme === t.id ? 'active' : ''}`} onClick={() => handleThemeChange(t)}
                style={{ padding: '1rem 0.5rem', borderRadius: '12px', border: '1.5px solid var(--border-color)', background: theme === t.id ? 'var(--surface-2)' : 'transparent', borderColor: theme === t.id ? t.color : 'var(--border-color)', boxShadow: theme === t.id ? `0 8px 20px -8px ${t.color}` : 'none', transform: theme === t.id ? 'translateY(-2px)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s var(--transition-smooth)' }}>
                <t.icon size={20} color={theme === t.id ? t.color : 'var(--text-tertiary)'} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: theme === t.id ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title"><RefreshCw size={18} /><span>System Updates</span></div>
          <p className="text-secondary text-sm" style={{ marginTop: '0.5rem' }}>Keep your tactical workstation up to date.</p>
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--surface-2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-sm font-semibold">Current Version</span>
                <span className="badge" style={{ background: 'var(--primary-accent)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>v{currentAppVersion}</span>
              </div>
            </div>

            {updateStatus === 'available' && (
              <div style={{ background: 'rgba(59,130,246,0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--primary-accent)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ color: 'var(--primary-accent)', fontWeight: 700, fontSize: '0.85rem' }}>Update Available: {newVersion?.version}</span>
                <p className="text-sm text-secondary">{newVersion?.body?.substring(0, 100)}...</p>
                <button onClick={handleInstallUpdate} className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                  <Zap size={16} /> Download & Install
                </button>
              </div>
            )}

            {updateStatus === 'downloading' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span>Downloading...</span>
                  <span>{updateProgress}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--primary-accent)', width: `${updateProgress}%`, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            )}

            <button onClick={handleCheckUpdates} className="btn btn-secondary" style={{ width: '100%', gap: '8px' }} disabled={updateStatus !== 'idle'}>
              <RefreshCw size={16} className={updateStatus === 'checking' ? 'animate-spin' : ''} /> 
              {updateStatus === 'checking' ? 'Checking...' : 'Check for Updates'}
            </button>
          </div>
        </div>

        <div className="card danger-card" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="card-title" style={{ color: 'var(--danger)' }}><Trash2 size={18} /><span>Danger Zone</span></div>
          <p className="text-secondary text-sm" style={{ marginTop: '1rem' }}>Sign out of your account.</p>
          <div style={{ marginTop: '2rem' }}>
            <button onClick={() => signOut()} className="btn btn-secondary" style={{ width: '100%', gap: '8px' }}><LogOut size={16} /> Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
