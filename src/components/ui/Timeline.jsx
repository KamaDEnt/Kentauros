import React from 'react';
import Badge from './Badge';

const Timeline = ({ items = [] }) => {
  if (!items.length) return null;

  const getColor = (status) => {
    if (status === 'success') return 'var(--success)';
    if (status === 'failed') return 'var(--danger)';
    return 'var(--k-blue)';
  };

  const getBadgeType = (status) => {
    if (status === 'success') return 'success';
    if (status === 'failed') return 'danger';
    return 'info';
  };

  return (
    <div className="timeline">
      {items.map((item, index) => (
        <div key={index} className="timeline-item">
          <div className="timeline-dot" style={{ background: getColor(item.status) }} />
          {index < items.length - 1 && <div className="timeline-line" />}
          <div className="timeline-content">
            <div className="flex justify-between items-center mb-xs">
              <span className="text-sm font-bold">{item.title}</span>
              <Badge variant={getBadgeType(item.status)}>{(item.status || '').toUpperCase()}</Badge>
            </div>
            <div className="text-xs text-muted mb-xs">{item.timestamp}</div>
            {item.description && <div className="text-xs text-secondary">{item.description}</div>}
            {item.meta && (
              <div className="flex gap-2 mt-sm">
                {Object.entries(item.meta).map(([key, value]) => (
                  <span key={key} className="text-xs"><span className="text-muted">{key}:</span> <span className="font-mono">{value}</span></span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
