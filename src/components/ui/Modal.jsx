import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import Button from './Button';

const Modal = ({ isOpen, onClose, title, children, actions, size = 'md' }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    // Focus trap - focus modal on open
    if (modalRef.current) modalRef.current.focus();

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={`modal-box modal-${size}`} onClick={e => e.stopPropagation()} ref={modalRef} tabIndex={-1}>
        <div className="modal-header">
          <h3 id="modal-title">{title}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="btn-icon"
            onClick={onClose} 
            aria-label="Fechar modal"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            }
          />
        </div>
        <div className="modal-body">{children}</div>
        {actions && (
          <div className="modal-footer flex justify-end gap-2 mt-6 pt-4 border-t">
            {actions}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
