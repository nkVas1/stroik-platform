'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let _counter = 0;

const ICONS = {
  success: <CheckCircle size={18} className="text-green-600 shrink-0" />,
  error: <XCircle size={18} className="text-red-500 shrink-0" />,
  info: <AlertCircle size={18} className="text-brand shrink-0" />,
};

const STYLES = {
  success: 'border-green-500 bg-green-50 dark:bg-green-900/40',
  error: 'border-red-500 bg-red-50 dark:bg-red-900/40',
  info: 'border-brand bg-amber-50 dark:bg-gray-800',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((type: ToastType, message: string) => {
    const id = ++_counter;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const value: ToastContextValue = {
    success: (msg) => push('success', msg),
    error: (msg) => push('error', msg),
    info: (msg) => push('info', msg),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Portal-like fixed container */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 border-2 rounded-brutal shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-200 ${STYLES[t.type]}`}
          >
            {ICONS[t.type]}
            <p className="text-sm font-bold flex-1 text-gray-900 dark:text-gray-100">{t.message}</p>
            <button onClick={() => remove(t.id)} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
