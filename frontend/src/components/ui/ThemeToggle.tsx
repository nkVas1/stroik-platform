'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from './Button';

/**
 * Кнопка переключения цветовой темы (Светлая / Темная).
 * Избегает ошибки гидратации, рендерясь только после монтирования на клиенте.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // useEffect гарантирует, что компонент смонтирован на клиенте
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Возвращаем заглушку того же размера, чтобы избежать скачков верстки
    return <div className="w-10 h-10" aria-hidden="true" />;
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="w-10 h-10 p-0 rounded-full flex items-center justify-center"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Переключить тему"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-brand" />
      ) : (
        <Moon className="h-5 w-5 text-gray-900" />
      )}
    </Button>
  );
}
