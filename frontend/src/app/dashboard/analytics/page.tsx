'use client';

import { BarChart3, ArrowLeft, TrendingUp, Eye, Star, CheckSquare } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black uppercase mb-6 hover:text-brand transition-colors"
        >
          <ArrowLeft size={14} /> Вернуться
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
            <BarChart3 size={20} className="text-black" />
          </div>
          <div>
            <h1 className="font-black text-2xl uppercase">Аналитика</h1>
            <p className="text-xs font-bold text-gray-500">Полная статистика вашей деятельности</p>
          </div>
        </div>

        {/* KPI сетка */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Eye,         label: 'Просмотры профиля', value: '—', period: 'за 30 дней' },
            { icon: TrendingUp,  label: 'Отклики',           value: '—', period: 'всего' },
            { icon: Star,        label: 'Рейтинг',           value: '—', period: 'средний' },
            { icon: CheckSquare, label: 'Завершёно',         value: '—', period: 'проектов' },
          ].map(({ icon: Icon, label, value, period }) => (
            <div
              key={label}
              className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-4 shadow-brutal-light dark:shadow-brutal-dark"
            >
              <Icon size={18} className="text-brand mb-2" />
              <p className="text-3xl font-black">{value}</p>
              <p className="text-[10px] font-black uppercase text-gray-500 mt-0.5">{label}</p>
              <p className="text-[10px] font-bold text-gray-400">{period}</p>
            </div>
          ))}
        </div>

        {/* Плейсхолдер графиков */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['Просмотры за 90 дней', 'Отклики и принятия'].map((title) => (
            <div
              key={title}
              className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-brutal-light dark:shadow-brutal-dark"
            >
              <h3 className="font-black text-sm uppercase mb-4">{title}</h3>
              <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-brutal">
                <p className="text-xs font-bold text-gray-400">График — Phase 2</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-amber-50 dark:bg-gray-800 border-2 border-dashed border-brand rounded-brutal">
          <p className="text-xs font-black uppercase text-amber-700 dark:text-brand">Полная аналитика доступна в тарифе Pro</p>
          <p className="text-xs font-bold text-gray-500 mt-0.5">Графики активности, воронка заявок, доход и LTV — в следующем релизе</p>
        </div>

      </div>
    </div>
  );
}
