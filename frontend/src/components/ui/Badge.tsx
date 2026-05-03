import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:  'bg-black text-white border-black',
  success:  'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-500',
  warning:  'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-500',
  danger:   'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-500',
  info:     'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-500',
  outline:  'bg-transparent text-gray-700 dark:text-gray-300 border-gray-400 dark:border-gray-600',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[9px] px-1.5 py-0.5',
  md: 'text-[10px] px-2 py-0.5',
};

/**
 * Badge — brutalism-style status/label chip.
 * Uses border-2 + rounded-brutal consistent with the design system.
 */
export function Badge({ variant = 'default', size = 'md', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-black uppercase rounded-brutal border-2 tracking-wide',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
