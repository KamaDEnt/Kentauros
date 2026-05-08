import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ 
  title = 'No data found', 
  description = 'Try adjusting your filters or adding new items.', 
  icon: Icon = Inbox,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center border border-dashed border-default rounded-lg bg-surface/50 ${className}`}>
      <div className="w-16 h-16 bg-raised rounded-full flex items-center justify-center mb-4 text-muted border border-subtle">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-sm text-muted max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
};

export default EmptyState;
