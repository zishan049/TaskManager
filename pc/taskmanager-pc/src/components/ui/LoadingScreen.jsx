import React, { useEffect, useState } from 'react';

const LoadingScreen = ({ onComplete, duration = 3000, title = "TaskManager", status = "Organizing your workspace..." }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 800);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

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
          <div className="splash-logo-glow" />
        </div>
        <div className="splash-text">
          <h1 className="splash-title">{title}</h1>
          <div className="splash-loader-bar">
            <div className="splash-progress" style={{ animationDuration: `${duration}ms` }} />
          </div>
          <p className="splash-status">{status}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
