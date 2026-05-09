import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getUserScope } from '../../services/accessPolicy';
import Avatar from '../ui/Avatar';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const clearSearchMarks = () => {
  document.querySelectorAll('mark.global-search-highlight').forEach(mark => {
    const text = document.createTextNode(mark.textContent || '');
    mark.replaceWith(text);
    text.parentNode?.normalize();
  });
};

const selectActiveMark = (mark, { selectText = true, scroll = true } = {}) => {
  if (!mark) return;
  document.querySelectorAll('mark.global-search-highlight.is-active').forEach(item => item.classList.remove('is-active'));
  mark.classList.add('is-active');
  if (scroll) {
    mark.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }

  if (selectText) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(mark);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

const applySearchMarks = (query, activeIndex = 0, options = {}) => {
  clearSearchMarks();
  const term = query.trim();
  if (term.length < 2) return 0;

  const root = document.querySelector('main');
  if (!root) return 0;

  const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const text = node.nodeValue || '';
      const parent = node.parentElement;
      if (!parent || !text.trim() || !regex.test(text)) return NodeFilter.FILTER_REJECT;
      regex.lastIndex = 0;
      if (parent.closest('script, style, input, textarea, select, button, mark')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    const parts = (node.nodeValue || '').split(regex);

    parts.forEach(part => {
      if (!part) return;
      if (part.toLowerCase() === term.toLowerCase()) {
        const mark = document.createElement('mark');
        mark.className = 'global-search-highlight';
        mark.textContent = part;
        fragment.appendChild(mark);
      } else {
        fragment.appendChild(document.createTextNode(part));
      }
    });

    node.parentNode?.replaceChild(fragment, node);
  });

  const marks = [...document.querySelectorAll('mark.global-search-highlight')];
  if (marks.length) selectActiveMark(marks[activeIndex % marks.length], options);
  return marks.length;
};

const TopBar = () => {
  const { user, logout, notifications } = useApp();
  const scope = getUserScope(user);
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchTimer = useRef(null);

  useEffect(() => {
    window.clearTimeout(searchTimer.current);
    clearSearchMarks();

    if (searchTerm.trim().length < 2) {
      setMatchCount(0);
      setActiveIndex(0);
      return undefined;
    }

    searchTimer.current = window.setTimeout(() => {
      setActiveIndex(0);
      setMatchCount(applySearchMarks(searchTerm, 0, { selectText: false, scroll: false }));
    }, 180);

    return () => window.clearTimeout(searchTimer.current);
  }, [searchTerm, location.pathname]);

  useEffect(() => () => clearSearchMarks(), []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    if (searchTerm.trim().length < 2) {
      clearSearchMarks();
      setMatchCount(0);
      setActiveIndex(0);
      return;
    }

    const marks = [...document.querySelectorAll('mark.global-search-highlight')];
    if (!marks.length) {
      const total = applySearchMarks(searchTerm, 0);
      setMatchCount(total);
      setActiveIndex(0);
      return;
    }

    const nextIndex = (activeIndex + 1) % marks.length;
    setActiveIndex(nextIndex);
    setMatchCount(marks.length);
    selectActiveMark(marks[nextIndex]);
  };

  return (
    <header className="top-bar" role="banner">
      <div className="top-bar-left">
        <form className="search-box" onSubmit={handleSearchSubmit} role="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Busca global..."
            aria-label="Busca global"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm.trim().length >= 2 && (
            <button type="submit" className="global-search-counter" aria-label="Ir para próximo resultado">
              {matchCount > 0 ? `${Math.min(activeIndex + 1, matchCount)}/${matchCount}` : '0'}
            </button>
          )}
        </form>
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
