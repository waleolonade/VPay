import React from 'react';
import clsx from 'clsx';

const Input = ({ 
  label, 
  error, 
  type = 'text', 
  className = '', 
  containerClassName = '',
  icon,
  ...props 
}) => {
  return (
    <div className={clsx('mb-4', containerClassName)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={clsx(
            'input',
            error && 'input-error',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default Input;
