import React from 'react';

const StatCard = ({ label, value, change, trend = 'neutral', icon }) => {
  return (
    <div className="card hoverable flex flex-col gap-2">
      <div className="text-sm font-medium text-secondary uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold text-primary">{value}</div>
      {change && (
        <div className={`text-xs font-semibold ${trend === 'up' ? 'text-success' : trend === 'down' ? 'text-danger' : 'text-muted'}`}>
          {trend === 'up' && '↑ '}{trend === 'down' && '↓ '}{change}
        </div>
      )}
    </div>
  );
};

export default StatCard;
