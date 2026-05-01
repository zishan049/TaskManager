import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
        
      } else {
        const { data, error } = await signIn({ email, password });
        if (error) throw error;
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
      <div className="theme-watermark" aria-hidden="true" />
      <div className="auth-card page-enter">
        <div className="auth-header">
          <div className="logo" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src="/favicon.svg" alt="TaskManager" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
          </div>

          <h1 className="auth-title" style={{ marginTop: '0.5rem' }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>

          <p className="auth-subtitle">
            {isSignUp 
              ? 'Join our community and stay productive.' 
              : 'Sign in to Get Some Shit Done!!'}

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
            <label>{isSignUp ? 'Email Address' : 'Username or Email'}</label>
            <div className="input-wrapper">
              <input 
                type={isSignUp ? 'email' : 'text'} 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder={isSignUp ? "name@example.com" : "Username or email"}
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

    </div>
  );
};

export default AuthPage;
