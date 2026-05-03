'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapPin, Search, ArrowLeft, Rss, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { apiGet, apiPost } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface Project {
  id: number;
  title: string;
  description?: string;
  budget?: number;
  specialization?: string;
  employer_name: string;
  location: string;
  created_at?: string;
}

const SPECS = ['Все', 'Отделка', 'Плитка', 'Фасад', 'Кладка', 'Сантехника', 'Разное'];

export default function ProjectsPage() {
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [spec, setSpec] = useState('Все');
  const [isLoading, setIsLoading] = useState(true);
  const [bidding, setBidding] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiGet<Project[]>('/api/projects');
      setProjects(data);
    } catch {
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBid = async (projectId: number) => {
    setBidding(projectId);
    try {
      await apiPost(`/api/projects/${projectId}/bids`, {
        cover_letter: 'Здравствуйте! Готов обсудить детали и приступить к работе.',
      });
      toast.success('Отклик отправлен! Заказчик уведомлён.');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сети');
    } finally {
      setBidding(null);
    }
  };

  const visible = projects.filter(p => {
    const matchSpec = spec === 'Все' || (p.specialization || 'Разное') === spec;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase());
    return matchSpec && matchSearch;
  });

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-surface-cardLight dark:bg-surface-cardDark border-b-2 border-black px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-black uppercase hover:text-brand transition-colors">
              <ArrowLeft size={14} /> Кабинет
            </Link>
            <div className="flex-1" />
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase text-green-600">Live</span>
              <span className="ml-1 text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-brutal">
                {projects.length} заказов
              </span>
            </div>
          </div>

          <h1 className="font-black text-2xl uppercase mb-4 flex items-center gap-2">
            <Rss className="text-brand" size={22} /> Лента заказов
          </h1>

          {/* Search + spec filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по названию или описанию..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 border-2 border-black rounded-brutal text-sm font-bold bg-white dark:bg-gray-900 focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {SPECS.map(s => (
                <button key={s} onClick={() => setSpec(s)}
                  className={`shrink-0 px-3 py-2.5 text-xs font-black uppercase rounded-brutal border-2 border-black transition-all ${
                    spec === s ? 'bg-brand text-black' : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Rss className="h-10 w-10 text-brand animate-pulse" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-brutal text-center gap-4">
            <AlertCircle size={36} className="text-gray-200 dark:text-gray-700" />
            <div>
              <p className="font-black text-gray-500">
                {search || spec !== 'Все' ? 'Ничего не найдено' : 'Пока нет заказов'}
              </p>
              <p className="text-xs font-bold text-gray-400 mt-1">
                {search || spec !== 'Все'
                  ? 'Попробуйте сбросить фильтры'
                  : 'Заказчики ещё не разместили объекты. Проверьте позже'}
              </p>
            </div>
            {(search || spec !== 'Все') && (
              <Button size="sm" variant="secondary" onClick={() => { setSearch(''); setSpec('Все'); }}
                className="border-2 border-black text-xs">
                Сбросить фильтры
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(proj => (
              <div key={proj.id}
                className="group relative p-4 md:p-5 bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                {/* Brand accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand rounded-l-brutal opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Tags row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 rounded-brutal">
                        {proj.specialization || 'Разное'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 flex items-center gap-0.5">
                        <MapPin size={10} /> {proj.location}
                      </span>
                    </div>

                    <h3 className="font-black text-base leading-tight">{proj.title}</h3>
                    {proj.description && (
                      <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{proj.description}</p>
                    )}
                    <p className="text-xs font-bold text-gray-400 mt-2">
                      Зак.: {proj.employer_name}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0 min-w-[80px]">
                    <span className="font-black text-lg text-brand leading-none">
                      {proj.budget ? `${proj.budget.toLocaleString('ru-RU')} ₽` : 'Догов.'}
                    </span>
                    <Button
                      size="sm"
                      disabled={bidding === proj.id}
                      onClick={() => handleBid(proj.id)}
                      className="text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    >
                      {bidding === proj.id ? '...' : 'Откликнуться'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
