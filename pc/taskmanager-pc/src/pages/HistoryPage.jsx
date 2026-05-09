import React from 'react';
import { useHistory } from '../hooks/useHistory';
import { Activity, Clock, List, Trash2, LayoutGrid } from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';
import Win10Spinner from '../components/ui/Win10Spinner';

const HistoryPage = () => {
  const { history, loading, clearHistory } = useHistory();
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [viewMode, setViewMode] = React.useState(() => localStorage.getItem('history_view_mode') || 'list');
  const [gridSize, setGridSize] = React.useState(() => parseInt(localStorage.getItem('history_grid_size')) || 3);

  const toggleViewMode = () => {
    const newMode = viewMode === 'list' ? 'grid' : 'list';
    setViewMode(newMode);
    localStorage.setItem('history_view_mode', newMode);
  };

  const handleGridSizeChange = (e) => {
    const size = parseInt(e.target.value);
    setGridSize(size);
    localStorage.setItem('history_grid_size', size);
  };

  const handleClear = async () => {
    await clearHistory();
    setShowClearConfirm(false);
  };

  if (loading) return (
    <div className="history-loading-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '20px' }}>
      <Win10Spinner size={48} />
    </div>
  );

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
          {viewMode === 'grid' && (
            <div className="grid-size-control" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-2)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <LayoutGrid size={14} className="text-tertiary" />
              <select 
                value={gridSize} 
                onChange={handleGridSizeChange}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-primary)', 
                  fontSize: '0.8rem', 
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
                <option value={5}>5 Columns</option>
              </select>
            </div>
          )}
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
          <div 
            className={`log-list ${viewMode}-mode`} 
            style={viewMode === 'grid' ? { '--grid-columns': gridSize } : {}}
          >
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
