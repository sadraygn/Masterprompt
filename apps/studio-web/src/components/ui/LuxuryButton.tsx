'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface LuxuryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gradient' | 'glass' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
}

const LuxuryButton = forwardRef<HTMLButtonElement, LuxuryButtonProps>(
  ({ 
    className, 
    variant = 'gradient', 
    size = 'md',
    gradientFrom = 'from-indigo-500',
    gradientVia = 'via-purple-500',
    gradientTo = 'to-pink-500',
    children, 
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3',
      lg: 'px-8 py-4 text-lg'
    };

    const baseClasses = 'rounded-2xl font-semibold transition-all duration-300';

    const variantClasses = {
      gradient: `bg-gradient-to-r ${gradientFrom} ${gradientVia} ${gradientTo} text-white shadow-lg hover:shadow-2xl hover:scale-105`,
      glass: 'backdrop-blur-md bg-white/30 border border-white/40 text-gray-900 shadow-md hover:bg-white/40 hover:shadow-lg',
      glow: `bg-gradient-to-r ${gradientFrom} ${gradientVia} ${gradientTo} text-white shadow-lg hover:shadow-2xl hover:scale-105 relative overflow-hidden before:absolute before:inset-0 before:bg-white/20 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700`
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

LuxuryButton.displayName = 'LuxuryButton';

export { LuxuryButton };