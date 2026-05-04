import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Trash2, Save, RefreshCw, LogOut, CheckCircle2, Sun, Moon, Palette, Zap, Crown, Droplets, Power, Clock } from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../hooks/useTheme';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

const SettingsPage = () => {
  const { user, profile, updateProfile, updatePassword, signOut, deleteAccount } = useAuth();
  const { addNotification } = useNotifications();
  const { theme, setTheme } = useTheme();
  const [username, setUsername] = useState(profile?.username || user?.user_metadata?.username || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, checking, available, downloading, finished
  const [updateProgress, setUpdateProgress] = useState(0);
  const [newVersion, setNewVersion] = useState(null);
  const [currentAppVersion, setCurrentAppVersion] = useState('0.1.0');
  const [isAutostartEnabled, setIsAutostartEnabled] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dashboardSettings, setDashboardSettings] = useState(() => {
    const saved = localStorage.getItem('dashboard_settings');
    const settings = saved ? JSON.parse(saved) : { showClock: true, hour12: true };
    // Ensure hour12 exists for legacy users
    if (settings.hour12 === undefined) settings.hour12 = true;
    return settings;
  });

  useEffect(() => {
    const init = async () => {
      try { const v = await getVersion(); setCurrentAppVersion(v); } catch (e) { console.error(e); }
      try { const enabled = await isEnabled(); setIsAutostartEnabled(enabled); } catch (e) { console.error(e); }
    };
    init();
  }, []);

  useEffect(() => { if (profile) { setUsername(profile.username || ''); setFullName(profile.full_name || ''); setBio(profile.bio || ''); } }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const { error } = await updateProfile({ username, full_name: fullName, bio }); if (error) throw error; setMessage({ type: 'success', text: 'Profile updated!' }); }
    catch (err) { setMessage({ type: 'error', text: err.message }); } finally { setLoading(false); }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      
      // Ping sound for password update
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.error('Audio play failed:', e));

      addNotification({
        title: 'Security Updated',
        message: 'Your password has been changed successfully.',
        type: 'ping',
        duration: 5000
      });

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClock = () => {
    const newSettings = { ...dashboardSettings, showClock: !dashboardSettings.showClock };
    setDashboardSettings(newSettings);
    localStorage.setItem('dashboard_settings', JSON.stringify(newSettings));
    window.dispatchEvent(new CustomEvent('dashboard_settings_updated'));
    addNotification({
      title: 'Dashboard Updated',
      message: `Clock card ${newSettings.showClock ? 'enabled' : 'disabled'}.`,
      type: 'info'
    });
  };

  const handleToggleHourFormat = () => {
    const newSettings = { ...dashboardSettings, hour12: !dashboardSettings.hour12 };
    setDashboardSettings(newSettings);
    localStorage.setItem('dashboard_settings', JSON.stringify(newSettings));
    window.dispatchEvent(new CustomEvent('dashboard_settings_updated'));
    addNotification({
      title: 'Time Format Updated',
      message: `Clock set to ${newSettings.hour12 ? '12-hour' : '24-hour'} format.`,
      type: 'info'
    });
  };

  const handleThemeChange = async (themeObj) => {
    if (theme === themeObj.id) return;
    setTheme(themeObj.id);
    try { await updateProfile({ theme_preference: themeObj.id, theme_color: themeObj.color }); } catch (err) { console.error("Theme save failed:", err); }
  };

  const handleToggleAutostart = async () => {
    try {
      if (isAutostartEnabled) {
        await disable();
        setIsAutostartEnabled(false);
        addNotification({
          title: 'Startup Disabled',
          message: 'TaskManager will no longer start with Windows.',
          type: 'info'
        });
      } else {
        await enable();
        setIsAutostartEnabled(true);
        addNotification({
          title: 'Startup Enabled',
          message: 'TaskManager will now start automatically.',
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Autostart error:', err);
      setMessage({ type: 'error', text: 'Failed to update startup preferences' });
    }
  };

  const handleCheckUpdates = async () => {
    setUpdateStatus('checking');
    setUpdateMessage({ type: '', text: '' });
    try {
      const update = await check();
      if (update) {
        setNewVersion(update);
        setUpdateStatus('available');
      } else {
        setUpdateStatus('idle');
        setUpdateMessage({ type: 'success', text: 'You are on the latest version!' });
      }
    } catch (err) {
      console.error(err);
      setUpdateStatus('idle');
      setUpdateMessage({ type: 'error', text: 'Failed to check for updates.' });
    }
  };

  const handleInstallUpdate = async () => {
    if (!newVersion) return;
    setUpdateStatus('downloading');
    setUpdateMessage({ type: '', text: '' });
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
      setUpdateMessage({ type: 'error', text: 'Update failed.' });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleteModalOpen(false);
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const { error } = await deleteAccount();
      if (error) throw error;
      // Success is handled by signOut in AuthContext which will redirect/update UI
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setLoading(false);
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

      <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-title" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} />
              <span>Profile & Security</span>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
            {/* Left Column: Profile Info */}
            <div className="settings-section">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <Mail size={16} /> Personal Information
              </h3>
              <form onSubmit={handleUpdateProfile} className="auth-form">
                <div className="input-field">
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    Full Name
                    <span style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 400, letterSpacing: '0.5px', textTransform: 'uppercase' }}>use legal name</span>
                  </label>
                  <div className="input-wrapper"><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" /></div>
                </div>
                <div className="input-field" style={{ marginTop: '1rem' }}><label>Username</label><div className="input-wrapper"><input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" /></div></div>
                <div className="input-field" style={{ marginTop: '1rem' }}>
                  <label>Bio (Operative Status)</label>
                  <div className="input-wrapper"><textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about your mission..." rows={3} className="modern-input" style={{ width: '100%', padding: '0.75rem', borderRadius: '12px' }} /></div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', gap: '8px' }} disabled={loading}><Save size={16} /> Save Profile</button>
              </form>
            </div>

            {/* Right Column: Password Update */}
            <div className="settings-section" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '3rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <Lock size={16} /> Security Credentials
              </h3>
              <form onSubmit={handleUpdatePassword} className="auth-form">
                <div className="input-field">
                  <label>New Password</label>
                  <div className="input-wrapper">
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      placeholder="Enter new password" 
                    />
                  </div>
                </div>
                <div className="input-field" style={{ marginTop: '1rem' }}>
                  <label>Confirm Password</label>
                  <div className="input-wrapper">
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      placeholder="Confirm new password" 
                    />
                  </div>
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '3.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '8px' }} disabled={loading}>
                    <Lock size={16} /> Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="card">
          <div className="card-title"><Palette size={18} /><span>Interface Styles</span></div>
          <p className="text-secondary text-sm" style={{ marginTop: '0.5rem' }}>Personalize your tactical interface.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem', marginTop: '1.5rem' }}>
            {[
              { id: 'light', label: 'Light', icon: Sun, color: '#3b82f6' },
              { id: 'dark', label: 'Dark', icon: Moon, color: '#60a5fa' },
              { id: 'aura', label: 'Aura', icon: Palette, color: '#7aa2f7' },
              { id: 'emerald', label: 'Emerald', icon: Zap, color: '#10b981' },
              { id: 'gold', label: 'Gold', icon: Crown, color: '#fbbf24' }
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
          <div className="card-title"><Zap size={18} /><span>Dashboard Preferences</span></div>
          <p className="text-secondary text-sm" style={{ marginTop: '0.5rem' }}>Customize your primary workstation view.</p>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ 
              background: 'var(--surface-2)', 
              padding: '1rem', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RefreshCw size={16} className={dashboardSettings.showClock ? 'text-primary' : 'text-secondary'} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="text-sm font-semibold">Show Operational Clock</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Display real-time clock in stats row</span>
                </div>
              </div>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                <input 
                  type="checkbox" 
                  checked={dashboardSettings.showClock} 
                  onChange={handleToggleClock}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: dashboardSettings.showClock ? 'var(--primary-accent)' : 'var(--border-color)',
                  transition: '.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    height: '16px', width: '16px',
                    left: '3px', bottom: '3px',
                    backgroundColor: 'white',
                    transition: '.4s',
                    borderRadius: '50%',
                    transform: dashboardSettings.showClock ? 'translateX(18px)' : 'translateX(0)'
                  }} />
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={16} className="text-primary" />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="text-sm font-semibold">24-Hour Format</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Switch between 12h and 24h display</span>
                </div>
              </div>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                <input 
                  type="checkbox" 
                  checked={!dashboardSettings.hour12} 
                  onChange={handleToggleHourFormat}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: !dashboardSettings.hour12 ? 'var(--primary-accent)' : 'var(--border-color)',
                  transition: '.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    height: '16px', width: '16px',
                    left: '3px', bottom: '3px',
                    backgroundColor: 'white',
                    transition: '.4s',
                    borderRadius: '50%',
                    transform: !dashboardSettings.hour12 ? 'translateX(18px)' : 'translateX(0)'
                  }} />
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title"><RefreshCw size={18} /><span>System Updates</span></div>
          <p className="text-secondary text-sm" style={{ marginTop: '0.5rem' }}>Keep your tactical workstation up to date.</p>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ 
              background: 'var(--surface-2)', 
              padding: '1rem', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Power size={16} className={isAutostartEnabled ? 'text-primary' : 'text-secondary'} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="text-sm font-semibold">Start with Windows</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Launch app on system startup</span>
                </div>
              </div>
              <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                <input 
                  type="checkbox" 
                  checked={isAutostartEnabled} 
                  onChange={handleToggleAutostart}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: isAutostartEnabled ? 'var(--primary-accent)' : 'var(--border-color)',
                  transition: '.4s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    height: '16px', width: '16px',
                    left: '3px', bottom: '3px',
                    backgroundColor: 'white',
                    transition: '.4s',
                    borderRadius: '50%',
                    transform: isAutostartEnabled ? 'translateX(18px)' : 'translateX(0)'
                  }} />
                </span>
              </label>
            </div>

            {updateMessage.text && (
              <div style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '12px', 
                background: updateMessage.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', 
                color: updateMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: `1px solid ${updateMessage.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
              }}>
                {updateMessage.type === 'success' ? <CheckCircle2 size={16} /> : <Zap size={16} />}
                <span>{updateMessage.text}</span>
              </div>
            )}

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
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.5rem', paddingTop: '1rem' }}>
              <button onClick={() => setIsDeleteModalOpen(true)} className="btn btn-danger" style={{ width: '100%', gap: '8px', background: 'rgba(239,68,68,0.05)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.1)', fontSize: '0.8rem' }}>
                <Trash2 size={14} /> Delete Account
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        title="Delete Account?"
        message="Are you sure you want to delete your account? This action is permanent and all your data will be lost. This cannot be undone."
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteModalOpen(false)}
        confirmText="Delete Account"
        type="danger"
      />
    </div>
  );
};

export default SettingsPage;
