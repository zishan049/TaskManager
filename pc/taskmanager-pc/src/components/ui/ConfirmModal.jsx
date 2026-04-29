import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', cancelText = 'Cancel', type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-custom" onClick={onCancel}>
      <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
        <div className="modal-header-custom">
          <div className={`modal-icon-wrap ${type}`}>
            <AlertCircle size={24} />
          </div>
          <button onClick={onCancel} className="modal-close-btn-custom">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body-custom">
          <h2 className="modal-title-custom">{title}</h2>
          <p className="modal-message-custom">{message}</p>
        </div>
        <div className="modal-footer-custom">
          <button onClick={onCancel} className="modal-btn-secondary">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`modal-btn-primary ${type}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
