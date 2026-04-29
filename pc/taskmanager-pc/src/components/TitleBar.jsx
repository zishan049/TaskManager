import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import "./TitleBar.css";

const appWindow = getCurrentWindow();

function TitleBar() {
  const minimize = (e) => { e.stopPropagation(); appWindow.minimize(); };
  const toggleMaximize = (e) => { e.stopPropagation(); appWindow.toggleMaximize(); };
  const close = (e) => { e.stopPropagation(); appWindow.close(); };

  const handleDrag = (e) => {
    // Only drag if we didn't click a button
    if (!e.target.closest('.titlebar-button')) {
      e.stopPropagation();
      appWindow.startDragging();
    }
  };

  return (
    <div 
      className="titlebar"
      onMouseDown={handleDrag}
      onDoubleClick={toggleMaximize}
    >
      <div className="titlebar-label">
        <img src="/favicon.svg" alt="" className="titlebar-logo" />
        <span className="tech-accent">●</span> TASKMANAGER // DESKTOP
      </div>
      <div data-tauri-drag-region className="titlebar-actions">
        <div className="titlebar-button" onClick={minimize} title="Minimize">
          <Minus size={14} />
        </div>
        <div className="titlebar-button" onClick={toggleMaximize} title="Maximize">
          <Square size={12} />
        </div>
        <div className="titlebar-button close" onClick={close} title="Close">
          <X size={14} />
        </div>
      </div>
    </div>
  );
}

export default TitleBar;
