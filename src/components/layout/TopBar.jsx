import React from 'react';
import { useApp } from '../../context/AppContext';
import { getUserScope } from '../../services/accessPolicy';
import Avatar from '../ui/Avatar';

const TopBar = () => {
  const { user, logout, notifications } = useApp();
  const scope = getUserScope(user);

  return (
    <header className="top-bar" role="banner">
      <div className="top-bar-left">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Busca global..." aria-label="Busca global" />
        </div>
      </div>

      <div className="top-bar-right">
        <button className="notification-bell" aria-label={`Notificações${notifications.length > 0 ? ` (${notifications.length} novas)` : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {notifications.length > 0 && <span className="notification-dot" aria-hidden="true" />}
        </button>

        <div className="divider-v" aria-hidden="true" />

        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role} • {scope}</span>
          </div>
          <Avatar name={user?.name || 'User'} size="md" />
          <button onClick={logout} className="logout-btn" title="Logout" aria-label="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
