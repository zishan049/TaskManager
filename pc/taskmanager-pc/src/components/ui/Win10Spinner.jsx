import React from 'react';

const Win10Spinner = ({ size = 54, dotSize = 6 }) => {
  return (
    <div className="win10-spinner" style={{ width: size, height: size }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="win10-dot" style={{ '--dot-size': `${dotSize}px` }} />
      ))}
    </div>
  );
};

export default Win10Spinner;
