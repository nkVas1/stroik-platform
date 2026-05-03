'use client';

/**
 * StatisticsWidget — CANONICAL stats widget for the dashboard.
 * Replaces the deleted StatsWidget.tsx.
 *
 * - Fetches real data from /api/users/me/stats
 * - Accepts optional fallback props (role, bidsCount, projectsCount)
 *   so it works even before the API responds
 * - Links to /dashboard/statistics (canonical full-page analytics)
 */

import { useEffect, useState, useCallback } from 'react';
import { Eye, Send, Star, CheckCircle, BarChart2, ArrowUpRight } from 'lucide-react';
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

interface Props {
  /** Fallback role from parent (used for initial render before API responds) */
  role?: 'worker' | 'employer';
  /** Fallback bids count from parent dashboard data */
  bidsCount?: number;
  /** Fallback projects count from parent dashboard data */
  projectsCount?: number;
}

export function StatisticsWidget({ role: fallbackRole, bidsCount = 0, projectsCount = 0 }: Props) {
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

  const role = stats?.role ?? fallbackRole ?? 'worker';
  const isWorker = role === 'worker';

  const items = [
    {
      icon: Eye,
      label: 'Просмотры',
      value: stats?.views_30d != null ? String(stats.views_30d) : '—',
      sub: 'за 30 дней',
    },
    {
      icon: Send,
      label: isWorker ? 'Отклики' : 'Проекты',
      value: stats?.bids_total != null
        ? String(stats.bids_total)
        : String(isWorker ? bidsCount : projectsCount),
      sub: 'всего',
    },
    {
      icon: Star,
      label: 'Рейтинг',
      value: stats?.rating != null ? stats.rating.toFixed(1) : '—',
      sub: 'средний',
    },
    {
      icon: CheckCircle,
      label: 'Завершено',
      value: stats?.completed != null ? String(stats.completed) : '—',
      sub: 'проектов',
    },
  ];

  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 size={15} className="text-brand" />
          <h3 className="font-black text-sm uppercase tracking-wide">Статистика</h3>
        </div>
        <Link
          href="/dashboard/statistics"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline transition-colors"
        >
          Подробнее <ArrowUpRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
          {[0,1,2,3].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-brutal border border-gray-200 dark:border-gray-700" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map(({ icon: Icon, label, value, sub }) => (
            <div
              key={label}
              className="bg-surface-light dark:bg-surface-dark border-2 border-black rounded-brutal p-3 flex flex-col gap-0.5"
            >
              <Icon size={16} className="text-brand mb-1" />
              <span className="text-2xl font-black leading-none">{value}</span>
              <span className="text-[10px] font-black uppercase text-gray-500">{label}</span>
              <span className="text-[10px] font-bold text-gray-400">{sub}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
