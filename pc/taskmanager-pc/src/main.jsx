import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { TeamsProvider } from "./contexts/TeamsContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import './styles/index.css';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <NavigationProvider>
        <NotificationProvider>
          <TeamsProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </TeamsProvider>
        </NotificationProvider>
      </NavigationProvider>
    </AuthProvider>
  </React.StrictMode>,
);



