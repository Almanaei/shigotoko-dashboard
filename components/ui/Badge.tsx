import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'blue' | 'gray' | 'green' | 'red';
  className?: string;
}

export function Badge({ 
  children, 
  variant = 'default', 
  className 
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-50 text-blue-600',
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
} 