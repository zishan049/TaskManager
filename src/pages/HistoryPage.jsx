import React from 'react';
import { useHistory } from '../hooks/useHistory';
import { Activity, Clock, List, Trash2 } from 'lucide-react';

const HistoryPage = () => {
  const { history, loading, clearHistory } = useHistory();

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear your activity history? This cannot be undone.')) {
      await clearHistory();
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loader"></div>
      <p className="text-secondary text-sm">Loading history...</p>
    </div>
  );

  return (
    <div className="history-page page-enter">
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Activity History</h2>
          <p className="text-secondary text-sm">A record of your recent actions and changes.</p>
        </div>
        
        {history.length > 0 && (
          <button 
            className="btn btn-secondary danger-hover" 
            onClick={handleClear}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 16px', flexShrink: 0 }}
          >
            <Trash2 size={16} />
            Clear History
          </button>
        )}
      </div>

      <div className="logs-container">
        {history.length === 0 ? (
          <div className="empty-logs" style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.5 }}>
            <List size={48} style={{ marginBottom: '1rem' }} />
            <p className="text-secondary">No activity recorded yet.</p>
          </div>
        ) : (
          <div className="log-list">
            {history.map((entry) => (
              <div key={entry.id} className="log-item card" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '1.25rem' }}>
                <div className="log-icon accent" style={{ background: 'var(--accent-muted)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={18} />
                </div>
                <div className="log-content" style={{ flex: 1 }}>
                  <div className="log-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {entry.action.charAt(0).toUpperCase() + entry.action.slice(1).replace(/_/g, ' ')}
                    </span>
                    <span className="text-tertiary text-xs" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="log-details text-secondary text-sm">
                    {entry.details?.title || 'System operation executed successfully'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
