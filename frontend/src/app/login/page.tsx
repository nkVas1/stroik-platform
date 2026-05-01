'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { API_URL } from '@/lib/api';

/**
 * /login — ручной вход по user_id (DEV-режим).
 *
 * Принципы:
 * - inline-error блок вместо alert() (более профессионально + a11y);
 * - Состояние загрузки с дизейблом формы и спиннером — нет «двойных кликов»;
 * - Подсказка "DEV ONLY" честно сообщает пользователю про временный режим;
 * - Карточка центрируется по высоте viewport за счёт flex-1 + grid place-items-center.
 */
export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: parseInt(userId, 10) }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('stroik_token', data.access_token);
        router.push('/dashboard');
      } else {
        setError('Пользователь с таким ID не найден. Попробуйте 1, 2 или 3.');
      }
    } catch {
      setError('Не удалось связаться с сервером. Проверьте интернет-соединение.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark">
      <SiteHeader showBackHome />

      <main className="flex-1 grid place-items-center px-4 py-10 bg-blueprint">
        <div
          className="w-full max-w-md bg-white dark:bg-gray-900 border-4 border-black rounded-brutal
                     shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                     dark:shadow-[8px_8px_0px_0px_rgba(255,179,128,0.3)]
                     p-7 md:p-9"
        >
          {/* Иконка-замок */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-brand text-black border-4 border-black rounded-brutal
                            flex items-center justify-center shadow-skeuo-inner-light">
              <Lock className="h-8 w-8" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black uppercase text-center tracking-tight">
            Вход в систему
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
            DEV-режим: войдите по числовому ID (например <span className="font-black">1</span>,{' '}
            <span className="font-black">2</span> или <span className="font-black">3</span>).
          </p>

          <form onSubmit={handleLogin} className="mt-7 space-y-4" noValidate>
            <label className="block">
              <span className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5 block">
                User ID
              </span>
              <Input
                type="number"
                inputMode="numeric"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="123"
                disabled={isLoading}
                className="text-center text-xl font-black h-14"
                aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined}
                required
                autoFocus
              />
            </label>

            {error && (
              <p
                id="login-error"
                role="alert"
                className="text-sm font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40
                           border-2 border-red-300 dark:border-red-800 rounded-brutal px-3 py-2"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading || !userId.trim()}
              className="w-full h-14 text-lg gap-2 border-2 border-black
                         shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5
                         hover:shadow-none transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Проверка...
                </>
              ) : (
                <>
                  Войти <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-7 pt-5 border-t-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
            <Link
              href="/onboarding"
              className="text-sm font-bold text-brand hover:underline underline-offset-4"
            >
              Нет аккаунта? Создайте профиль через ИИ →
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
