'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function DashboardClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('stroik_token');
    
    // Если нет токена, перенаправляем на онбординг
    if (!token) {
      router.push('/onboarding');
      return;
    }

    // Имитируем загрузку профиля (в будущем будет fetch к /api/users/me)
    setTimeout(() => {
      setUserData({
        role: 'Мастер',
        name: 'Пользователь',
        specialization: 'Установка и отделка',
        experience_years: 5,
      });
      setIsLoading(false);
    }, 800);
  }, [router]);

  if (isLoading) {
    return (
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-black border-t-brand rounded-full animate-spin mb-4"></div>
          <p className="font-bold text-lg">ЗАГРУЗКА ПРОФИЛЯ...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        <div className="bg-red-100 border-2 border-red-500 rounded-brutal p-6 text-red-900 font-bold">
          ❌ {error}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      {/* Welcome Banner */}
      <section className="bg-brand text-black border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Добро пожаловать!</h1>
          <p className="font-medium mt-1 text-black/80">
            {userData?.role === 'Мастер' 
              ? 'Ваш профиль настроен. Начните искать проекты.' 
              : 'Ваш профиль настроен. Начните искать специалистов.'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border-2 border-black shadow-skeuo-inner-light">
          <span className="text-2xl">✓</span>
          <span className="font-bold">Профиль готов</span>
        </div>
      </section>

      {/* Main Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black dark:border-gray-700 rounded-brutal shadow-mix-light dark:shadow-mix-dark p-6">
          <div className="flex items-center gap-3 mb-4">
            <Search className="h-6 w-6 text-brand" />
            <h2 className="text-xl font-bold">Подходящие предложения</h2>
          </div>
          <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-brutal text-center text-gray-500">
            Система анализирует ваш профиль ({userData?.specialization}) и подбирает лучшие варианты...
          </div>
        </div>

        <div className="col-span-1 space-y-6">
          <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black dark:border-gray-700 rounded-brutal shadow-mix-light dark:shadow-mix-dark p-6">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              <h2 className="text-lg font-bold">Ваша статистика</h2>
            </div>
            <ul className="space-y-2 mt-4 text-sm font-medium">
              <li className="flex justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                <span>Активные сделки:</span> <span className="font-bold">0</span>
              </li>
              <li className="flex justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                <span>Завершено:</span> <span className="font-bold">0</span>
              </li>
              <li className="flex justify-between pb-2">
                <span>Опыт:</span> <span className="font-bold">{userData?.experience_years} лет</span>
              </li>
            </ul>
          </div>
          <Button className="w-full h-14 text-lg">Каталог заявок</Button>
        </div>
      </section>
    </main>
  );
}
