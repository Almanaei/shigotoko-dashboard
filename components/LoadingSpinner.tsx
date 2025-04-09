"use client";

import React, { memo } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'light';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

/**
 * LoadingSpinner - A versatile loading indicator component
 * Supports different sizes, colors, and an optional loading text
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = memo(({
  size = 'md',
  variant = 'default',
  className = '',
  text,
  fullScreen = false
}) => {
  // Calculate size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4 border-2';
      case 'lg': return 'h-12 w-12 border-4';
      case 'md':
      default: return 'h-8 w-8 border-3';
    }
  };

  // Calculate color classes
  const getColorClasses = () => {
    switch (variant) {
      case 'primary':
        return 'border-blue-600 border-t-transparent dark:border-blue-500 dark:border-t-transparent';
      case 'light':
        return 'border-gray-200 border-t-gray-600 dark:border-gray-700 dark:border-t-gray-300';
      case 'default':
      default:
        return 'border-gray-300 border-t-blue-500 dark:border-gray-700 dark:border-t-blue-400';
    }
  };

  // Build the spinner element
  const spinner = (
    <div className={`flex items-center justify-center ${fullScreen ? 'flex-col' : ''} ${className}`}>
      <div
        className={`${getSizeClasses()} ${getColorClasses()} rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <span className={`${fullScreen ? 'mt-4' : 'ml-3'} text-gray-600 dark:text-gray-400`}>
          {text}
        </span>
      )}
    </div>
  );

  // For full screen, add additional wrapper
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
});

// Add display name for better debugging
LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner; 