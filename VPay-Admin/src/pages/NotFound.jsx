import React from 'react';
import { Link } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';
import Button from '../components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-full flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-gray-600 mt-2 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button icon={<FiHome />}>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
