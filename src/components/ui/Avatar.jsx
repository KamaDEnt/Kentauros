import React from 'react';

const Avatar = ({ name = 'U', src, size = 'md' }) => {
  const initials = name.split(' ').map(i => i[0]).join('').substring(0, 2).toUpperCase();
  const sizeClass = `avatar-${size}`;

  return (
    <div className={`avatar ${sizeClass}`} aria-label={name} title={name}>
      {src ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
      ) : initials}
    </div>
  );
};

export default Avatar;
