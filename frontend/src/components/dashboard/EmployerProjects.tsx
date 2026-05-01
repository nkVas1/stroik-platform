'use client';

import { Briefcase, CheckCircle, XCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';

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

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open: { label: 'Идёт поиск', cls: 'bg-green-100 text-green-800 border-green-600' },
  in_progress: { label: 'В работе', cls: 'bg-orange-100 text-orange-800 border-orange-500' },
  completed: { label: 'Завершён', cls: 'bg-gray-100 text-gray-600 border-gray-400' },
};

export function EmployerProjects({ projects, onRefresh }: EmployerProjectsProps) {
  const router = useRouter();

  const handleAcceptBid = async (bidId: number) => {
    try {
      await apiPost(`/api/bids/${bidId}/accept`);
      onRefresh();
    } catch {
      alert('Ошибка при назначении исполнителя');
    }
  };

  const handleCompleteProject = async (projectId: number) => {
    if (!window.confirm('Вы уверены, что хотите завершить объект? Средства будут переведены исполнителю.')) return;
    try {
      await apiPost(`/api/projects/${projectId}/complete`);
      onRefresh();
    } catch {
      alert('Ошибка при завершении сделки');
    }
  };

  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-mix-light p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase flex items-center gap-2">
          <Briefcase className="text-brand" /> Мои Объекты
        </h2>
        <Button
          size="sm"
          onClick={() => router.push('/projects/new')}
          className="gap-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-xs"
        >
          <PlusCircle size={14} /> Новый объект
        </Button>
      </div>

      <div className="grid gap-6">
        {projects.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-brutal text-center flex flex-col items-center gap-4">
            <Briefcase className="h-10 w-10 text-gray-300" />
            <div>
              <p className="font-black text-gray-500">У вас пока нет объектов</p>
              <p className="text-xs font-bold text-gray-400 mt-1">Создайте первый — специалисты увидят его в ленте</p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button onClick={() => router.push('/projects/new')} size="sm" className="gap-2 border-2 border-black">
                <PlusCircle size={14} /> Создать вручную
              </Button>
              <Button variant="secondary" onClick={() => router.push('/onboarding')} size="sm" className="border-2 border-black">
                Через ИИ-ассистента
              </Button>
            </div>
          </div>
        ) : (
          projects.map(proj => {
            const statusInfo = STATUS_LABELS[proj.status] || { label: proj.status, cls: 'bg-gray-100 text-gray-600 border-gray-400' };
            return (
              <div key={proj.id} className="border-2 border-black rounded-brutal overflow-hidden shadow-sm">
                <div className="bg-black text-white p-4 flex justify-between items-center">
                  <h3 className="font-bold truncate pr-4">{proj.title}</h3>
                  <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border-2 shrink-0 ${statusInfo.cls}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <div className="p-5 bg-surface-light dark:bg-surface-dark">
                  {/* Баннер "Сделка активна" с кнопкой принятия работы */}
                  {proj.status === 'in_progress' && (
                    <div className="mb-5 p-4 bg-orange-50 dark:bg-orange-900/30 border-2 border-brand rounded-brutal flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <p className="font-black text-black dark:text-white">Сделка активна</p>
                        <p className="text-xs font-bold opacity-70">Эскроу-защита работает. Нажмите &laquo;Принять&raquo;, когда работа сдана.</p>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => handleCompleteProject(proj.id)} className="shrink-0">
                        Принять работу
                      </Button>
                    </div>
                  )}

                  <h4 className="text-sm font-black uppercase text-gray-500 mb-3 border-b-2 border-gray-200 dark:border-gray-700 pb-2">
                    Отклики ({proj.bids.length})
                  </h4>

                  <div className="space-y-3">
                    {proj.bids.length === 0 ? (
                      <p className="text-xs font-bold text-gray-400 py-4 text-center">
                        Пока никто не откликнулся... Специалисты увидят ваш объект в ленте.
                      </p>
                    ) : (
                      proj.bids.map(bid => (
                        <div
                          key={bid.id}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-brutal bg-white dark:bg-gray-800 gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-base leading-tight">{bid.worker_name}</p>
                            <p className="text-xs font-bold text-brand uppercase mt-0.5">{bid.worker_spec || 'Универсал'}</p>
                            {bid.cover_letter && (
                              <p className="text-sm italic opacity-70 mt-2 line-clamp-2">&ldquo;{bid.cover_letter}&rdquo;</p>
                            )}
                            {bid.price_offer != null && (
                              <p className="text-sm font-black text-brand mt-1">{bid.price_offer.toLocaleString('ru-RU')} ₽</p>
                            )}
                          </div>

                          <div className="shrink-0">
                            {proj.status === 'open' && bid.status === 'pending' ? (
                              <Button size="sm" onClick={() => handleAcceptBid(bid.id)} className="font-bold uppercase">
                                Нанять
                              </Button>
                            ) : (
                              <span className={`inline-flex items-center gap-1 text-xs font-black uppercase px-3 py-1 rounded-brutal border-2 ${
                                bid.status === 'accepted'
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                  : 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              }`}>
                                {bid.status === 'accepted'
                                  ? <><CheckCircle size={12} /> Назначен</>
                                  : <><XCircle size={12} /> Отказ</>
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
