'use client';

import { Eye, SendHorizonal, Star, CheckSquare, Layers, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface Props {
  role: 'worker' | 'employer';
  bidsCount?: number;
  projectsCount?: number;
}

export function StatsWidget({ role, bidsCount = 0, projectsCount = 0 }: Props) {
  const isWorker = role === 'worker';

  const stats = isWorker
    ? [
        { icon: Eye,          label: 'Просмотры',   value: '—',               sub: 'за 30 дней'   },
        { icon: SendHorizonal, label: 'Отклики',    value: String(bidsCount),     sub: 'всего'        },
        { icon: Star,          label: 'Рейтинг',    value: '—',               sub: 'средний'      },
        { icon: CheckSquare,   label: 'Завершено',  value: '—',               sub: 'проектов'    },
      ]
    : [
        { icon: Layers,        label: 'Объекты',    value: String(projectsCount), sub: 'активных'    },
        { icon: SendHorizonal, label: 'Отклики',    value: String(bidsCount),     sub: 'получено'     },
        { icon: Star,          label: 'Ср. оценка', value: '—',               sub: 'по договорам' },
        { icon: CheckSquare,   label: 'Закрыто',    value: '—',               sub: 'сделок'       },
      ];

  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-sm uppercase tracking-wide">Статистика</h3>
        <Link
          href="/dashboard/analytics"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
        >
          Подробнее <ArrowUpRight size={12} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ icon: Icon, label, value, sub }) => (
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
    </div>
  );
}
