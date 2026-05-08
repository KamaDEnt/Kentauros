import React from 'react';

const Card = ({ title, children, footer, className = '', headerActions, hoverable = false, ...props }) => {
  return (
    <div className={`card ${hoverable ? 'hoverable' : ''} ${className}`} {...props}>
      {(title || headerActions) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {headerActions && <div className="card-header-actions">{headerActions}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer mt-4 pt-4 border-t">{footer}</div>}
    </div>
  );
};

export default Card;
