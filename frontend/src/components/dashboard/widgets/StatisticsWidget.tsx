'use client';

import { useEffect, useState, useCallback } from 'react';
import { BarChart2, Send, CheckCircle, Star, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

interface Stats {
  role: string;
  views_30d: number;
  rating: number | null;
  completed: number;
  bids_total: number;
  bids_accepted: number;
  bids_pending: number;
}

export function StatisticsWidget() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<Stats>('/api/users/me/stats');
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-5 animate-pulse">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[0,1,2,3].map(i => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const s = stats;

  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b-2 border-black flex items-center gap-2">
        <BarChart2 size={15} className="text-brand" />
        <span className="font-black text-xs uppercase">Статистика</span>
        <Link href="/dashboard/statistics"
          className="ml-auto text-xs font-black uppercase text-gray-400 hover:text-brand flex items-center gap-0.5 transition-colors">
          Подробнее <ChevronRight size={11} />
        </Link>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              icon: Send,
              label: s?.role === 'worker' ? 'Отклики' : 'Проекты',
              value: s?.bids_total ?? '—',
              sub: 'всего',
            },
            {
              icon: CheckCircle,
              label: 'Завершено',
              value: s?.completed ?? '—',
              sub: 'проектов',
            },
            {
              icon: Star,
              label: 'Рейтинг',
              value: s?.rating !== null && s?.rating !== undefined
                ? s.rating.toFixed(1)
                : '—',
              sub: 'средний',
            },
            {
              icon: BarChart2,
              label: 'Принято',
              value: s?.bids_accepted ?? '—',
              sub: 'откликов',
            },
          ].map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="bg-gray-50 dark:bg-gray-900/50 border border-black/10 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={11} className="text-gray-400" />
                <span className="text-[10px] font-black uppercase text-gray-400">{label}</span>
              </div>
              <p className="font-black text-xl leading-none text-gray-900 dark:text-white">{value}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
