import Link from 'next/link';
import { Check, X, Zap, ShieldCheck, Users, Building2, Sparkles } from 'lucide-react';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { Button } from '@/components/ui/Button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Тарифы — СТРОИК',
  description:
    'Выберите подходящий тариф для развития вашего бизнеса на платформе СТРОИК. Начните бесплатно, масштабируйтесь по мере роста.',
};

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  bgColor: string;
  popular?: boolean;
  features: PlanFeature[];
  cta: string;
  ctaHref: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0 ₽',
    priceNote: 'навсегда',
    description: 'Для новых исполнителей, которые хотят попробовать платформу',
    icon: Zap,
    accentColor: 'border-gray-400',
    bgColor: 'bg-white dark:bg-gray-900',
    features: [
      { text: 'Базовый профиль', included: true },
      { text: 'До 3 фото / кейсов', included: true },
      { text: 'Каталог как исполнитель', included: true },
      { text: 'Базовый чат с заказчиками', included: true },
      { text: 'До 3 откликов / месяц', included: true },
      { text: 'Приоритетная выдача в каталоге', included: false },
      { text: 'Верификация кейсов', included: false },
      { text: 'AI-подбор', included: false },
      { text: 'Статистика профиля', included: false },
    ],
    cta: 'Начать бесплатно',
    ctaHref: '/onboarding',
  },
  {
    id: 'start',
    name: 'Start',
    price: 'от 1 990 ₽',
    priceNote: 'в месяц',
    description: 'Одиночные мастера и специалисты, начинающие работать через платформу',
    icon: Zap,
    accentColor: 'border-blue-500',
    bgColor: 'bg-white dark:bg-gray-900',
    features: [
      { text: 'До 10 откликов / месяц', included: true },
      { text: 'Расширенный профиль', included: true },
      { text: 'Базовая статистика', included: true },
      { text: 'AI-подбор заявок', included: true },
      { text: 'Верификация профиля', included: true },
      { text: 'Приоритетная выдача в каталоге', included: false },
      { text: 'Верификация кейсов', included: false },
      { text: 'Виртуальная бригада', included: false },
      { text: 'CRM и документооборот', included: false },
    ],
    cta: 'Выбрать Start',
    ctaHref: '/onboarding?plan=start',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'от 4 990 ₽',
    priceNote: 'в месяц',
    description: 'Опытные мастера и микробригады, которым важна репутация',
    icon: ShieldCheck,
    accentColor: 'border-brand',
    bgColor: 'bg-brand/5 dark:bg-brand/10',
    popular: true,
    features: [
      { text: 'Безлимит откликов', included: true },
      { text: 'Приоритетная выдача в каталоге', included: true },
      { text: 'Верификация кейсов (договор + фото)', included: true },
      { text: 'Автоподсказки по цене', included: true },
      { text: 'AI-подбор + Premium', included: true },
      { text: 'Виртуальная бригада', included: true },
      { text: 'Расширенная статистика', included: true },
      { text: 'CRM и документооборот', included: false },
      { text: 'White-label / API', included: false },
    ],
    cta: 'Выбрать Pro',
    ctaHref: '/onboarding?plan=pro',
  },
  {
    id: 'team',
    name: 'Team',
    price: 'от 14 990 ₽',
    priceNote: 'в месяц',
    description: 'Бригады, ИП, ООО и прорабы, управляющие несколькими объектами',
    icon: Users,
    accentColor: 'border-purple-500',
    bgColor: 'bg-white dark:bg-gray-900',
    features: [
      { text: 'Всё из Pro', included: true },
      { text: 'Мультипользовательский доступ', included: true },
      { text: 'CRM и документооборот', included: true },
      { text: 'AI-сборка бригады под объект', included: true },
      { text: 'SLA-контроль сроков', included: true },
      { text: 'Безопасная сделка (эскроу)', included: true },
      { text: 'Приоритетная поддержка', included: true },
      { text: 'White-label / API', included: false },
      { text: 'Аккаунт-менеджер', included: false },
    ],
    cta: 'Выбрать Team',
    ctaHref: '/onboarding?plan=team',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'от 79 000 ₽',
    priceNote: 'в месяц',
    description: 'Для девелоперов, УК и генподрядчиков с множеством объектов',
    icon: Building2,
    accentColor: 'border-black dark:border-white',
    bgColor: 'bg-black text-white dark:bg-white dark:text-black',
    features: [
      { text: 'Всё из Team', included: true },
      { text: 'White-label кабинет', included: true },
      { text: 'API интеграция', included: true },
      { text: 'Индивидуальный SLA', included: true },
      { text: 'Массовый подбор исполнителей', included: true },
      { text: 'Аналитика и отчётность', included: true },
      { text: 'Аккаунт-менеджер', included: true },
      { text: 'Онбординг условий', included: true },
      { text: 'Индивидуальный договор', included: true },
    ],
    cta: 'Обсудить условия',
    ctaHref: 'mailto:hello@stroik.ru?subject=Enterprise',
  },
];

