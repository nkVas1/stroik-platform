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
    description: '\u0411\u0430\u0437\u043e\u0432\u044b\u0439 \u0434\u043e\u0441\u0442\u0443\u043f',
  },
  start: {
    label: 'START',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: Zap,
    description: '1\u00a0990 \u20bd / \u043c\u0435\u0441',
  },
  pro: {
    label: 'PRO',
    color: 'text-orange-700',
    bg: 'bg-brand/10',
    icon: Zap,
    description: '4\u00a0990 \u20bd / \u043c\u0435\u0441',
  },
  team: {
    label: 'TEAM',
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: Users,
    description: '14\u00a0990 \u20bd / \u043c\u0435\u0441',
  },
  enterprise: {
    label: 'ENTERPRISE',
    color: 'text-white',
    bg: 'bg-black',
    icon: Building2,
    description: '\u0418\u043d\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043b\u044c\u043d\u044b\u0439',
  },
};

interface Props {
  /** Legacy prop kept for back-compat; actual plan is fetched from API */
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
    <div className={`border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark overflow-hidden`}>
      {/* Header strip */}
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
            \u2713 \u0422\u0430\u0440\u0438\u0444 \u0430\u043a\u0442\u0438\u0432\u0435\u043d
          </p>
        ) : (
          <p className="text-xs font-bold text-gray-500 mb-3">
            \u041f\u0435\u0440\u0435\u0439\u0434\u0438\u0442\u0435 \u043d\u0430 Start \u0438\u043b\u0438 Pro, \u0447\u0442\u043e\u0431\u044b \u043f\u043e\u043b\u0443\u0447\u0430\u0442\u044c \u0431\u043e\u043b\u044c\u0448\u0435 \u0437\u0430\u044f\u0432\u043e\u043a
          </p>
        )}
        <Link
          href="/dashboard/subscription"
          className="w-full flex items-center justify-between group"
        >
          <span className="text-xs font-black uppercase hover:text-brand transition-colors">
            {isPaid ? '\u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u043f\u043e\u0434\u043f\u0438\u0441\u043a\u043e\u0439' : '\u041f\u043e\u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0442\u0430\u0440\u0438\u0444\u044b'}
          </span>
          <ChevronRight size={14} className="text-gray-400 group-hover:text-brand transition-colors" />
        </Link>
      </div>
    </div>
  );
}
