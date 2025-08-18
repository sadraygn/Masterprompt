'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface LuxuryCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'gradient' | 'elevated';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const LuxuryCard = forwardRef<HTMLDivElement, LuxuryCardProps>(
  ({ className, variant = 'glass', padding = 'md', hover = true, children, ...props }, ref) => {
    const paddingClasses = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    const variantClasses = {
      glass: 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border border-gray-100 dark:border-gray-800',
      gradient: 'bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700',
      elevated: 'bg-white dark:bg-gray-900 shadow-xl'
    };

    const hoverClasses = hover ? 'hover:shadow-2xl hover:scale-[1.02]' : '';

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl shadow-lg transition-all duration-300',
          paddingClasses[padding],
          variantClasses[variant],
          hoverClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

LuxuryCard.displayName = 'LuxuryCard';

const LuxuryCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4 pb-4 border-b border-gray-200 dark:border-gray-700', className)}
      {...props}
    />
  )
);

LuxuryCardHeader.displayName = 'LuxuryCardHeader';

const LuxuryCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-gray-600 dark:text-gray-300', className)} {...props} />
  )
);

LuxuryCardContent.displayName = 'LuxuryCardContent';

const LuxuryCardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 pt-4 border-t border-gray-200 dark:border-gray-700', className)}
      {...props}
    />
  )
);

LuxuryCardFooter.displayName = 'LuxuryCardFooter';

export { LuxuryCard, LuxuryCardHeader, LuxuryCardContent, LuxuryCardFooter };