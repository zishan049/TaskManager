import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', cancelText = 'Cancel', type = 'danger', singleButton = false }) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="modal-overlay-custom" onClick={singleButton ? onConfirm : onCancel}>
      <div className="modal-content-custom" onClick={e => e.stopPropagation()}>
        <div className="modal-header-custom">
          <div className={`modal-icon-wrap ${type}`}>
            <AlertCircle size={24} />
          </div>
          <button onClick={singleButton ? onConfirm : onCancel} className="modal-close-btn-custom">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body-custom">
          <h2 className="modal-title-custom">{title}</h2>
          <p className="modal-message-custom">{message}</p>
        </div>
        <div className="modal-footer-custom" style={singleButton ? { justifyContent: 'center' } : {}}>
          {!singleButton && (
            <button onClick={onCancel} className="modal-btn-secondary">
              {cancelText}
            </button>
          )}
          <button onClick={onConfirm} className={`modal-btn-primary ${type}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ConfirmModal;
