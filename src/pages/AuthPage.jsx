import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, Mail, Lock, User, AtSign, Calendar, Sparkles } from 'lucide-react';

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signIn, signUp, showSuccessPopup, setShowSuccessPopup, newUserData, setNewUserData } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await signUp({ 
          email, 
          password,
          options: {
            data: {
              username: username || email.split('@')[0],
              full_name: username || email.split('@')[0],
            }
          }
        });
        if (error) throw error;
        
        setNewUserData({
          email: data.user.email,
          username: username || email.split('@')[0],
          id: data.user.id.slice(0, 8) + '...',
          joined: new Date().toLocaleDateString(),
          role: 'New Member'
        });
        setShowSuccessPopup(true);
      } else {
        const { data, error } = await signIn({ email, password });
        if (error) throw error;
        
        setNewUserData({
          email: data.user.email,
          username: data.user.user_metadata?.username || email.split('@')[0],
          id: data.user.id.slice(0, 8) + '...',
          joined: new Date(data.user.created_at).toLocaleDateString(),
          role: 'Active Member'
        });
        setShowSuccessPopup(true);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handlePopupClose = () => {
    localStorage.setItem('taskmanager_view', 'home');
    setShowSuccessPopup(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card page-enter">
        <div className="auth-header">
          <div className="logo" style={{ marginBottom: '2rem', justifyContent: 'center' }}>
            <CheckCircle2 size={32} className="logo-icon" />
            <span style={{ fontSize: '1.5rem' }}>TaskManager</span>
          </div>
          <h1 className="auth-title">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="auth-subtitle">
            {isSignUp 
              ? 'Join our community and stay productive.' 
              : 'Sign in to continue managing your tasks.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="input-field">
              <label>Username</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                  placeholder="Enter your username"
                />
              </div>
            </div>
          )}

          <div className="input-field">
            <label>Email Address</label>
            <div className="input-wrapper">
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="input-field">
            <label>Password</label>
            <div className="input-wrapper">
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="error-msg" style={{ marginTop: '0.5rem', color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="auth-switch">
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
          <span 
            onClick={() => setIsSignUp(!isSignUp)} 
            className="auth-switch-link"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </span>
        </div>
      </div>

      {showSuccessPopup && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="welcome-popup">
              <div className="user-avatar-large">
                <Sparkles size={40} />
              </div>
              
              <div className="welcome-info">
                <h2>Login Successful</h2>
                <p className="text-secondary">Welcome, {newUserData.username}!</p>
              </div>

              <div className="info-table">
                <div className="info-row">
                  <span className="label">Email</span>
                  <span className="value">{newUserData.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Account ID</span>
                  <span className="value">{newUserData.id}</span>
                </div>
                <div className="info-row">
                  <span className="label">Member Since</span>
                  <span className="value">{newUserData.joined}</span>
                </div>
              </div>

              <button 
                onClick={handlePopupClose} 
                className="auth-btn" 
                style={{ width: '100%', marginTop: '2rem' }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
