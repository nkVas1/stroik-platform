import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Текстовое поле ввода.
 * Использует внутренние тени (skeuomorphism) и жесткие рамки (brutalism).
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-brutal border-2 border-black dark:border-gray-700 bg-surface-cardLight dark:bg-surface-cardDark px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-brand focus:border-black dark:focus:border-brand-light shadow-skeuo-inner-light dark:shadow-skeuo-inner-dark disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
