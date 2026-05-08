import React from 'react';

const Input = ({ 
  label, 
  id, 
  error, 
  icon: Icon, 
  rightIcon: RightIcon,
  className = '', 
  wrapperClassName = '', 
  ...props 
}) => {
  return (
    <div className={`input-wrapper ${wrapperClassName} ${error ? 'has-error' : ''}`}>
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      <div className="input-field-container">
        {Icon && (
          <div className="input-icon-left">
            <Icon size={18} />
          </div>
        )}
        <input
          id={id}
          className={`input-field ${Icon ? 'has-icon-left' : ''} ${RightIcon ? 'has-icon-right' : ''} ${className}`}
          {...props}
        />
        {RightIcon && (
          <div className="input-icon-right">
            <RightIcon size={18} />
          </div>
        )}
      </div>
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

export default Input;
