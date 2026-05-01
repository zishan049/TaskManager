import React, { createContext, useContext, useState, useEffect } from 'react';

const NavigationContext = createContext({});

export const NavigationProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('taskmanager_view') || 'home');

  const handleViewChange = (view) => {
    setCurrentView(view);
    localStorage.setItem('taskmanager_view', view);
  };

  return (
    <NavigationContext.Provider value={{ currentView, setCurrentView: handleViewChange }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
