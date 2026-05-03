'use client';

/**
 * /dashboard/statistics — CANONICAL analytics & statistics page.
 * (Merged from: analytics/page.tsx + statistics/page.tsx)
 *
 * Features taken from analytics version:
 *   - 90-day views chart placeholder section
 *   - Bid funnel placeholder chart
 * Features taken from statistics version:
 *   - Sticky header
 *   - Real API data via /api/users/me/stats
 *   - StarRating component
 *   - Mini bar charts for bid breakdown
 *   - Recommendations block
 *   - Subscription plan display
 */

import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, TrendingUp, Star, CheckCircle,
  Send, Eye, BarChart2, HardHat, Briefcase, BarChart3,
} from 'lucide-react';
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

interface Me {
  fio?: string;
  specialization?: string;
  verification_level: number;
  plan?: string;
}

function StatCard({
  icon: Icon, label, value, sub, accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`border-2 border-black rounded-brutal p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
      accent ? 'bg-brand' : 'bg-surface-cardLight dark:bg-surface-cardDark'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className={accent ? 'text-black' : 'text-gray-400'} />
        <span className={`text-xs font-black uppercase ${
          accent ? 'text-black' : 'text-gray-500'
        }`}>{label}</span>
      </div>
      <p className={`font-black text-3xl leading-none ${
        accent ? 'text-black' : 'text-gray-900 dark:text-white'
      }`}>{value}</p>
      {sub && (
        <p className={`text-xs font-bold mt-1.5 ${
          accent ? 'text-black/60' : 'text-gray-400'
        }`}>{sub}</p>
      )}
    </div>
  );
}

function MiniBar({ label, value, max, color }: {
  label: string; value: number; max: number; color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{label}</span>
        <span className="text-xs font-black">{value}</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full border border-black/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StarRating({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs font-bold text-gray-400">Нет данных</span>;
  const full = Math.floor(value);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={16}
          className={i <= full ? 'text-brand fill-brand' : 'text-gray-300 dark:text-gray-600'}
        />
      ))}
      <span className="ml-1 text-sm font-black">{value.toFixed(1)}</span>
    </div>
  );
}

/** Placeholder chart block (from analytics page) */
function ChartPlaceholder({ title }: { title: string }) {
  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-brutal-light dark:shadow-brutal-dark">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={14} className="text-brand" />
        <h3 className="font-black text-sm uppercase">{title}</h3>
      </div>
      <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-brutal">
        <p className="text-xs font-bold text-gray-400">График — Phase 2</p>
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([
        apiGet<Stats>('/api/users/me/stats'),
        apiGet<Me>('/api/users/me'),
      ]);
      setStats(s);
      setMe(m);
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const isWorker = stats?.role === 'worker';
  const plan = (me?.plan ?? 'free').toUpperCase();

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">

      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-surface-cardLight dark:bg-surface-cardDark border-b-2 border-black px-4 md:px-8 h-14 flex items-center gap-3">
        <Link href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black uppercase hover:text-brand transition-colors">
          <ArrowLeft size={14} /> Дашборд
        </Link>
        <div className="flex-1" />
        <BarChart2 size={16} className="text-brand" />
        <span className="text-xs font-black uppercase">Аналитика и Статистика</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
            <BarChart2 size={20} className="text-black" />
          </div>
          <div>
            <h1 className="font-black text-2xl md:text-3xl uppercase">Аналитика</h1>
            <p className="text-xs font-bold text-gray-500">
              Полная статистика вашей деятельности
              {me?.fio ? ` · ${me.fio}` : ''}
              {me?.specialization ? ` · ${me.specialization}` : ''}
              {' · '}<span className="text-brand font-black">{plan}</span>
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[0,1,2,3].map(i => (
              <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-brutal" />
            ))}
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Eye}         label="Просмотры" value={stats?.views_30d || '—'} sub="за 30 дней" />
              <StatCard icon={Send}        label={isWorker ? 'Отклики' : 'Проекты'} value={stats?.bids_total ?? 0} sub="всего" />
              <StatCard icon={CheckCircle} label="Завершено" value={stats?.completed ?? 0} sub="проектов" accent />
              <StatCard icon={Star}        label="Рейтинг"   value={stats?.rating != null ? stats.rating.toFixed(1) : '—'} sub="средний" />
            </div>

            {/* Detail blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

              {isWorker && (
                <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp size={15} className="text-brand" />
                    <h2 className="font-black text-sm uppercase">Воронка откликов</h2>
                  </div>
                  <div className="space-y-4">
                    <MiniBar label="Принято"  value={stats?.bids_accepted ?? 0} max={stats?.bids_total || 1} color="bg-green-500" />
                    <MiniBar label="Ожидает"  value={stats?.bids_pending ?? 0}  max={stats?.bids_total || 1} color="bg-brand" />
                    <MiniBar
                      label="Отклонено / др."
                      value={(stats?.bids_total ?? 0) - (stats?.bids_accepted ?? 0) - (stats?.bids_pending ?? 0)}
                      max={stats?.bids_total || 1}
                      color="bg-gray-400"
                    />
                  </div>
                  {(stats?.bids_total ?? 0) > 0 && (
                    <p className="mt-4 text-xs font-bold text-gray-400">
                      Конверсия:{' '}
                      <span className="text-gray-700 dark:text-gray-300 font-black">
                        {Math.round(((stats?.bids_accepted ?? 0) / (stats?.bids_total ?? 1)) * 100)}%
                      </span>
                      {' '}принято из отправленных
                    </p>
                  )}
                </div>
              )}

              <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-5">
                  <Star size={15} className="text-brand" />
                  <h2 className="font-black text-sm uppercase">Рейтинг</h2>
                </div>
                <StarRating value={stats?.rating ?? null} />
                {stats?.rating === null && (
                  <p className="mt-3 text-xs font-bold text-gray-400">
                    Рейтинг появится после первого завершённого заказа
                  </p>
                )}
              </div>

              <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <HardHat size={15} className="text-brand" />
                  <h2 className="font-black text-sm uppercase">Тариф</h2>
                </div>
                <p className="font-black text-3xl text-brand mb-1">{plan}</p>
                <p className="text-xs font-bold text-gray-400 mb-4">
                  {plan === 'FREE' && 'Бесплатный тариф · ограниченные отклики'}
                  {plan === 'START' && '10 откликов / мес · AI-подбор'}
                  {plan === 'PRO' && 'Безлимит + приоритетная выдача'}
                  {plan === 'TEAM' && 'Виртуальные бригады · CRM'}
                  {plan === 'ENTERPRISE' && 'Индивидуальное решение'}
                </p>
                <Link href="/dashboard/subscription"
                  className="text-xs font-black uppercase text-brand hover:underline">
                  Изменить тариф →
                </Link>
              </div>

              <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase size={15} className="text-brand" />
                  <h2 className="font-black text-sm uppercase">Рекомендации</h2>
                </div>
                <ul className="space-y-2">
                  {(stats?.bids_total ?? 0) === 0 && (
                    <li className="text-xs font-bold text-gray-500">→ Откликнитесь на первый заказ</li>
                  )}
                  {(stats?.completed ?? 0) === 0 && (stats?.bids_total ?? 0) > 0 && (
                    <li className="text-xs font-bold text-gray-500">→ Завершите первый проект для получения оценки</li>
                  )}
                  {(me?.verification_level ?? 0) < 3 && (
                    <li className="text-xs font-bold text-gray-500">
                      →{' '}
                      <Link href="/dashboard/verification" className="text-brand hover:underline">Пройдите верификацию</Link>
                      {' '}— это повышает доверие
                    </li>
                  )}
                  {plan === 'FREE' && (
                    <li className="text-xs font-bold text-gray-500">
                      →{' '}
                      <Link href="/dashboard/subscription" className="text-brand hover:underline">Подключите Start</Link>
                      {' '}— 10 откликов / мес + AI-подбор
                    </li>
                  )}
                  {(stats?.completed ?? 0) >= 1 && stats?.rating != null && (
                    <li className="text-xs font-bold text-green-600 dark:text-green-400">
                      ✓ Хорошее начало! Продолжайте набирать кейсы в портфолио
                    </li>
                  )}
                </ul>
              </div>

            </div>

            {/* Chart placeholders (from analytics page) */}
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">Графики — Phase 2</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChartPlaceholder title="Просмотры за 90 дней" />
                <ChartPlaceholder title="Отклики и принятия" />
              </div>
            </div>

            {/* Pro upsell banner */}
            {plan === 'FREE' && (
              <div className="p-4 bg-amber-50 dark:bg-gray-800 border-2 border-dashed border-brand rounded-brutal">
                <p className="text-xs font-black uppercase text-amber-700 dark:text-brand">
                  Полная аналитика доступна в тарифе Pro
                </p>
                <p className="text-xs font-bold text-gray-500 mt-0.5">
                  Графики активности, воронка заявок, доход и LTV — в следующем релизе
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
