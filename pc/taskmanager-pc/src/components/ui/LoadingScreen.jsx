import React, { useEffect, useState } from 'react';

const LoadingScreen = ({ onComplete, duration = 3000 }) => {
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
        </div>
        <div className="splash-loader-bar">
          <div className="splash-progress" style={{ animationDuration: `${duration}ms` }} />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
