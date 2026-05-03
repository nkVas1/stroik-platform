'use client';

import { CreditCard, ArrowUpRight, Zap } from 'lucide-react';
import Link from 'next/link';

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: 'Free', color: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
  start: { label: 'Start', color: 'bg-blue-100 text-blue-800' },
  pro: { label: 'Pro', color: 'bg-brand text-black' },
  team: { label: 'Team', color: 'bg-purple-100 text-purple-800' },
  enterprise: { label: 'Enterprise', color: 'bg-black text-white' },
};

interface Props {
  plan?: string;
}

export function SubscriptionWidget({ plan = 'free' }: Props) {
  const planData = PLAN_LABELS[plan.toLowerCase()] ?? PLAN_LABELS.free;
  const isFree = plan.toLowerCase() === 'free';

  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-sm uppercase tracking-wide">Подписка</h3>
        <CreditCard size={16} className="text-gray-400" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <span className={`px-3 py-1 rounded-brutal border-2 border-black font-black text-sm uppercase ${planData.color}`}>
          {planData.label}
        </span>
        <span className="text-xs font-bold text-gray-500">
          {isFree ? 'Бесплатный доступ' : 'Активная подписка'}
        </span>
      </div>

      {isFree && (
        <div className="bg-amber-50 dark:bg-gray-800 border-2 border-brand rounded-brutal p-3 mb-3">
          <p className="text-xs font-black uppercase text-amber-700 dark:text-brand mb-0.5">Больше заявок</p>
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
            Start — до 10 откликов/мес и AI-подбор
          </p>
        </div>
      )}

      <Link
        href="/dashboard/subscription"
        className="w-full inline-flex items-center justify-center gap-2 bg-brand border-2 border-black text-black font-black text-xs uppercase py-2 rounded-brutal shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
      >
        <Zap size={13} /> {isFree ? 'Подключить Start' : 'Управлять подпиской'}
      </Link>

      <Link
        href="/dashboard/subscription"
        className="mt-2 w-full inline-flex items-center justify-center gap-1 text-xs font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors"
      >
        Все тарифы <ArrowUpRight size={11} />
      </Link>
    </div>
  );
}
