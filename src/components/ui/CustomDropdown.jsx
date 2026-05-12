// CustomDropdown - Componente de dropdown com portal para evitar problemas de z-index
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown, Search, Check, X } from 'lucide-react';

/**
 * CustomDropdown - Dropdown robusto com:
 * - Renderização via Portal para evitar z-index issues
 * - Suporte a busca/filtragem
 * - Navegação por teclado
 * - Animações suaves
 * - Multi-select opcional
 */
export const CustomDropdown = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Selecione...',
  id,
  searchable = false,
  clearable = false,
  disabled = false,
  className = '',
  renderOption = null, // Função customizada para renderizar opções
  groupBy = null, // Agrupar opções por campo
  icon: IconComponent = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Filter options based on search
  const filteredOptions = searchTerm
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (opt.searchTerms && opt.searchTerms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())))
      )
    : options;

  // Group options if specified
  const groupedOptions = groupBy
    ? filteredOptions.reduce((acc, opt) => {
        const group = opt[groupBy] || 'Outros';
        if (!acc[group]) acc[group] = [];
        acc[group].push(opt);
        return acc;
      }, {})
    : { 'default': filteredOptions };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const flatOptions = groupBy
      ? Object.values(groupedOptions).flat()
      : filteredOptions;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < flatOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : flatOptions.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (highlightedIndex >= 0 && flatOptions[highlightedIndex]) {
          handleSelect(flatOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  }, [isOpen, highlightedIndex, filteredOptions, groupBy, groupedOptions]);

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  // Get dropdown position
  const getDropdownPosition = () => {
    if (!containerRef.current) return { top: 0, left: 0, width: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    };
  };

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="custom-dropdown-portal"
      style={{
        position: 'fixed',
        top: `${getDropdownPosition().top}px`,
        left: `${getDropdownPosition().left}px`,
        width: `${getDropdownPosition().width}px`,
        zIndex: 9999,
      }}
    >
      <div className="custom-dropdown-panel">
        {searchable && (
          <div className="custom-dropdown-search">
            <Search size={16} className="text-muted" />
            <input
              ref={searchInputRef}
              type="text"
              className="custom-dropdown-search-input"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
            />
            {searchTerm && (
              <button
                type="button"
                className="custom-dropdown-search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        <div className="custom-dropdown-options">
          {filteredOptions.length > 0 ? (
            Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <div key={group} className="custom-dropdown-group">
                {group !== 'default' && groupBy && (
                  <div className="custom-dropdown-group-label">{group}</div>
                )}
                {groupOptions.map((option, index) => {
                  const globalIndex = filteredOptions.indexOf(option);
                  return (
                    <div
                      key={option.value}
                      className={`custom-dropdown-option ${
                        value === option.value ? 'is-selected' : ''
                      } ${highlightedIndex === globalIndex ? 'is-highlighted' : ''}`}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setHighlightedIndex(globalIndex)}
                      role="option"
                      aria-selected={value === option.value}
                    >
                      {renderOption ? (
                        renderOption(option)
                      ) : (
                        <>
                          <div className="custom-dropdown-option-content">
                            {option.icon && <span className="custom-dropdown-option-icon">{option.icon}</span>}
                            <div>
                              <div className="custom-dropdown-option-label">{option.label}</div>
                              {option.description && (
                                <div className="custom-dropdown-option-description">{option.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="custom-dropdown-option-actions">
                            {option.count !== undefined && (
                              <span className="custom-dropdown-option-count">{option.count}</span>
                            )}
                            {value === option.value && <Check size={16} className="text-k-gold-500" />}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="custom-dropdown-empty">
              <span>Nenhuma opção encontrada</span>
              {searchTerm && (
                <span className="text-muted text-xs">Tente buscar por outro termo</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`custom-dropdown-container ${className} ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label htmlFor={id} className="input-label">{label}</label>
      )}

      <button
        type="button"
        id={id}
        className="custom-dropdown-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="custom-dropdown-trigger-content">
          {IconComponent && <IconComponent size={16} className="text-muted" />}
          <span className={!selectedOption ? 'text-muted' : ''}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <div className="custom-dropdown-trigger-actions">
          {clearable && value && (
            <span
              className="custom-dropdown-clear"
              onClick={handleClear}
              role="button"
              aria-label="Limpar seleção"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown size={16} className={`custom-dropdown-arrow ${isOpen ? 'is-open' : ''}`} />
        </div>
      </button>

      {isOpen && ReactDOM.createPortal(dropdownContent, document.body)}
    </div>
  );
};

export default CustomDropdown;