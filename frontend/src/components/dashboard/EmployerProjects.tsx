'use client';

import { Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

interface Bid {
  id: number;
  worker_name: string;
  worker_spec?: string;
  cover_letter?: string;
  price_offer?: number;
  status: string;
}

interface Project {
  id: number;
  title: string;
  status: string;
  bids: Bid[];
}

interface EmployerProjectsProps {
  projects: Project[];
  onRefresh: () => void;
}

export function EmployerProjects({ projects, onRefresh }: EmployerProjectsProps) {
  const router = useRouter();

  const handleAcceptBid = async (bidId: number) => {
    const token = localStorage.getItem('stroik_token');
    try {
      const res = await fetch(`${API_URL}/api/bids/${bidId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) onRefresh();
      else alert('Ошибка при назначении');
    } catch {
      alert('Ошибка сети');
    }
  };

  const handleCompleteProject = async (projectId: number) => {
    if (!window.confirm('Вы уверены, что хотите завершить объект? Средства будут переведены исполнителю.')) return;
    const token = localStorage.getItem('stroik_token');
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) onRefresh();
    } catch {
      alert('Ошибка сети');
    }
  };

  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-mix-light p-6">
      <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
        <Briefcase className="text-brand" /> Мои Объекты
      </h2>
      <div className="grid gap-6">
        {projects.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-gray-400 rounded-brutal text-center">
            <p className="font-bold text-gray-500 mb-2">У вас пока нет объектов.</p>
            <Button onClick={() => router.push('/onboarding')} size="sm">Создать ТЗ через ИИ</Button>
          </div>
        ) : (
          projects.map(proj => (
            <div key={proj.id} className="border-2 border-black rounded-brutal overflow-hidden">
              <div className="bg-black text-white p-4 flex justify-between items-center">
                <h3 className="font-bold truncate pr-4">{proj.title}</h3>
                <span className="text-xs font-black uppercase bg-white text-black px-3 py-1 rounded-full shrink-0">
                  {proj.status === 'open' ? 'Идёт поиск' : proj.status === 'in_progress' ? 'В работе' : 'Завершён'}
                </span>
              </div>
              <div className="p-5 bg-surface-light dark:bg-surface-dark">
                {proj.status === 'in_progress' && (
                  <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/30 border-2 border-brand rounded-brutal flex justify-between items-center">
                    <div>
                      <p className="font-black">Сделка активна</p>
                      <p className="text-xs font-bold opacity-70">Эскроу-защита работает.</p>
                    </div>
                    <Button variant="primary" onClick={() => handleCompleteProject(proj.id)}>Принять работу</Button>
                  </div>
                )}
                <h4 className="text-sm font-black uppercase text-gray-500 mb-3 border-b-2 border-gray-200 dark:border-gray-700 pb-2">
                  Отклики ({proj.bids.length})
                </h4>
                <div className="space-y-4">
                  {proj.bids.length === 0 ? (
                    <p className="text-xs font-bold text-gray-400">Пока никто не откликнулся...</p>
                  ) : (
                    proj.bids.map(bid => (
                      <div key={bid.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-brutal bg-white dark:bg-gray-800 gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-lg">{bid.worker_name}</p>
                          <p className="text-xs font-bold text-brand uppercase mt-1">{bid.worker_spec || 'Универсал'}</p>
                          {bid.cover_letter && (
                            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-brutal border border-gray-200 dark:border-gray-700">
                              <p className="text-sm italic opacity-80">&quot;{bid.cover_letter}&quot;</p>
                            </div>
                          )}
                          {bid.price_offer && (
                            <p className="text-sm font-black text-brand mt-2">{bid.price_offer.toLocaleString('ru-RU')} ₽</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {proj.status === 'open' && bid.status === 'pending' ? (
                            <Button size="sm" onClick={() => handleAcceptBid(bid.id)} className="font-bold uppercase">
                              Нанять
                            </Button>
                          ) : (
                            <span className={`text-xs font-black uppercase px-3 py-1 rounded-brutal border-2 flex items-center gap-1 ${
                              bid.status === 'accepted'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-red-400 bg-red-50 text-red-700'
                            }`}>
                              {bid.status === 'accepted'
                                ? (<><CheckCircle size={12} /> Назначен</>
                                ) : (
                                  <><XCircle size={12} /> Отказ</>
                                )}
                            </span>
                          )}
                        </div>
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
  );
}
