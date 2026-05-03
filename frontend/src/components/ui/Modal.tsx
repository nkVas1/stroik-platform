'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Max width preset */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

/**
 * Modal — brutalism-styled accessible dialog.
 * Closes on Escape key or backdrop click.
 */
export function Modal({ open, onClose, title, description, children, className, size = 'md' }: ModalProps) {
  // Escape key handler
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent scroll when open
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full rounded-brutal border-2 border-black',
          'bg-surface-cardLight dark:bg-surface-cardDark',
          'shadow-brutal-light dark:shadow-brutal-dark',
          'animate-in fade-in zoom-in-95 duration-150',
          sizes[size],
          className,
        )}
      >
        {/* Header */}
        {(title || description) && (
          <div className="border-b-2 border-black p-5">
            {title && (
              <h2 id="modal-title" className="font-black text-base uppercase tracking-wide">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-xs font-bold text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-3 top-3 p-1 rounded-brutal border-2 border-transparent hover:border-black hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
