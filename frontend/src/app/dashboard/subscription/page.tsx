'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft, CheckCircle, Zap, Users, Building2,
  CreditCard, Star, X as XIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { apiGet, apiPost } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface UserMe {
  plan?: string;
}

const PLANS = [
  {
    id: 'free',
    label: 'Free',
    price: 0,
    priceLabel: 'Бесплатно',
    icon: Star,
    color: 'border-gray-300 dark:border-gray-700',
    activeColor: 'border-brand',
    features: [
      'Базовый профиль',
      'До 3 фото / кейсов',
      'Каталог исполнителей',
      'До 3 откликов в месяц',
      'Базовый чат',
    ],
    missing: ['Приоритетная выдача', 'AI-подбор', 'Верификация кейсов'],
  },
  {
    id: 'start',
    label: 'Start',
    price: 1990,
    priceLabel: '1 990 ₽ / мес',
    icon: Zap,
    color: 'border-blue-300',
    activeColor: 'border-brand',
    features: [
      'До 10 откликов в месяц',
      'Расширенный профиль',
      'Базовая статистика',
      'AI-подбор заявок',
    ],
    missing: ['Приоритетная выдача', 'Верификация кейсов'],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 4990,
    priceLabel: '4 990 ₽ / мес',
    icon: Zap,
    color: 'border-brand',
    activeColor: 'border-brand',
    badge: 'Популярный',
    features: [
      'Безлимит откликов',
      'Приоритетная выдача в поиске',
      'Верификация кейсов',
      'Автоподсказки по цене',
      'Виртуальные бригады',
      'Premium AI-подбор',
    ],
    missing: [],
  },
  {
    id: 'team',
    label: 'Team',
    price: 14990,
    priceLabel: '14 990 ₽ / мес',
    icon: Users,
    color: 'border-purple-300',
    activeColor: 'border-brand',
    features: [
      'Всё из Pro',
      'Мультипользователь',
      'CRM для прораба',
      'AI-сборка бригады',
      'Документооборот',
      'SLA-контроль',
    ],
    missing: [],
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    price: 79000,
    priceLabel: 'от 79 000 ₽ / мес',
    icon: Building2,
    color: 'border-gray-800 dark:border-gray-300',
    activeColor: 'border-brand',
    features: [
      'Всё из Team',
      'White-label кабинет',
      'API-интеграция',
      'Индивидуальный SLA',
      'Массовый подбор',
      'Аккаунт-менеджер',
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
      const me = await apiGet<UserMe>('/api/users/me');
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
    if (planId === 'enterprise') {
      window.open('mailto:hello@stroik.ru?subject=Enterprise', '_blank');
      return;
    }
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
          <ArrowLeft size={14} /> Кабинет
        </Link>
        <div className="flex-1" />
        <CreditCard size={16} className="text-gray-400" />
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-black text-3xl uppercase">Тарифы</h1>
          <p className="text-sm font-bold text-gray-500 mt-1">
            Выберите подходящий план для развития вашего бизнеса на платформе
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0,1,2].map(i => (
              <div key={i} className="h-80 border-2 border-black rounded-brutal animate-pulse bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLANS.map(plan => {
              const isActive = currentPlan === plan.id;
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col bg-surface-cardLight dark:bg-surface-cardDark border-2 rounded-brutal p-5 ${
                    isActive
                      ? 'border-brand shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      : `${plan.color} shadow-brutal-light dark:shadow-brutal-dark hover:-translate-y-0.5 transition-transform`
                  }`}
                >
                  {plan.badge && !isActive && (
                    <div className="absolute -top-3 left-4 bg-brand border-2 border-black px-2 py-0.5 rounded-brutal">
                      <span className="text-[10px] font-black uppercase">{plan.badge}</span>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute -top-3 left-4 bg-green-500 border-2 border-black px-2 py-0.5 rounded-brutal">
                      <span className="text-[10px] font-black uppercase text-white">Активен</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={18} className={isActive ? 'text-brand' : 'text-gray-400'} />
                    <h3 className="font-black text-base uppercase">{plan.label}</h3>
                  </div>

                  <div className="mb-4">
                    <span className="font-black text-xl">{plan.priceLabel}</span>
                  </div>

                  <ul className="space-y-1.5 mb-5 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                        <CheckCircle size={12} className="text-green-500 shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                    {plan.missing?.map((f, i) => (
                      <li key={`m${i}`} className="flex items-start gap-2 text-xs font-bold text-gray-400">
                        <XIcon size={12} className="text-gray-300 shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    size="sm"
                    disabled={isActive || upgrading === plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full border-2 border-black font-black uppercase text-xs ${
                      isActive
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : plan.id === 'enterprise'
                          ? 'bg-black text-white'
                          : 'bg-brand text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all'
                    }`}
                  >
                    {isActive
                      ? 'Текущий тариф'
                      : upgrading === plan.id
                        ? 'Подключение...'
                        : plan.id === 'enterprise'
                          ? 'Связаться'
                          : currentPlan > plan.id
                            ? 'Перейти'
                            : 'Подключить'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-xs font-bold text-gray-400 text-center">
          Оплата производится через безопасный шлюз · Отмена в любой момент · Без скрытых комиссий
        </p>
      </div>
    </div>
  );
}
