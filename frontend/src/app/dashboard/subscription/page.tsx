'use client';

import { CreditCard, ArrowLeft, Check, Zap } from 'lucide-react';
import Link from 'next/link';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'всегда',
    color: 'bg-gray-100 dark:bg-gray-800',
    badge: '',
    features: [
      'Базовый профиль',
      'До 3 фото / кейсов',
      'Каталог заказов',
      'Ограниченные отклики',
      'Базовый чат',
    ],
  },
  {
    id: 'start',
    name: 'Start',
    price: 1990,
    period: 'в мес',
    color: 'bg-blue-50 dark:bg-blue-950',
    badge: '',
    features: [
      'До 10 откликов / мес',
      'Расширенный профиль',
      'Базовая статистика',
      'AI-подбор заявок',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 4990,
    period: 'в мес',
    color: 'bg-brand',
    badge: 'ПОПУЛЯРНО',
    features: [
      'Безлимит откликов',
      'Приоритетная выдача',
      'Верификация кейсов',
      'Автоподсказки по цене',
      'Виртуальные бригады',
      'Полная аналитика',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: 14990,
    period: 'в мес',
    color: 'bg-purple-50 dark:bg-purple-950',
    badge: 'БРИГАДА',
    features: [
      'Всё из Pro',
      'Мультипользователь',
      'CRM для объектов',
      'AI-сборка бригады',
      'Документооборот',
      'SLA-контроль',
    ],
  },
];

export default function SubscriptionPage() {
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
            <CreditCard size={20} className="text-black" />
          </div>
          <div>
            <h1 className="font-black text-2xl uppercase">Подписка</h1>
            <p className="text-xs font-bold text-gray-500">Тарифы и возможности платформы</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative border-2 border-black rounded-brutal p-5 shadow-brutal-light dark:shadow-brutal-dark flex flex-col ${plan.color}`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-brutal">
                  {plan.badge}
                </span>
              )}

              <h3 className="font-black text-xl uppercase mb-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-black">
                  {plan.price === 0 ? 'Бесплатно' : `${plan.price.toLocaleString('ru-RU')} ₽`}
                </span>
                {plan.price > 0 && (
                  <span className="text-xs font-bold text-gray-500 ml-1">{plan.period}</span>
                )}
              </div>

              <ul className="space-y-1.5 flex-1 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs font-bold">
                    <Check size={12} className="text-green-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2.5 border-2 border-black rounded-brutal font-black text-xs uppercase transition-all
                  ${
                    plan.id === 'free'
                      ? 'bg-white dark:bg-gray-700 text-gray-400 cursor-default'
                      : 'bg-black text-white hover:bg-brand hover:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5'
                  }`}
                disabled={plan.id === 'free'}
              >
                {plan.id === 'free' ? 'Текущий план' : (
                  <span className="inline-flex items-center gap-1 justify-center">
                    <Zap size={12} /> Перейти на {plan.name}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs font-bold text-gray-400 mt-6">
          Оплата картой или СБП · Автопродление в один клик · Отмена в любой момент
        </p>

      </div>
    </div>
  );
}