const ADDONS = [
  {
    category: 'AI-подбор',
    icon: Sparkles,
    items: [
      { name: 'Базовый подбор', price: 'бесплатно' },
      { name: 'Premium-подбор', price: '490 — 1 990 ₽ / заявка' },
      { name: 'Сборка вирт. бригады', price: '3 990 — 14 990 ₽' },
    ],
  },
  {
    category: 'Верификация',
    icon: ShieldCheck,
    items: [
      { name: 'Проверка профиля', price: '990 — 3 990 ₽' },
      { name: 'Проверка кейса', price: '1 490 — 4 990 ₽' },
      { name: 'Юр. проверка объекта', price: '10 000 — 30 000 ₽' },
    ],
  },
  {
    category: 'Безопасная сделка',
    icon: Zap,
    items: [
      { name: 'Эскроу', price: '1 — 2,5% от суммы' },
      { name: 'Ускор. вывод', price: '1 — 3%' },
      { name: 'Split-платежи', price: '0,5 — 1,5%' },
    ],
  },
  {
    category: 'Лиды',
    icon: Users,
    items: [
      { name: 'Частный заказ', price: '150 — 500 ₽' },
      { name: 'Средний ремонт', price: '500 — 1 500 ₽' },
      { name: 'Крупный объект', price: '2 000 — 10 000 ₽' },
    ],
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  const isEnterprise = plan.id === 'enterprise';
  const textColor = isEnterprise ? 'text-white dark:text-black' : 'text-black dark:text-white';
  const mutedColor = isEnterprise ? 'text-white/70 dark:text-black/70' : 'text-gray-500';
  const borderColor = isEnterprise ? 'border-white/20 dark:border-black/20' : 'border-black/10';
  const checkColor = isEnterprise ? 'text-brand' : 'text-green-500';
  const xColor = isEnterprise ? 'text-white/30 dark:text-black/30' : 'text-gray-300';

  return (
    <div
      className={`relative flex flex-col rounded-brutal border-2 ${plan.accentColor} ${plan.bgColor} p-6 shadow-brutal-light dark:shadow-brutal-dark`}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-brand border-2 border-black px-3 py-1 text-[10px] font-black uppercase rounded-brutal shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <Sparkles size={9} /> Популярный
          </span>
        </div>
      )}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <plan.icon size={16} className={checkColor} />
          <h2 className={`font-black text-base uppercase tracking-wider ${textColor}`}>{plan.name}</h2>
        </div>
        <div className={`text-2xl font-black ${textColor}`}>{plan.price}</div>
        {plan.priceNote && <div className={`text-xs font-bold ${mutedColor}`}>{plan.priceNote}</div>}
        <p className={`text-xs font-bold mt-2 ${mutedColor}`}>{plan.description}</p>
      </div>
      <ul className={`flex-1 space-y-2 border-t-2 ${borderColor} pt-4 mb-5`}>
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-center gap-2">
            {f.included
              ? <Check size={13} className={`shrink-0 ${checkColor}`} />
              : <X size={13} className={`shrink-0 ${xColor}`} />}
            <span
              className={`text-xs font-bold ${
                f.included
                  ? textColor
                  : isEnterprise
                  ? 'text-white/40 dark:text-black/40'
                  : 'text-gray-400'
              }`}
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>
      <Link href={plan.ctaHref}>
        <Button
          className={`w-full font-black uppercase text-xs border-2 ${
            isEnterprise
              ? 'bg-white dark:bg-black text-black dark:text-white border-white dark:border-black'
              : plan.popular
              ? 'bg-brand text-black border-black'
              : 'border-black'
          }`}
        >
          {plan.cta}
        </Button>
      </Link>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <SiteHeader showAuthCta />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">

        {/* Page header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 border-2 border-black rounded-brutal px-3 py-1 bg-brand text-black text-[10px] font-black uppercase mb-4">
            <Sparkles size={10} /> Тарифы СТРОИК
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4">
            Цены для исполнителей
          </h1>
          <p className="text-base font-bold text-gray-500 max-w-xl mx-auto">
            Начните бесплатно. Поднимайтесь, когда будете готовы. Платите только за результат.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mb-20">
          {PLANS.map((plan) => <PlanCard key={plan.id} plan={plan} />)}
        </div>

        {/* Add-ons */}
        <div className="mb-20">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2">Дополнительные услуги</h2>
          <p className="text-sm font-bold text-gray-500 mb-8">Подключайте только то, что нужно</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {ADDONS.map((addon) => (
              <div
                key={addon.category}
                className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 shadow-brutal-light dark:shadow-brutal-dark"
              >
                <div className="flex items-center gap-2 mb-4">
                  <addon.icon size={15} className="text-brand" />
                  <h3 className="font-black text-xs uppercase tracking-wider">{addon.category}</h3>
                </div>
                <ul className="space-y-2">
                  {addon.items.map((item) => (
                    <li key={item.name} className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{item.name}</span>
                      <span className="text-xs font-black text-right shrink-0">{item.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA banner — no internal business metrics */}
        <div className="border-2 border-black rounded-brutal bg-brand p-8 md:p-10 text-center mb-12">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-3">
            Готовы начать?
          </h2>
          <p className="text-sm font-bold text-black/75 max-w-lg mx-auto mb-6">
            Регистрация через ИИ-ассистент — меньше минуты. Начните с бесплатного тарифа
            и убедитесь, что платформа работает для вас.
          </p>
          <Link href="/onboarding">
            <Button className="bg-black text-white border-2 border-black font-black uppercase">
              Зарегистрироваться бесплатно
            </Button>
          </Link>
        </div>

      </main>
      <SiteFooter />
    </div>
  );
}
