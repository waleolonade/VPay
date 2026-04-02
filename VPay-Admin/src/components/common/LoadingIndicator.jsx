import React from 'react';
import loadingImg from '../../assets/loading.png';

/**
 * LoadingIndicator Component
 * Web-compatible port of the mobile LoadingIndicator
 * Displays an animated loading spinner with an optional message
 */
const LoadingIndicator = ({ message = 'Loading...', visible = true }) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/60 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col items-center justify-center relative">
        
        {/* Rolling Circle Animation */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Outer Rolling Circles (Two Colors) */}
          <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-brand-blue border-b-brand-green animate-spin-slow" />
          <div className="absolute inset-2 rounded-full border-[2px] border-transparent border-l-brand-green border-r-brand-blue animate-spin-reverse" 
               style={{ animationDuration: '3s' }} />
          
          {/* Zooming Logo */}
          <img 
            src={loadingImg} 
            alt="Loading..." 
            className="w-16 h-16 object-contain animate-zoom-pulse relative z-10"
          />
        </div>

        {message && (
          <p className="mt-8 text-lg text-white font-bold text-center tracking-wide drop-shadow-md animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingIndicator;
