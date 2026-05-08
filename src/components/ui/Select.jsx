import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  id,
  error,
  searchable = false,
  className = '',
  wrapperClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`select-wrapper ${wrapperClassName} ${isOpen ? 'is-open' : ''} ${error ? 'has-error' : ''}`} ref={containerRef}>
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      
      <button
        type="button"
        id={id}
        className={`select-trigger ${className}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={!selectedOption ? 'text-muted' : ''}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} className="select-trigger-icon" />
      </button>

      {isOpen && (
        <div className="select-dropdown">
          {searchable && (
            <div className="select-search-container">
              <div className="flex items-center gap-2 px-2 py-1 bg-raised rounded-xs border border-subtle">
                <Search size={14} className="text-muted" />
                <input
                  type="text"
                  className="select-search-input"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}
          <div className="select-options-list" role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`select-option ${value === option.value ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(option)}
                  role="option"
                  aria-selected={value === option.value}
                >
                  <span>{option.label}</span>
                  {value === option.value && <Check size={14} className="text-gold" />}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-muted">No options found</div>
            )}
          </div>
        </div>
      )}

      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

export default Select;
