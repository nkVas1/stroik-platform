import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

/**
 * Универсальная кнопка проекта, выполненная в стиле mix (brutalism + skeuomorphism).
 * @param variant - Визуальный стиль кнопки.
 * @param size - Размер (влияет на padding и размер шрифта).
 * @param isLoading - Состояние загрузки (блокирует кнопку).
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center font-bold rounded-brutal transition-all duration-200 active:translate-y-[2px] active:translate-x-[2px] active:shadow-none no-select disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-brand text-black border-2 border-black dark:border-brand-light shadow-mix-light dark:shadow-mix-dark hover:bg-brand-light",
      secondary: "bg-surface-cardLight dark:bg-surface-cardDark text-gray-900 dark:text-gray-100 border-2 border-black dark:border-gray-700 shadow-mix-light dark:shadow-mix-dark hover:bg-gray-50 dark:hover:bg-gray-800",
      outline: "bg-transparent border-2 border-black dark:border-brand text-black dark:text-brand hover:bg-black/5 dark:hover:bg-brand/10",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
