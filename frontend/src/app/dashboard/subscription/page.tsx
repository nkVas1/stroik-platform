'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle, Zap, Users, Building2,
  CreditCard, Star, X as XIcon, ArrowLeft, Mail,
} from 'lucide-react';
import Link from 'next/link';
import { apiGet, apiPost } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const PLANS = [
  {
    id: 'free',
    label: 'FREE',
    price: 'Бесплатно',
    sub: null,
    icon: Star,
    headerBg: 'bg-gray-100 dark:bg-gray-800',
    headerText: 'text-gray-800 dark:text-gray-200',
    cardBorder: 'border-gray-300 dark:border-gray-600',
    activeBorder: 'border-green-500',
    badge: null,
    badgeColor: '',
    ctaBg: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
    features: [
      'Базовый профиль',
      'До 3 фото / кейсов',
      'Каталог заказов',
      'Ограниченные отклики',
      'Базовый чат',
    ],
    missing: ['Приоритетная выдача', 'AI-подбор', 'Верификация кейсов'],
  },
  {
    id: 'start',
    label: 'START',
    price: '1 990 ₽',
    sub: 'в мес',
    icon: Zap,
    headerBg: 'bg-blue-600',
    headerText: 'text-white',
    cardBorder: 'border-blue-400',
    activeBorder: 'border-green-500',
    badge: null,
    badgeColor: '',
    ctaBg: 'bg-blue-600 text-white',
    features: [
      'До 10 откликов / мес',
      'Расширенный профиль',
      'Базовая статистика',
      'AI-подбор заявок',
    ],
    missing: ['Приоритетная выдача', 'Верификация кейсов'],
  },
  {
    id: 'pro',
    label: 'PRO',
    price: '4 990 ₽',
    sub: 'в мес',
    icon: Zap,
    headerBg: 'bg-brand',
    headerText: 'text-black',
    cardBorder: 'border-brand',
    activeBorder: 'border-green-500',
    badge: 'ПОПУЛЯРНО',
    badgeColor: 'bg-black text-white',
    ctaBg: 'bg-brand text-black',
    features: [
      'Безлимит откликов',
      'Приоритетная выдача',
      'Верификация кейсов',
      'Автоподсказки по цене',
      'Виртуальные бригады',
      'Полная аналитика',
    ],
    missing: [],
  },
  {
    id: 'team',
    label: 'TEAM',
    price: '14 990 ₽',
    sub: 'в мес',
    icon: Users,
    headerBg: 'bg-purple-600',
    headerText: 'text-white',
    cardBorder: 'border-purple-400',
    activeBorder: 'border-green-500',
    badge: 'БРИГАДА',
    badgeColor: 'bg-purple-600 text-white',
    ctaBg: 'bg-purple-600 text-white',
    features: [
      'Всё из Pro',
      'Мультипользователь',
      'CRM для объектов',
      'AI-сборка бригады',
      'Документооборот',
      'SLA-контроль',
    ],
    missing: [],
  },
];

