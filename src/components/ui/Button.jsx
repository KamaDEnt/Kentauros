import React from 'react';

const Button = ({ children, variant = 'primary', size = 'md', icon: IconProp, loading, className = '', ...props }) => {
  const classes = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    loading ? 'btn-loading' : '',
    className
  ].filter(Boolean).join(' ');

  // Suporta tanto componente (ex: icon={Zap}) quanto elemento JSX (ex: icon={<Zap />})
  const renderIcon = () => {
    if (!IconProp || loading) return null;
    if (React.isValidElement(IconProp)) return IconProp;
    const Icon = IconProp;
    return <Icon size={size === 'sm' ? 14 : 16} />;
  };

  return (
    <button className={classes} disabled={loading || props.disabled} {...props}>
      {loading && (
        <svg className="btn-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
          <circle cx="12" cy="12" r="10" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
      )}
      {renderIcon() && <span className="btn-icon-slot flex items-center justify-center" aria-hidden="true">{renderIcon()}</span>}
      {children}
    </button>
  );
};

export default Button;
