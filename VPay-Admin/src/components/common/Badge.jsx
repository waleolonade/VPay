import React from 'react';
import clsx from 'clsx';
import { getStatusColor } from '../../utils/helpers';

const Badge = ({ children, variant = 'gray', className = '' }) => {
  const color = typeof variant === 'string' && ['success', 'warning', 'danger', 'info', 'gray'].includes(variant)
    ? variant
    : getStatusColor(variant);
    
  return (
    <span className={clsx('badge', `badge-${color}`, className)}>
      {children}
    </span>
  );
};

export default Badge;