export default function SubscriptionPage() {
  const toast = useToast();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const me = await apiGet<{ plan?: string }>('/api/users/me');
      setCurrentPlan((me.plan ?? 'free').toLowerCase());
    } catch {
      setCurrentPlan('free');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) return;
    setUpgrading(planId);
    try {
      await apiPost('/api/subscriptions/upgrade', { plan: planId });
      toast.success(`Тариф ${planId.toUpperCase()} подключён!`);
      setCurrentPlan(planId);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка подключения');
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="sticky top-0 z-40 bg-surface-cardLight dark:bg-surface-cardDark border-b-2 border-black px-4 md:px-8 h-14 flex items-center gap-3">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-black uppercase hover:text-brand transition-colors">
          <ArrowLeft size={14} /> Вернуться
        </Link>
        <div className="flex-1" />
        <CreditCard size={16} className="text-gray-400" />
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
            <CreditCard size={20} className="text-black" />
          </div>
          <div>
            <h1 className="font-black text-2xl md:text-3xl uppercase">Подписка</h1>
            <p className="text-xs font-bold text-gray-500">Тарифы и возможности платформы</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0,1,2,3].map(i => (
              <div key={i} className="h-96 border-2 border-black rounded-brutal animate-pulse bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map(plan => {
              const isActive = currentPlan === plan.id;
              const Icon = plan.icon;
              const border = isActive ? plan.activeBorder : plan.cardBorder;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col border-2 ${border} rounded-brutal overflow-hidden transition-all ${
                    isActive
                      ? 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
                  }`}
                >
                  {(plan.badge && !isActive) && (
                    <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
                      <span className={`px-3 py-0.5 text-[10px] font-black uppercase rounded-b-brutal border-b-2 border-x-2 border-black ${plan.badgeColor}`}>
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
                      <span className="px-3 py-0.5 text-[10px] font-black uppercase rounded-b-brutal border-b-2 border-x-2 border-black bg-green-500 text-white">
                        Текущий план
                      </span>
                    </div>
                  )}

                  <div className={`${plan.headerBg} pt-9 pb-5 px-5 border-b-2 border-black`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon size={15} className={plan.headerText} />
                      <span className={`font-black text-xs uppercase tracking-widest ${plan.headerText}`}>{plan.label}</span>
                    </div>
                    <div className={`font-black text-3xl leading-none ${plan.headerText}`}>{plan.price}</div>
                    {plan.sub && <div className={`text-xs font-bold mt-1 opacity-70 ${plan.headerText}`}>{plan.sub}</div>}
                  </div>

                  <div className="flex-1 bg-surface-cardLight dark:bg-surface-cardDark px-4 py-4 space-y-2">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle size={12} className="text-green-500 shrink-0 mt-0.5" />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{f}</span>
                      </div>
                    ))}
                    {plan.missing.map((f, i) => (
                      <div key={`m${i}`} className="flex items-start gap-2">
                        <XIcon size={12} className="text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
                        <span className="text-xs font-bold text-gray-300 dark:text-gray-600">{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="px-4 pb-5 bg-surface-cardLight dark:bg-surface-cardDark">
                    <button
                      disabled={isActive || upgrading === plan.id}
                      onClick={() => handleUpgrade(plan.id)}
                      className={`w-full py-2.5 border-2 border-black rounded-brutal font-black text-xs uppercase transition-all ${
                        isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-default'
                          : `${plan.ctaBg} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px`
                      }`}
                    >
                      {isActive
                        ? 'Текущий план'
                        : upgrading === plan.id
                          ? 'Подключение...'
                          : `⚡ Перейти на ${plan.label}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 border-2 border-black rounded-brutal overflow-hidden shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <div className="bg-black text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Building2 size={26} className="text-brand shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-black text-lg uppercase tracking-widest">Enterprise</span>
                  <span className="text-[10px] font-black uppercase bg-brand text-black px-2 py-0.5 rounded-brutal border border-black">Девелоперы</span>
                </div>
                <p className="text-xs font-bold text-gray-400">
                  White-label кабинет · API · Индивидуальный SLA · Массовый подбор · Аккаунт-менеджер
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              <span className="font-black text-2xl">79 000+ ₽<span className="text-sm font-bold text-gray-400"> /мес</span></span>
              <a
                href="mailto:hello@stroik.ru?subject=Enterprise"
                className="inline-flex items-center gap-2 bg-brand text-black border-2 border-brand font-black text-xs uppercase px-4 py-2 rounded-brutal hover:bg-yellow-400 transition-colors"
              >
                <Mail size={13} /> Связаться
              </a>
            </div>
          </div>
        </div>

        <p className="mt-6 text-xs font-bold text-gray-400 text-center">
          Оплата картой или СБП · Автопродление в один клик · Отмена в любой момент
        </p>
      </div>
    </div>
  );
}
