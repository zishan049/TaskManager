import React, { useEffect, useState } from 'react';
import Win10Spinner from './Win10Spinner';

const LoadingScreen = ({ onComplete, duration = 3000, title, status, isLogout = false }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out only when the main duration is finished
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration);

    // Call onComplete after the 800ms CSS transition finishes
    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration + 800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo-container">
          <img src="/favicon.svg" alt="Logo" className="splash-logo" />
        </div>
        
        {title && <h1 className="splash-title">{title}</h1>}
        
        {isLogout ? (
          <div className="splash-loader-bar">
            <div className="splash-progress" style={{ animationDuration: `${duration}ms` }} />
          </div>
        ) : (
          <Win10Spinner />
        )}

        {status && <p className="splash-status">{status}</p>}
      </div>
    </div>
  );
};

export default LoadingScreen;
