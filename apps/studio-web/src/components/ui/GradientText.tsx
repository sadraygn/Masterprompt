'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface GradientTextProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'rainbow' | 'ocean' | 'sunset' | 'forest' | 'cosmic';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  animate?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
}

const GradientText = forwardRef<HTMLSpanElement, GradientTextProps>(
  ({ className, variant = 'rainbow', size = 'md', animate = false, as: Component = 'span', children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl'
    };

    const variantClasses = {
      rainbow: 'from-indigo-500 via-purple-500 to-pink-500',
      ocean: 'from-blue-400 via-cyan-500 to-teal-600',
      sunset: 'from-orange-400 via-red-500 to-pink-600',
      forest: 'from-green-400 via-emerald-500 to-teal-600',
      cosmic: 'from-purple-400 via-violet-500 to-indigo-600'
    };

    const animateClass = animate ? 'bg-[length:200%_auto] animate-gradient' : '';

    const Element = Component as any;

    return (
      <Element
        ref={ref}
        className={cn(
          'bg-gradient-to-r bg-clip-text text-transparent font-bold',
          sizeClasses[size],
          variantClasses[variant],
          animateClass,
          className
        )}
        {...props}
      >
        {children}
      </Element>
    );
  }
);

GradientText.displayName = 'GradientText';

export { GradientText };