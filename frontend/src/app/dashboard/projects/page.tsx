'use client';

import { useEffect, useState, useCallback } from 'react';
import { Briefcase, ArrowLeft, PlusCircle, Search, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { apiGet, apiPost } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface Bid {
  id: number;
  worker_id?: number;
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
  description?: string;
  budget?: number;
  location?: string;
  bids: Bid[];
}

const STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  open:        { label: 'Ищем исп.', cls: 'bg-green-100 text-green-800 border-green-500', dot: 'bg-green-500' },
  in_progress: { label: 'В работе',     cls: 'bg-amber-100 text-amber-800 border-amber-500',  dot: 'bg-brand' },
  completed:   { label: 'Завершён',   cls: 'bg-gray-100 text-gray-600 border-gray-400',   dot: 'bg-gray-400' },
  cancelled:   { label: 'Отменён',   cls: 'bg-red-100 text-red-600 border-red-400',      dot: 'bg-red-400' },
};

const FILTERS = [
  { id: 'all',        label: 'Все' },
  { id: 'open',       label: 'Поиск' },
  { id: 'in_progress',label: 'В работе' },
  { id: 'completed',  label: 'Завершёны' },
];

export default function ProjectsPage() {
  const router = useRouter();
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ projects?: Project[] }>('/api/users/me/dashboard_data');
      setProjects(data.projects ?? []);
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (bidId: number) => {
    try {
      await apiPost(`/api/bids/${bidId}/accept`);
      toast.success('Исполнитель назначен!');
      load();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const handleComplete = async (projectId: number) => {
    if (!window.confirm('Подтвердите завершение. Средства будут переведены.')) return;
    try {
      await apiPost(`/api/projects/${projectId}/complete`);
      toast.success('Работа принята!');
      load();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Ошибка'); }
  };

  const visible = projects.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-4 md:p-8">
      <div className="max-w-4xl mx-auto">

        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-black uppercase mb-6 hover:text-brand transition-colors">
          <ArrowLeft size={14} /> Вернуться
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
              <Briefcase size={20} className="text-black" />
            </div>
            <div>
              <h1 className="font-black text-2xl uppercase">Мои Объекты</h1>
              <p className="text-xs font-bold text-gray-500">{projects.length} объектов всего</p>
            </div>
          </div>
          <Button size="sm" onClick={() => router.push('/projects/new')} className="gap-2 border-2 border-black font-black uppercase text-xs">
            <PlusCircle size={14} /> Новый
          </Button>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 border-2 border-black rounded-brutal text-sm font-bold bg-white dark:bg-gray-900 focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`shrink-0 px-3 py-2 text-xs font-black uppercase rounded-brutal border-2 border-black transition-all ${
                  filter === f.id ? 'bg-brand text-black' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Briefcase className="h-10 w-10 text-brand animate-pulse" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-brutal text-center gap-4">
            <Briefcase size={36} className="text-gray-200 dark:text-gray-700" />
            <div>
              <p className="font-black text-gray-500">Нет объектов</p>
              <p className="text-xs font-bold text-gray-400 mt-1">Создайте первый — специалисты увидят его в ленте</p>
            </div>
            <Button size="sm" onClick={() => router.push('/projects/new')} className="gap-2 border-2 border-black text-xs">
              <PlusCircle size={13} /> Создать объект
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(proj => {
              const st = STATUS_MAP[proj.status] ?? STATUS_MAP.open;
              const isExp = expanded === proj.id;
              const pendingBids = proj.bids.filter(b => b.status === 'pending').length;

              return (
                <div key={proj.id} className="border-2 border-black rounded-brutal overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExp ? null : proj.id)}
                    className="w-full flex items-center gap-3 p-4 bg-surface-cardLight dark:bg-surface-cardDark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${st.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm truncate">{proj.title}</p>
                      {proj.location && (
                        <p className="text-[10px] font-bold text-gray-400">{proj.location}</p>
                      )}
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-brutal border ${st.cls} shrink-0`}>
                      {st.label}
                    </span>
                    {pendingBids > 0 && (
                      <span className="text-[10px] font-black bg-brand text-black px-2 py-0.5 rounded-brutal shrink-0">
                        {pendingBids} новых
                      </span>
                    )}
                    {pendingBids === 0 && proj.bids.length > 0 && (
                      <span className="text-[10px] font-bold text-gray-400 shrink-0">{proj.bids.length} откл.</span>
                    )}
                    {isExp ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
                  </button>

                  {isExp && (
                    <div className="px-4 pb-4 pt-2 bg-surface-light dark:bg-surface-dark border-t-2 border-black/10">
                      {proj.description && (
                        <p className="text-xs font-bold text-gray-500 mb-3">{proj.description}</p>
                      )}
                      {proj.budget != null && (
                        <p className="text-sm font-black text-brand mb-3">Бюджет: {proj.budget.toLocaleString('ru-RU')} ₽</p>
                      )}

                      {proj.status === 'in_progress' && (
                        <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-brand rounded-brutal mb-3">
                          <div>
                            <p className="text-xs font-black uppercase text-amber-700 dark:text-brand">Сделка активна</p>
                            <p className="text-[10px] font-bold text-gray-500">Эскроу-защита работает</p>
                          </div>
                          <Button variant="primary" size="sm" onClick={() => handleComplete(proj.id)} className="text-xs shrink-0">
                            Принять работу
                          </Button>
                        </div>
                      )}

                      <h4 className="text-[10px] font-black uppercase text-gray-400 mb-2">Отклики ({proj.bids.length})</h4>
                      {proj.bids.length === 0 ? (
                        <p className="text-xs font-bold text-gray-400 text-center py-3">Пока нет откликов</p>
                      ) : (
                        <div className="space-y-2">
                          {proj.bids.map(bid => (
                            <div key={bid.id}
                              className="flex items-center gap-3 p-2.5 border border-gray-200 dark:border-gray-700 rounded-brutal bg-surface-cardLight dark:bg-surface-cardDark">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-black truncate">{bid.worker_name}</p>
                                <p className="text-[10px] font-bold text-brand uppercase">{bid.worker_spec || 'Универсал'}</p>
                                {bid.cover_letter && (
                                  <p className="text-[11px] italic text-gray-500 mt-0.5 line-clamp-1">&ldquo;{bid.cover_letter}&rdquo;</p>
                                )}
                              </div>
                              {bid.price_offer != null && (
                                <span className="text-sm font-black text-brand shrink-0">{bid.price_offer.toLocaleString('ru-RU')} ₽</span>
                              )}
                              {proj.status === 'open' && bid.status === 'pending' ? (
                                <Button size="sm" onClick={() => handleAccept(bid.id)} className="text-[10px] font-black uppercase px-3 py-1 h-auto">
                                  Нанять
                                </Button>
                              ) : (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-brutal border ${
                                  bid.status === 'accepted'
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700'
                                    : 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600'
                                }`}>
                                  {bid.status === 'accepted' ? <><CheckCircle size={10} /> Назначен</> : <><XCircle size={10} /> Отказ</>}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
