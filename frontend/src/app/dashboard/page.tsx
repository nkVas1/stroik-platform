'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HardHat, Briefcase, Search, LogOut, User as UserIcon, Building, CheckCircle, XCircle, Clock, Sparkles, Bot, AlertCircle, MapPin } from 'lucide-react';
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
      if (!token) return router.push('/onboarding');

      try {
        const[profileRes, dashRes, feedRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/users/me', { headers: { 'Authorization': `Bearer ${token}` }}),
          fetch('http://127.0.0.1:8000/api/users/me/dashboard_data', { headers: { 'Authorization': `Bearer ${token}` }}),
          fetch('http://127.0.0.1:8000/api/projects')
        ]);

        if (!profileRes.ok) throw new Error('Token invalid');
        const userProfile = await profileRes.json();
        setProfile(userProfile);
        if (dashRes.ok) setDashboardData(await dashRes.json());
        if (userProfile.role === 'worker' && feedRes.ok) setFeedProjects(await feedRes.json());
      } catch (error) {
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ cover_letter: 'Здравствуйте! Готов обсудить детали и приступить к работе.' })
      });
      if (res.ok) { alert('✅ Отклик отправлен!'); window.location.reload(); } 
      else { const error = await res.json(); alert(`❌ ${error.detail}`); }
    } catch (e) { alert('❌ Ошибка сети'); }
  };

  const handleAcceptBid = async (bidId: number) => {
    const token = localStorage.getItem('stroik_token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/bids/${bidId}/accept`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { alert('✅ Сделка начата!'); window.location.reload(); }
    } catch (e) { alert('❌ Ошибка сети'); }
  };

  const handleCompleteProject = async (projectId: number) => {
    if(!window.confirm("Вы уверены, что хотите завершить объект? Средства (Эскроу) будут переведены исполнителю.")) return;
    const token = localStorage.getItem('stroik_token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/projects/${projectId}/complete`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) { alert('✅ Работа принята! Сделка закрыта.'); window.location.reload(); }
    } catch (e) { alert('❌ Ошибка сети'); }
  };

  if (isLoading || !profile) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
      <HardHat className="h-12 w-12 text-brand animate-pulse" />
    </div>
  );

  const isWorker = profile.role === 'worker';
  
  // 🔴 КРИТИЧЕСКИ ВАЖНО: НЕ УДАЛЯТЬ - Логика геймификации и прогресса
  const progressPercent = Math.min((profile.verification_level / 3) * 100, 100);

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark font-sans">
      <header className="p-4 border-b-2 border-black bg-surface-cardLight dark:bg-surface-cardDark flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="inline-flex items-center gap-2 font-black text-xl">
          <HardHat className="h-6 w-6 text-brand" /><span>СТРОИК</span>
        </Link>
        <div className="flex gap-4">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem('stroik_token'); router.push('/'); }} className="border-2 border-black">
            <LogOut size={16} /> Выход
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* 🔴 КРИТИЧЕСКИ ВАЖНО: НЕ УДАЛЯТЬ - Блок прогресса и ИИ-Диспетчер */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="md:col-span-2 bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-brutal-light dark:shadow-brutal-dark flex flex-col md:flex-row gap-6 items-center">
            <div className="w-20 h-20 bg-brand text-black border-2 border-black rounded-full flex items-center justify-center shadow-skeuo-inner-light shrink-0">
              {isWorker ? <UserIcon size={40} /> : <Building size={40} />}
            </div>
            <div className="flex-1 w-full text-center md:text-left">
              <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-2">
                <h1 className="text-2xl font-black uppercase">{profile.fio || (isWorker ? 'Специалист' : 'Заказчик')}</h1>
                <span className="text-xs font-bold px-3 py-1 bg-black text-white rounded-brutal">{profile.location || 'Город не указан'}</span>
              </div>
              <p className="font-bold opacity-80 mb-4">{profile.specialization || 'Профиль формируется...'}</p>
              
              <div className="w-full">
                <div className="flex justify-between text-xs font-bold uppercase mb-1">
                  <span>Доверие профилю</span>
                  <span>{progressPercent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 h-3 rounded-full border-2 border-black overflow-hidden relative">
                  <div className="bg-green-500 h-full transition-all duration-1000 ease-in-out" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section onClick={() => router.push('/onboarding')} className="md:col-span-1 bg-gradient-to-br from-brand to-orange-500 border-2 border-black rounded-brutal p-6 shadow-brutal-light cursor-pointer hover:translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group relative overflow-hidden flex flex-col justify-center items-center text-center">
            <Sparkles className="absolute top-2 right-2 text-white/40 h-16 w-16 group-hover:rotate-12 transition-transform" />
            <Bot size={40} className="text-black mb-3 group-hover:scale-110 transition-transform" />
            <h2 className="text-xl font-black text-black uppercase mb-1">ИИ-Диспетчер</h2>
            <p className="text-sm font-bold text-black/80">
              {profile.verification_level < 1 ? 'Пройти верификацию' : (isWorker ? 'Обновить навыки' : 'Новый заказ (ТЗ)')}
            </p>
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-6">
            
            {/* 🔴 РАБОЧИЙ: Биржа */}
            {isWorker && (
              <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-mix-light p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-black uppercase flex items-center gap-2"><Search className="text-brand"/> Доступные заказы</h2>
                  <span className="text-xs font-bold bg-green-100 text-green-800 border-2 border-green-800 px-2 py-1 rounded-full animate-pulse">Live</span>
                </div>
                
                <div className="grid gap-4">
                  {feedProjects.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-gray-400 rounded-brutal flex flex-col items-center text-center">
                      <AlertCircle className="h-10 w-10 text-gray-400 mb-3" />
                      <p className="font-bold text-gray-500">Пока нет подходящих заказов.</p>
                    </div>
                  ) : feedProjects.map(proj => (
                    <div key={proj.id} className="p-5 bg-surface-light dark:bg-surface-dark border-2 border-black rounded-brutal hover:-translate-y-1 hover:shadow-brutal-light transition-all flex flex-col md:flex-row gap-4 justify-between">
                      <div className="flex-1">
                        <div className="flex gap-2 items-center mb-2">
                          <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full uppercase font-black">{proj.specialization || 'Разное'}</span>
                          <span className="text-xs text-gray-500 font-bold flex items-center gap-1"><MapPin size={12}/> {proj.location}</span>
                        </div>
                        <h3 className="font-black text-lg leading-tight">{proj.title}</h3>
                        <p className="text-sm opacity-80 mt-2 line-clamp-2">{proj.description}</p>
                        <p className="text-xs font-bold opacity-60 mt-3">Заказчик: {proj.employer_name}</p>
                      </div>
                      <div className="flex flex-col justify-between items-start md:items-end shrink-0 border-t-2 md:border-t-0 md:border-l-2 border-gray-200 dark:border-gray-800 pt-4 md:pt-0 md:pl-4">
                        <p className="font-black text-xl text-brand">{proj.budget ? `${proj.budget.toLocaleString('ru-RU')} ₽` : 'Договорная'}</p>
                        <Button size="sm" onClick={() => handleBid(proj.id)} className="w-full md:w-auto text-xs font-bold uppercase mt-2">Откликнуться</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 🔴 ЗАКАЗЧИК: Объекты */}
            {!isWorker && dashboardData?.projects && (
              <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-mix-light p-6">
                <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Briefcase className="text-brand"/> Мои Объекты</h2>
                <div className="grid gap-6">
                  {dashboardData.projects.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-gray-400 rounded-brutal text-center">
                      <p className="font-bold text-gray-500 mb-2">У вас пока нет объектов.</p>
                      <Button onClick={() => router.push('/onboarding')} size="sm">Создать ТЗ через ИИ</Button>
                    </div>
                  ) : dashboardData.projects.map((proj: any) => (
                    <div key={proj.id} className="border-2 border-black rounded-brutal overflow-hidden shadow-sm">
                      <div className="bg-black text-white p-4 flex justify-between items-center">
                        <h3 className="font-bold truncate">{proj.title}</h3>
                        <span className="text-xs font-black uppercase bg-white text-black px-3 py-1 rounded-full">{proj.status === 'open' ? 'Идет поиск' : 'В работе'}</span>
                      </div>
                      <div className="p-5 bg-surface-light dark:bg-surface-dark">
                        {proj.status === 'in_progress' && (
                           <div className="mb-4 p-4 bg-orange-100 dark:bg-orange-900 border-2 border-brand rounded-brutal flex justify-between items-center">
                              <div>
                                <p className="font-black text-black dark:text-white">Сделка активна</p>
                                <p className="text-xs font-bold opacity-70">Эскроу защита работает.</p>
                              </div>
                              <Button variant="primary" onClick={() => handleCompleteProject(proj.id)}>Принять работу</Button>
                           </div>
                        )}
                        <h4 className="text-sm font-black uppercase text-gray-500 mb-3 border-b-2 border-gray-200 pb-2">Отклики ({proj.bids.length})</h4>
                        <div className="space-y-4">
                          {proj.bids.length === 0 ? <p className="text-xs font-bold text-gray-400">Пока никто не откликнулся...</p> : proj.bids.map((bid: any) => (
                            <div key={bid.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-2 border-gray-300 dark:border-gray-700 rounded-brutal bg-white dark:bg-gray-800 gap-4">
                              <div className="flex-1">
                                <p className="font-black text-lg leading-none">{bid.worker_name}</p>
                                <p className="text-xs font-bold text-brand uppercase mt-1">{bid.worker_spec || 'Универсал'}</p>
                                <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900 rounded-brutal border border-gray-200 dark:border-gray-700">
                                  <p className="text-sm italic opacity-80">"{bid.cover_letter}"</p>
                                </div>
                              </div>
                              <div className="w-full md:w-auto text-right flex flex-col md:items-end gap-2">
                                {proj.status === 'open' && bid.status === 'pending' ? (
                                  <Button size="sm" onClick={() => handleAcceptBid(bid.id)} className="w-full md:w-auto font-bold uppercase">Нанять</Button>
                                ) : (
                                  <span className={`text-xs font-black uppercase px-3 py-1 rounded-brutal border-2 ${bid.status === 'accepted' ? 'border-green-500 bg-green-100 text-green-700' : 'border-red-500 bg-red-100 text-red-700'}`}>
                                    {bid.status === 'accepted' ? 'Назначен на объект' : 'Отказ'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 🔴 САЙДБАР: Статистика */}
          <div className="md:col-span-4 space-y-6">
            {isWorker && dashboardData?.bids && (
              <div className="bg-white dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-skeuo-inner-light">
                <h3 className="font-black uppercase text-sm mb-4 border-b-2 border-black pb-2">Мои отклики</h3>
                <div className="space-y-4">
                  {dashboardData.bids.length === 0 ? <p className="text-xs font-bold text-gray-500">Вы еще не откликались на заказы.</p> : dashboardData.bids.map((bid: any) => (
                    <div key={bid.id} className="flex flex-col gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-sm font-bold truncate">{bid.project_title}</p>
                          <p className="text-xs opacity-60 font-bold mt-0.5">{bid.project_budget ? `${bid.project_budget.toLocaleString()} ₽` : 'Договорная'}</p>
                        </div>
                        {bid.status === 'accepted' ? <CheckCircle className="text-green-500 shrink-0" size={20}/> : 
                         bid.status === 'rejected' ? <XCircle className="text-red-500 shrink-0" size={20}/> : 
                         <Clock className="text-yellow-500 shrink-0 animate-pulse" size={20}/>}
                      </div>
                      
                      {/* 🔴 КРИТИЧЕСКИ ВАЖНО: Отображение Смарт-Эскроу для рабочего */}
                      {bid.status === 'accepted' && bid.project_status === 'in_progress' && (
                        <div className="mt-2 p-2 bg-green-100 dark:bg-green-900 border border-green-500 rounded-brutal">
                           <p className="text-[10px] font-black text-green-800 dark:text-green-100 uppercase">Сделка защищена</p>
                           <p className="text-xs font-medium text-green-700 dark:text-green-200 mt-1">Деньги зарезервированы. Приступайте к работе!</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
