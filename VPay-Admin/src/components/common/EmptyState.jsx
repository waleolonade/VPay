import React from 'react';
import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ 
  icon = <FiInbox size={48} />, 
  title = 'No data found', 
  description,
  action 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="text-gray-400 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-md">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
