import React from 'react';
import { Check } from 'lucide-react';

const Checkbox = ({ label, checked, onChange, id, className = '', ...props }) => {
  return (
    <label className={`checkbox-container ${className}`} htmlFor={id}>
      <div className="checkbox-wrapper">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="checkbox-input"
          {...props}
        />
        <div className={`checkbox-custom ${checked ? 'is-checked' : ''}`}>
          {checked && <Check size={14} strokeWidth={3} />}
        </div>
      </div>
      {label && <span className="checkbox-label">{label}</span>}
    </label>
  );
};

export default Checkbox;
