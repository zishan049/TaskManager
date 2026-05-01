import React from 'react';
import { useHistory } from '../hooks/useHistory';
import { Activity, Clock, List, Trash2, LayoutGrid } from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';

const HistoryPage = () => {
  const { history, loading, clearHistory } = useHistory();
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [viewMode, setViewMode] = React.useState(() => localStorage.getItem('history_view_mode') || 'list');

  const toggleViewMode = () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    localStorage.setItem('history_view_mode', newMode);
  };

  const handleClear = async () => {
    await clearHistory();
    setShowClearConfirm(false);
  };

  if (loading) return (<div className="loading-screen"><div className="loader"></div><p className="text-secondary text-sm">Loading history...</p></div>);

  return (
    <div className="history-page page-enter">
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Activity History</h2>
          <p className="text-secondary text-sm">A record of your recent actions and changes.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary view-mode-toggle" 
            onClick={toggleViewMode} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 12px' }}
            title={viewMode === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
          >

            {viewMode === 'list' ? <LayoutGrid size={16} /> : <List size={16} />}
            {viewMode === 'list' ? 'Grid View' : 'List View'}
          </button>
          {history.length > 0 && (
            <button className="btn btn-secondary danger-hover" onClick={() => setShowClearConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 16px' }}>
              <Trash2 size={16} /> Clear History
            </button>
          )}
        </div>
      </div>
      <div className="logs-container">
        {history.length === 0 ? (
          <div className="empty-logs" style={{ textAlign: 'center', padding: '4rem 0', opacity: 0.5 }}>
            <List size={48} style={{ marginBottom: '1rem' }} /><p className="text-secondary">No activity recorded yet.</p>
          </div>
        ) : (
          <div className={`log-list ${viewMode}-mode`}>
            {history.map(entry => (
              <div key={entry.id} className="log-item card">
                <div className="log-icon accent">
                  <Activity size={18} />
                </div>
                <div className="log-content">
                  <div className="log-header">
                    <span className="log-action">{entry.action.charAt(0).toUpperCase() + entry.action.slice(1).replace(/_/g, ' ')}</span>
                    <span className="text-tertiary text-xs log-date">
                      <Clock size={12} /> {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="log-details text-secondary text-sm">{entry.details?.title || 'System operation executed successfully'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmModal 
        isOpen={showClearConfirm}
        title="Clear History?"
        message="Are you sure you want to clear your entire activity history? This action cannot be undone."
        onConfirm={handleClear}
        onCancel={() => setShowClearConfirm(false)}
        confirmText="Clear History"
        type="danger"
      />
    </div>
  );
};

export default HistoryPage;
