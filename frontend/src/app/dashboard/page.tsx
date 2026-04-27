'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HardHat, Briefcase, Search, ShieldCheck, LogOut, User as UserIcon, Building, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

type UserProfile = {
  id: number;
  is_verified: boolean;
  role: 'worker' | 'employer' | 'unknown';
  specialization: string | null;
  experience_years: number | null;
  project_scope: string | null;
  created_at: string | null;
  verification_level: number;
  entity_type: string;
  fio: string | null;
  company_name: string | null;
  language_proficiency: string | null;
  work_authorization: string | null;
};

type Project = {
  id: number;
  title: string;
  description: string;
  budget: number;
  specialization: string;
  created_at: string;
  employer_id: number;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('stroik_token');
      if (!token) {
        router.push('/onboarding');
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:8000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Токен недействителен или истек`);
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(String(err));
        localStorage.removeItem('stroik_token');
        setTimeout(() => router.push('/onboarding'), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchProjects = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/projects');
        if (!response.ok) {
          throw new Error('Ошибка загрузки проектов');
        }
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        console.error('Projects fetch error:', err);
        // Не прерываем загрузку профиля, если проекты не загружены
      }
    };

    fetchProfile();
    fetchProjects();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('stroik_token');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <HardHat className="h-12 w-12 text-brand" />
          <p className="font-bold text-lg">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <div className="max-w-md text-center">
          <div className="bg-red-100 dark:bg-red-900 border-2 border-red-500 rounded-brutal p-6 mb-4">
            <p className="font-bold text-red-900 dark:text-red-100">❌ Ошибка загрузки профиля</p>
            <p className="text-sm mt-2 opacity-80">{error || 'Неизвестная ошибка'}</p>
          </div>
          <p className="text-sm opacity-60">Перенаправление на онбординг...</p>
        </div>
      </div>
    );
  }

  const isWorker = profile.role === 'worker';

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark">
      {/* Хедер */}
      <header className="p-4 border-b-2 border-black dark:border-gray-800 bg-surface-cardLight dark:bg-surface-cardDark flex justify-between items-center sticky top-0 z-50 shadow-brutal-light dark:shadow-brutal-dark">
        <Link href="/" className="inline-flex items-center gap-2 font-black text-xl tracking-tighter hover:opacity-80 transition-opacity">
          <HardHat className="h-6 w-6 text-brand" />
          <span>СТРОИК <span className="text-sm font-bold text-gray-500 uppercase">/ Кабинет</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout} 
            className="gap-2 border-2 border-black"
          >
            <LogOut size={16} /> Выход
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Карточка профиля пользователя */}
        <section className="bg-brand text-black border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center shadow-skeuo-inner-light">
              {isWorker ? <UserIcon size={32} /> : <Building size={32} />}
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">
                {isWorker ? '🔨 Специалист' : '🏢 Заказчик'} #{profile.id}
              </h1>
              <p className="font-bold mt-1 text-black/80 capitalize">
                {profile.specialization || 'Профиль формируется...'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 items-end">
            {profile.verification_level < 3 ? (
              <div 
                onClick={() => router.push('/onboarding')}
                className="flex flex-col items-end gap-1 cursor-pointer group"
              >
                <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 px-4 py-2 rounded-full border-2 border-red-500 shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] group-hover:translate-y-[2px] group-hover:translate-x-[2px] group-hover:shadow-none transition-all">
                  <ShieldCheck className="h-5 w-5 opacity-50" />
                  <span className="font-bold text-sm">Уровень {profile.verification_level}/3</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-gray-500 group-hover:text-brand transition-colors">
                  Повысить уровень доверия? →
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 px-4 py-2 rounded-full border-2 border-green-600 shadow-skeuo-inner-light">
                <ShieldCheck className="h-5 w-5" />
                <span className="font-bold text-sm">✅ Максимальный уровень</span>
              </div>
            )}
            
            {isWorker && profile.experience_years && (
              <span className="font-bold text-sm bg-black text-white px-3 py-1.5 rounded-brutal border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                ⏱️ Опыт: {profile.experience_years} лет
              </span>
            )}
            
            {profile.language_proficiency && (
              <span className="text-[10px] font-bold bg-brand/20 text-brand px-2 py-1 rounded-full border border-brand">
                🗣️ {profile.language_proficiency}
              </span>
            )}
          </div>
        </section>

        {/* Основная сетка */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Главный панель (8 колонок) */}
          <div className="md:col-span-8 bg-surface-cardLight dark:bg-surface-cardDark border-4 border-black dark:border-gray-700 rounded-brutal shadow-brutal-light dark:shadow-brutal-dark overflow-hidden">
            {/* Черный заголовок как на панели управления */}
            <div className="bg-black dark:bg-gray-800 p-3 flex justify-between items-center border-b-2 border-black">
              <h2 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> 
                Live_Feed: {isWorker ? 'Доступные объекты' : 'Поиск бригад'}
              </h2>
              <div className="flex gap-1">
                <div className="w-3 h-3 border border-white/30 rounded-full" />
                <div className="w-3 h-3 border border-white/30 rounded-full" />
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid gap-4">
                {/* Карточки проектов (Live Feed) - Фаза 3.1 Marketplace */}
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <div key={project.id} className="p-4 bg-surface-light dark:bg-surface-dark border-2 border-black rounded-brutal shadow-skeuo-inner-light dark:shadow-skeuo-inner-dark hover:translate-y-[-2px] transition-transform cursor-pointer group">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="text-[10px] font-black bg-brand px-2 py-0.5 rounded-full border border-black uppercase mb-2 inline-block">
                            {project.specialization || 'Разное'}
                          </span>
                          <h3 className="font-black text-lg mt-1 group-hover:text-brand transition-colors">
                            {project.title}
                          </h3>
                          <p className="text-sm opacity-70 mt-1 line-clamp-2">
                            {project.description}
                          </p>
                          <p className="text-[10px] font-bold opacity-50 uppercase mt-2">
                            Создано: {new Date(project.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-black text-xl text-brand">{project.budget.toLocaleString()} ₽</p>
                          <p className="text-[10px] font-bold opacity-50 uppercase mt-1">Бюджет</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-brutal flex flex-col items-center justify-center text-center text-gray-500 min-h-[200px]">
                    <p className="font-bold mb-3">🔍 Проектов еще нет...</p>
                    <p className="text-sm opacity-70">Рабочие создадут первые проекты через чат</p>
                  </div>
                )}

                {/* Информационный блок для заказчика */}
                {!isWorker && profile.project_scope && (
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 border-l-4 border-brand rounded-brutal">
                    <p className="text-[10px] font-black text-gray-500 uppercase mb-1">📍 Ваш объект:</p>
                    <p className="font-bold text-base">{profile.project_scope}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Сайдбар (4 колонки) */}
          <div className="md:col-span-4 space-y-6">
            
            {/* Виджет Рейтинг */}
            <div className="bg-white dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 shadow-skeuo-inner-light dark:shadow-skeuo-inner-dark">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-4">📊 Ваш рейтинг</p>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-black italic">5.0</span>
                <div className="flex mb-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-brand text-brand" />
                  ))}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden border border-black">
                <div className="bg-brand h-full w-[100%]" />
              </div>
              <p className="text-[10px] mt-2 font-bold opacity-60">До следующего уровня (PRO): 1500 XP</p>
            </div>

            {/* Виджет Статистика */}
            <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-4 shadow-mix-light dark:shadow-mix-dark">
              <h3 className="font-black uppercase text-xs mb-3 flex items-center gap-2">
                <Briefcase size={14} /> Статистика
              </h3>
              <div className="space-y-2 text-sm font-bold">
                <div className="flex justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-brutal">
                  <span>Активные сделки:</span>
                  <span className="text-brand">0</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-brutal">
                  <span>Завершено:</span>
                  <span className="text-green-600">0</span>
                </div>
                {isWorker && (
                  <div className="flex justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-brutal">
                    <span>Специализация:</span>
                    <span className="font-black capitalize">{profile.specialization}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Кнопка основного действия */}
            <Button className="w-full h-14 text-lg border-2 border-black shadow-brutal-light dark:shadow-brutal-dark">
              {isWorker ? '🎯 Начать поиск заказов' : '🔍 Искать специалистов'}
            </Button>
          </div>

        </section>

      </main>
    </div>
  );
}
