import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea — brutalism-styled multiline input.
 * Visually consistent with Input.tsx.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={props.rows ?? 4}
        className={cn(
          'flex w-full rounded-brutal border-2 border-black dark:border-gray-700',
          'bg-surface-cardLight dark:bg-surface-cardDark px-4 py-3 text-sm',
          'text-gray-900 dark:text-gray-100 placeholder:text-gray-500',
          'shadow-skeuo-inner-light dark:shadow-skeuo-inner-dark',
          'transition-all resize-y focus:outline-none focus:ring-2 focus:ring-brand',
          'focus:border-black dark:focus:border-brand-light',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
