"use client";

import React, { useState, memo } from 'react';
import { User } from '@/lib/DashboardProvider';
import Image from 'next/image';

interface AvatarProps {
  user: Partial<User> | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * MemoizedAvatar - A performance-optimized avatar component that prevents 
 * unnecessary re-renders while providing proper error handling
 */
const MemoizedAvatar: React.FC<AvatarProps> = memo(({ 
  user, 
  size = 'md', 
  className = '' 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Get size in pixels based on the size prop
  const getSizeClass = () => {
    switch(size) {
      case 'sm': return 'h-8 w-8';
      case 'lg': return 'h-12 w-12';
      case 'md':
      default: return 'h-10 w-10';
    }
  };
  
  // Create fallback avatar with initials
  const getInitials = () => {
    const name = user?.name || 'User';
    if (!name || typeof name !== 'string') return 'U';
    
    try {
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U';
    } catch (err) {
      return 'U';
    }
  };
  
  // Get background color based on the user name (consistent for same user)
  const getColorClass = () => {
    if (!user?.name) return 'bg-blue-500';
    
    // Simple hash function to get a consistent color based on user name
    const hash = user.name.split('').reduce(
      (hash, char) => (hash * 31 + char.charCodeAt(0)) & 0xFFFFFFFF, 
      0
    );
    
    // Array of Tailwind color classes
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-red-500', 'bg-yellow-500', 'bg-indigo-500',
      'bg-pink-500', 'bg-teal-500'
    ];
    
    return colors[hash % colors.length];
  };
  
  // Check if avatar is valid
  const isValidAvatar = Boolean(
    user?.avatar && 
    typeof user.avatar === 'string' &&
    (
      user.avatar.startsWith('data:image/') || 
      user.avatar.startsWith('http') ||
      user.avatar.startsWith('/')
    )
  );
  
  // If avatar is not valid or has error, show initials
  if (!isValidAvatar || imageError) {
    return (
      <div 
        className={`${getSizeClass()} ${getColorClass()} rounded-full flex items-center justify-center text-white font-medium ${className}`}
        title={user?.name || 'User'}
        data-testid="avatar-initials"
      >
        {getInitials()}
      </div>
    );
  }
  
  // Show the avatar image with fallback
  return (
    <div className={`${getSizeClass()} relative rounded-full overflow-hidden ${className}`}>
      <Image
        src={user?.avatar || ''}
        alt={user?.name || 'User'}
        width={size === 'sm' ? 32 : size === 'lg' ? 48 : 40}
        height={size === 'sm' ? 32 : size === 'lg' ? 48 : 40}
        className={`${getSizeClass()} object-cover border border-gray-200 dark:border-gray-700`}
        onError={() => setImageError(true)}
        data-testid="avatar-image"
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if avatar or user name changes
  return (
    prevProps.user?.avatar === nextProps.user?.avatar &&
    prevProps.user?.name === nextProps.user?.name &&
    prevProps.size === nextProps.size
  );
});

// Add display name for debugging
MemoizedAvatar.displayName = 'MemoizedAvatar';

export default MemoizedAvatar; 