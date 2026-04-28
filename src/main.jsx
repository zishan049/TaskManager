import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { TeamsProvider } from './contexts/TeamsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <TeamsProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </TeamsProvider>
    </AuthProvider>
  </React.StrictMode>
);
