'use client';

import { AlertCircle, MapPin, Rss, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { apiPost } from '@/lib/api';
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

interface ProjectFeedProps {
  projects: Project[];
  onRefresh: () => void;
}

const WIDGET_LIMIT = 4;

export function ProjectFeed({ projects, onRefresh }: ProjectFeedProps) {
  const toast = useToast();

  const handleBid = async (projectId: number) => {
    try {
      await apiPost(`/api/projects/${projectId}/bids`, {
        cover_letter: 'Здравствуйте! Готов обсудить детали и приступить к работе.',
      });
      toast.success('Отклик отправлен! Заказчик уведомлён.');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сети');
    }
  };

  const preview = projects.slice(0, WIDGET_LIMIT);

  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-4 md:p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-black text-sm uppercase tracking-wide">Доступные заказы</h3>
          {/* Live dot */}
          <span className="inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-green-600">Live</span>
          </span>
          {projects.length > 0 && (
            <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-brutal">
              {projects.length}
            </span>
          )}
        </div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
        >
          Все заказы <ArrowUpRight size={12} />
        </Link>
      </div>

      {/* List */}
      {preview.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-brutal gap-3 text-center">
          <AlertCircle size={28} className="text-gray-200 dark:text-gray-700" />
          <div>
            <p className="font-black text-sm text-gray-500">Пока нет открытых заказов</p>
            <p className="text-xs font-bold text-gray-400">Заказчики ещё не разместили объекты — проверьте позже</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {preview.map(proj => (
            <div
              key={proj.id}
              className="group relative p-3 bg-surface-light dark:bg-surface-dark border-2 border-black rounded-brutal hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              {/* Brand left accent on hover */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand rounded-l-brutal opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between gap-3">
                {/* Left: meta + title */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 rounded-brutal">
                      {proj.specialization || 'Разное'}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 flex items-center gap-0.5">
                      <MapPin size={10} /> {proj.location}
                    </span>
                  </div>
                  <h4 className="font-black text-sm leading-tight truncate">{proj.title}</h4>
                  {proj.description && (
                    <p className="text-[11px] text-gray-500 font-bold mt-0.5 line-clamp-1">{proj.description}</p>
                  )}
                  <p className="text-[10px] text-gray-400 font-bold mt-1">Зак.: {proj.employer_name}</p>
                </div>

                {/* Right: budget + button */}
                <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                  <span className="font-black text-base text-brand leading-none">
                    {proj.budget ? `${proj.budget.toLocaleString('ru-RU')} ₽` : 'Догов.'}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleBid(proj.id)}
                    className="h-7 px-3 text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                  >
                    Отклик
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {projects.length > WIDGET_LIMIT && (
        <Link
          href="/projects"
          className="mt-3 w-full inline-flex items-center justify-center gap-1 text-xs font-bold text-gray-500 hover:text-brand transition-colors"
        >
          Ещё {projects.length - WIDGET_LIMIT} заказа <ArrowUpRight size={11} />
        </Link>
      )}

    </div>
  );
}
