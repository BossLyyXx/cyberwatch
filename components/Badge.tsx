
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'info' | 'success' | 'warning' | 'danger' | 'default';
}

const Badge: React.FC<BadgeProps> = ({ children, color = 'default' }) => {
  const colorStyles = {
    info: 'bg-info/20 text-info',
    success: 'bg-success/20 text-success',
    warning: 'bg-warning/20 text-warning',
    danger: 'bg-danger/20 text-danger',
    default: 'bg-brand-300/50 text-brand-800',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorStyles[color]}`}>
      {children}
    </span>
  );
};

export default Badge;
