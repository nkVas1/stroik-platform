'use client';

import { useEffect, useState } from 'react';
import { CreditCard, ChevronRight, Zap, Users, Star, Building2 } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

const PLAN_META: Record<string, {
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  description: string;
}> = {
  free: {
    label: 'FREE',
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    icon: Star,
    description: 'Базовый доступ',
  },
  start: {
    label: 'START',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: Zap,
    description: '1 990 ₽ / мес',
  },
  pro: {
    label: 'PRO',
    color: 'text-orange-700',
    bg: 'bg-brand/10',
    icon: Zap,
    description: '4 990 ₽ / мес',
  },
  team: {
    label: 'TEAM',
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: Users,
    description: '14 990 ₽ / мес',
  },
  enterprise: {
    label: 'ENTERPRISE',
    color: 'text-white',
    bg: 'bg-black',
    icon: Building2,
    description: 'Индивидуальный',
  },
};

interface Props {
  plan?: string;
}

export function SubscriptionWidget({ plan: planProp }: Props) {
  const [plan, setPlan] = useState<string>(planProp ?? 'free');
  const [loading, setLoading] = useState(!planProp);

  useEffect(() => {
    apiGet<{ plan?: string }>('/api/users/me')
      .then(me => setPlan((me.plan ?? 'free').toLowerCase()))
      .catch(() => { /* keep default */ })
      .finally(() => setLoading(false));
  }, []);

  const meta = PLAN_META[plan] ?? PLAN_META.free;
  const Icon = meta.icon;
  const isPaid = plan !== 'free';

  if (loading) {
    return (
      <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-5">
        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
        <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark overflow-hidden">
      <div className={`${meta.bg} px-5 py-4 border-b-2 border-black flex items-center gap-3`}>
        <Icon size={18} className={meta.color} />
        <div className="flex-1">
          <p className={`font-black text-lg leading-none ${meta.color}`}>{meta.label}</p>
          <p className={`text-xs font-bold opacity-70 mt-0.5 ${meta.color}`}>{meta.description}</p>
        </div>
        <CreditCard size={16} className="text-gray-400" />
      </div>

      <div className="bg-surface-cardLight dark:bg-surface-cardDark px-5 py-4">
        {isPaid ? (
          <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-3">
            ✓ Тариф активен
          </p>
        ) : (
          <p className="text-xs font-bold text-gray-500 mb-3">
            Перейдите на Start или Pro, чтобы получать больше заявок
          </p>
        )}
        <Link
          href="/dashboard/subscription"
          className="w-full flex items-center justify-between group"
        >
          <span className="text-xs font-black uppercase hover:text-brand transition-colors">
            {isPaid ? 'Управление подпиской' : 'Посмотреть тарифы'}
          </span>
          <ChevronRight size={14} className="text-gray-400 group-hover:text-brand transition-colors" />
        </Link>
      </div>
    </div>
  );
}
