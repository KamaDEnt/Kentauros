import React from 'react';

const Textarea = ({ label, id, error, className = '', wrapperClassName = '', ...props }) => {
  return (
    <div className={`input-wrapper ${wrapperClassName} ${error ? 'has-error' : ''}`}>
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      <textarea
        id={id}
        className={`input-field min-h-[120px] resize-y ${className}`}
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

export default Textarea;
