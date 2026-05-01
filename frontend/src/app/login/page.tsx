'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HardHat, LogIn, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiPost, setStoredToken } from '@/lib/api';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(userId);
    if (!id || id <= 0) {
      setError('Введите корректный ID пользователя');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await apiPost<{ access_token: string }>('/api/login', { user_id: id });
      setStoredToken(res.access_token);
      router.push('/dashboard');
    } catch {
      setError('Пользователь с таким ID не найден. Проверьте номер.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark">
      <header className="px-4 md:px-8 h-16 flex items-center justify-between border-b-2 border-black bg-surface-cardLight dark:bg-surface-cardDark">
        <Link href="/" className="inline-flex items-center gap-2 font-black text-xl hover:opacity-80 transition-opacity">
          <HardHat className="h-6 w-6 text-brand" />
          <span>СТРОИК</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-surface-cardLight dark:bg-surface-cardDark border-4 border-black rounded-brutal p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,179,128,0.3)]">
            
            <div className="mb-8">
              <div className="w-14 h-14 bg-brand border-2 border-black rounded-brutal flex items-center justify-center mb-4">
                <LogIn className="h-7 w-7 text-black" />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tight">Вход</h1>
              <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mt-1">
                Введите ваш ID пользователя. Вы получили его после онбординга.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2 block">
                  ID Пользователя
                </label>
                <Input
                  type="number"
                  value={userId}
                  onChange={e => { setUserId(e.target.value); setError(''); }}
                  placeholder="Например: 1"
                  className="text-lg h-12"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border-2 border-red-500 rounded-brutal">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !userId}
                className="w-full h-12 text-base font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-2"
              >
                {isLoading ? 'Вхожу...' : 'Войти в аккаунт'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-500 text-center mb-3">Ещё не зарегистрированы?</p>
              <Link href="/onboarding">
                <Button variant="secondary" className="w-full border-2 border-black">
                  Создать профиль
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors">
              <ArrowLeft size={14} /> На главную
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
