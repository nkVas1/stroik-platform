'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HardHat, Briefcase, Search, LogOut, User as UserIcon, Building, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [feedProjects, setFeedProjects] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('stroik_token');
      if (!token) {
        router.push('/onboarding');
        return;
      }

      try {
        const [profileRes, dashRes, feedRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://127.0.0.1:8000/api/users/me/dashboard_data', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://127.0.0.1:8000/api/projects')
        ]);

        if (!profileRes.ok) throw new Error('Token invalid');
        const userProfile = await profileRes.json();
        setProfile(userProfile);

        if (dashRes.ok) {
          setDashboardData(await dashRes.json());
        }

        if (userProfile.role === 'worker' && feedRes.ok) {
          setFeedProjects(await feedRes.json());
        }
      } catch (error) {
        console.error('Fetch error:', error);
        localStorage.removeItem('stroik_token');
        router.push('/onboarding');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleBid = async (projectId: number) => {
    const token = localStorage.getItem('stroik_token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cover_letter: 'Готов обсудить детали.' })
      });
      if (res.ok) {
        alert('✅ Отклик отправлен!');
        window.location.reload();
      } else {
        const error = await res.json();
        alert(`❌ ${error.detail}`);
      }
    } catch (e) {
      alert('❌ Ошибка сети');
    }
  };

  const handleAcceptBid = async (bidId: number) => {
    const token = localStorage.getItem('stroik_token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/bids/${bidId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('✅ Исполнитель назначен!');
        window.location.reload();
      }
    } catch (e) {
      alert('❌ Ошибка сети');
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <HardHat className="h-12 w-12 text-brand animate-pulse" />
      </div>
    );
  }

  const isWorker = profile.role === 'worker';

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark">
      <header className="p-4 border-b-2 border-black bg-surface-cardLight dark:bg-surface-cardDark flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="inline-flex items-center gap-2 font-black text-xl">
          <HardHat className="h-6 w-6 text-brand" />
          <span>СТРОИК</span>
        </Link>
        <div className="flex gap-4">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.removeItem('stroik_token');
              router.push('/');
            }}
          >
            <LogOut size={16} /> Выход
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        <section className="bg-brand text-black border-2 border-black rounded-brutal p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-brutal-light dark:shadow-brutal-dark">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white border-2 border-black rounded-full flex items-center justify-center">
              {isWorker ? <UserIcon size={32} /> : <Building size={32} />}
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase">
                {isWorker ? 'Специалист' : 'Заказчик'} #{profile.id}
              </h1>
              <p className="font-bold">{profile.specialization || 'Профиль активен'}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-6">
            {isWorker && (
              <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-mix-light p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Search className="text-brand" /> Биржа заказов
                </h2>
                <div className="grid gap-4">
                  {feedProjects.length === 0 ? (
                    <p className="text-gray-500 text-center">Пока нет открытых заказов.</p>
                  ) : (
                    feedProjects.map(proj => (
                      <div key={proj.id} className="p-4 bg-surface-light dark:bg-surface-dark border-2 border-black rounded-brutal hover:translate-y-[-2px] transition-transform">
                        <div className="flex justify-between gap-4">
                          <div className="flex-1">
                            <span className="text-[10px] bg-brand text-black px-2 py-0.5 rounded-full border border-black uppercase font-black">
                              Новое
                            </span>
                            <h3 className="font-black text-lg mt-1">{proj.title}</h3>
                            <p className="text-sm opacity-70 mt-1 line-clamp-2">{proj.description}</p>
                          </div>
                          <div className="text-right shrink-0 flex flex-col justify-between">
                            <p className="font-black text-lg">{proj.budget?.toLocaleString()} ₽</p>
                            <Button size="sm" onClick={() => handleBid(proj.id)}>
                              Откликнуться
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {!isWorker && dashboardData?.projects && (
              <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-mix-light p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Briefcase className="text-brand" /> Мои Объекты
                </h2>
                <div className="grid gap-6">
                  {dashboardData.projects.length === 0 ? (
                    <p className="text-gray-500">У вас нет активных объектов.</p>
                  ) : (
                    dashboardData.projects.map((proj: any) => (
                      <div key={proj.id} className="border-2 border-black rounded-brutal overflow-hidden">
                        <div className="bg-black text-white p-3 flex justify-between items-center">
                          <h3 className="font-bold">{proj.title}</h3>
                          <span className="text-xs uppercase bg-white/20 px-2 py-1 rounded-full">
                            {proj.status === 'open' ? 'Идет поиск' : 'В работе'}
                          </span>
                        </div>
                        <div className="p-4 bg-surface-light dark:bg-surface-dark">
                          <p className="text-sm font-bold mb-2">Кандидаты ({proj.bids.length}):</p>
                          <div className="space-y-3">
                            {proj.bids.length === 0 ? (
                              <p className="text-xs text-gray-500 italic">Пока откликов нет...</p>
                            ) : (
                              proj.bids.map((bid: any) => (
                                <div key={bid.id} className="flex justify-between items-center p-3 border border-gray-300 dark:border-gray-700 rounded-brutal bg-white dark:bg-gray-800">
                                  <div>
                                    <p className="font-bold">
                                      {bid.worker_name}
                                      {bid.worker_spec && (
                                        <span className="font-normal text-xs opacity-70"> ({bid.worker_spec})</span>
                                      )}
                                    </p>
                                    <p className="text-xs italic mt-1">"{bid.cover_letter}"</p>
                                  </div>
                                  {proj.status === 'open' && bid.status === 'pending' ? (
                                    <Button size="sm" onClick={() => handleAcceptBid(bid.id)}>
                                      Выбрать
                                    </Button>
                                  ) : (
                                    <span
                                      className={`text-xs font-bold px-2 py-1 rounded-full border ${
                                        bid.status === 'accepted'
                                          ? 'border-green-500 text-green-600'
                                          : 'border-red-500 text-red-600'
                                      }`}
                                    >
                                      {bid.status === 'accepted' ? 'Назначен' : 'Отказ'}
                                    </span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-4 space-y-6">
            {isWorker && dashboardData?.bids && (
              <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 shadow-skeuo-inner-light">
                <h3 className="font-black uppercase text-xs mb-4">Мои отклики</h3>
                <div className="space-y-3">
                  {dashboardData.bids.length === 0 ? (
                    <p className="text-xs text-gray-500">Нет активных откликов</p>
                  ) : (
                    dashboardData.bids.map((bid: any) => (
                      <div key={bid.id} className="border-b border-gray-200 dark:border-gray-700 pb-2 flex justify-between items-start">
                        <span className="text-sm font-medium line-clamp-1 pr-2">{bid.project_title}</span>
                        {bid.status === 'accepted' ? (
                          <CheckCircle className="text-green-500 shrink-0" size={16} />
                        ) : bid.status === 'rejected' ? (
                          <XCircle className="text-red-500 shrink-0" size={16} />
                        ) : (
                          <Clock className="text-yellow-500 shrink-0" size={16} />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            <Button className="w-full h-14 text-lg border-2 border-black" onClick={() => router.push('/onboarding')}>
              + Вернуться в Чат
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
