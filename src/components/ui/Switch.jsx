import React from 'react';

const Switch = ({ label, checked, onChange, id, className = '', ...props }) => {
  return (
    <label className={`switch-container ${className}`} htmlFor={id}>
      <div className="switch-wrapper">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="switch-input"
          {...props}
        />
        <div className={`switch-slider ${checked ? 'is-checked' : ''}`}>
          <div className="switch-knob" />
        </div>
      </div>
      {label && <span className="switch-label">{label}</span>}
    </label>
  );
};

export default Switch;
