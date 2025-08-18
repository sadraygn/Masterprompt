'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  intensity?: 'light' | 'medium' | 'strong';
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, size = 'md', intensity = 'medium', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3',
      lg: 'px-8 py-4 text-lg'
    };

    const intensityClasses = {
      light: 'backdrop-blur-sm bg-white/20 border-white/30 hover:bg-white/30',
      medium: 'backdrop-blur-md bg-white/30 border-white/40 hover:bg-white/40',
      strong: 'backdrop-blur-lg bg-white/40 border-white/50 hover:bg-white/50'
    };

    return (
      <button
        ref={ref}
        className={cn(
          'rounded-2xl border font-semibold shadow-md transition-all duration-300',
          'hover:shadow-lg hover:scale-[1.02]',
          'text-gray-900 dark:text-white',
          sizeClasses[size],
          intensityClasses[intensity],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GlassButton.displayName = 'GlassButton';

export { GlassButton };