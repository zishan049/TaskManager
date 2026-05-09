import React from 'react';
import { RefreshCw, Clock } from 'lucide-react';

const DashboardSettings = ({ dashboardSettings, onToggleClock, onToggleHourFormat }) => {
  return (
    <div className="card">
      <div className="card-title">
        <RefreshCw size={18} />
        <span>Dashboard Preferences</span>
      </div>
      <p className="text-secondary text-sm" style={{ marginTop: '0.5rem' }}>
        Customize your primary workstation view.
      </p>
      
      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ 
          background: 'transparent', 
          padding: '1rem 0', 
          borderRadius: '0', 
          borderBottom: '1px solid var(--border-color)',
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
              onChange={onToggleClock}
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', padding: '1rem 0', borderRadius: '0', borderBottom: '1px solid var(--border-color)' }}>
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
              onChange={onToggleHourFormat}
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
  );
};

export default DashboardSettings;
