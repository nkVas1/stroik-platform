import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[];
  placeholder?: string;
}

/**
 * Select — brutalism-styled native <select> wrapper.
 * Matches Input.tsx visual system: border-2 border-black, rounded-brutal, shadow-skeuo-inner.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'flex h-12 w-full appearance-none rounded-brutal border-2 border-black dark:border-gray-700',
            'bg-surface-cardLight dark:bg-surface-cardDark px-4 pr-10 py-2 text-sm',
            'text-gray-900 dark:text-gray-100',
            'shadow-skeuo-inner-light dark:shadow-skeuo-inner-dark',
            'transition-all focus:outline-none focus:ring-2 focus:ring-brand focus:border-black dark:focus:border-brand-light',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
      </div>
    );
  }
);

Select.displayName = 'Select';
