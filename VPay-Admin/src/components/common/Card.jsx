import React from 'react';
import clsx from 'clsx';

const Card = ({ children, title, action, className = '', noPadding = false }) => {
  return (
    <div className={clsx('card', noPadding && 'p-0', className)}>
      {(title || action) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'card-body'}>
        {children}
      </div>
    </div>
  );
};

export default Card;
