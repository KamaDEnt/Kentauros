import React from 'react';
import { useApp } from '../../context/AppContext';

const iconMap = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
};

const Toast = () => {
  const { notifications } = useApp();

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {notifications.map(n => (
        <div key={n.id} className={`toast toast-${n.type || 'info'}`}>
          <div className="toast-icon">{iconMap[n.type] || iconMap.info}</div>
          <div>
            <div className="font-semibold text-sm">{n.title}</div>
            {n.message && <div className="text-xs text-secondary">{n.message}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toast;
