'use client';

import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Bot,
  Wallet,
  Hammer,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

/**
 * Landing (/) — публичная витрина продукта.
 *
 * Принципы вёрстки:
 * - overflow-x-hidden на корне — блокирует горизонтальный скролл от повёрнутого marquee;
 * - весь контент в секциях c max-w-7xl mx-auto — единая ритмика;
 * - плавающие виджеты видны только на lg+, чтобы не перекрывать mobile-текст;
 * - bg-blueprint только на hero — остальные секции однотонные, чтобы текст читался.
 */
export default function Home() {
  const features = [
    {
      icon: Bot,
      title: 'ИИ-ассистент',
      desc: 'Собирает ТЗ и профиль мастера в диалоге — без анкет. Работает на Gemini + локальной Ollama.',
    },
    {
      icon: ShieldCheck,
      title: 'Верификация личности',
      desc: 'Три уровня доверия: телефон, СМС-код, документы. Анонимам здесь не место.',
    },
    {
      icon: Wallet,
      title: 'Смарт-эскроу',
      desc: 'Деньги замораживаются до сдачи объекта. Заказчик платит только за результат.',
    },
    {
      icon: Hammer,
      title: 'Прозрачные отзывы',
      desc: 'Каждый отзыв привязан к реальному договору. Без накруток и ботов.',
    },
  ];

  const stats = [
    { value: '100%', label: 'Верифицированные мастера' },
    { value: '159 ₽', label: 'PRO-подписка / месяц' },
    { value: '< 60 сек', label: 'Онбординг через ИИ' },
  ];

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-surface-light dark:bg-surface-dark">

      <SiteHeader showAuthCta />

      {/* Бегущая строка.
          overflow-hidden на родительском wrapper гасит горизонтальный overflow
          от -rotate-1 + scale-105. Marquee оставлен как декоративный акцент бренда. */}
      <div className="w-full overflow-hidden">
        <div
          className="w-[105%] -ml-[2.5%] bg-brand border-y-4 border-black py-2
                     shadow-brutal-light dark:shadow-brutal-dark transform -rotate-[0.75deg]"
        >
          <div className="animate-marquee flex gap-8 whitespace-nowrap text-black font-black uppercase text-sm tracking-widest">
            <span>Безопасная сделка</span><span>•</span>
            <span>ИИ-подбор</span><span>•</span>
            <span>Верифицированные бригады</span><span>•</span>
            <span>Смарт-эскроу</span><span>•</span>
            <span>Строительство под ключ</span><span>•</span>
            <span>Безопасная сделка</span><span>•</span>
            <span>ИИ-подбор</span><span>•</span>
            <span>Верифицированные бригады</span><span>•</span>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="relative flex-1 w-full bg-blueprint">
        {/* Плавающие виджеты — только на больших экранах. На средних/мобильных
            они перекрывали текст, теперь появляются только при lg+. */}
        <div
          className="hidden lg:flex absolute left-[6%] top-[22%] bg-white dark:bg-gray-800
                     border-4 border-black p-4 rounded-brutal shadow-skeuo-inner-light
                     dark:shadow-skeuo-inner-dark transform -rotate-6"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-green-500" />
            <div className="text-left">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Статус</p>
              <p className="font-bold">Договор подписан</p>
            </div>
          </div>
        </div>

        <div
          className="hidden lg:flex absolute right-[6%] bottom-[18%] bg-brand/20 dark:bg-brand/10
                     border-4 border-brand p-4 rounded-brutal shadow-brutal-light transform rotate-3"
        >
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-brand" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-black dark:text-white">
                ИИ-сводка
              </p>
              <p className="font-bold text-black dark:text-white">Найдено 4 плиточника</p>
            </div>
          </div>
        </div>

        {/* Центральный контент */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24 flex items-center justify-center">
          <div
            className="relative max-w-4xl w-full text-center space-y-6 md:space-y-8
                       bg-white/70 dark:bg-black/50 p-8 md:p-12 rounded-brutal border-4 border-black
                       backdrop-blur-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                       dark:shadow-[8px_8px_0px_0px_rgba(255,179,128,0.3)]"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full
                            text-xs font-black uppercase tracking-widest">
              <Zap className="h-4 w-4 text-brand fill-brand" />
              Платформа нового поколения
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black uppercase
                           leading-[0.95] tracking-tighter text-black dark:text-white">
              Стройка <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-orange-400">
                без кота
              </span>
              <br />
              в мешке
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-800 dark:text-gray-300 font-bold
                          max-w-2xl mx-auto leading-relaxed">
              Первый маркетплейс, где каждый отзыв привязан к реальному договору.{' '}
              <span className="bg-brand text-black px-2 py-0.5 rounded-brutal">ИИ-ассистент</span>{' '}
              соберёт бригаду под ваше ТЗ.
            </p>

            <div className="pt-4 md:pt-6 flex flex-col sm:flex-row items-stretch sm:items-center
                            justify-center gap-4 md:gap-6">
              <Link href="/onboarding" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg md:text-xl h-14 md:h-16 px-6 md:px-8 gap-3 group
                             border-4 shadow-brutal-light dark:shadow-brutal-dark"
                >
                  Создать профиль
                  <ArrowRight className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:translate-x-1.5" />
                </Button>
              </Link>
              <Link href="/how-it-works" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto text-lg md:text-xl h-14 md:h-16 px-6 md:px-8
                             border-4 border-black"
                >
                  Как это работает?
                </Button>
              </Link>
            </div>

            {/* Мини-метки доверия */}
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-2 text-xs md:text-sm
                           font-bold text-gray-700 dark:text-gray-400">
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Без комиссий для мастера
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Эскроу-защита
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Отмена в любой момент
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ФИЧИ */}
      <section
        aria-labelledby="features-title"
        className="w-full bg-surface-cardLight dark:bg-surface-cardDark border-y-4 border-black"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-black text-white rounded-full
                            text-[11px] font-black uppercase tracking-widest mb-4">
              <Sparkles className="h-3.5 w-3.5 text-brand" /> Почему СТРОИК
            </div>
            <h2
              id="features-title"
              className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-[1.05]"
            >
              4 причины доверять <span className="text-brand">нам</span>
            </h2>
            <p className="mt-4 text-base md:text-lg font-medium text-gray-600 dark:text-gray-400">
              Мы спроектировали платформу так, чтобы риски были на нашей стороне, а результат — у вас.
            </p>
          </div>

          <div className="grid gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <article
                key={title}
                className="group bg-white dark:bg-gray-900 border-4 border-black rounded-brutal p-6
                           shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                           dark:shadow-[6px_6px_0px_0px_rgba(255,179,128,0.25)]
                           hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]
                           dark:hover:shadow-[10px_10px_0px_0px_rgba(255,179,128,0.4)]
                           transition-all duration-200"
              >
                <div className="w-14 h-14 rounded-brutal bg-brand/15 dark:bg-brand/10 border-2 border-black
                                flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="h-7 w-7 text-brand" />
                </div>
                <h3 className="text-lg md:text-xl font-black uppercase mb-2 leading-tight">{title}</h3>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                  {desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* СТАТИСТИКА */}
      <section className="w-full bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16 grid gap-8 md:grid-cols-3">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="text-center md:text-left border-l-4 border-brand pl-4 md:pl-6"
            >
              <p className="text-4xl md:text-6xl font-black tracking-tighter text-brand leading-none">
                {value}
              </p>
              <p className="mt-2 text-xs md:text-sm font-bold uppercase tracking-widest text-gray-300">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ФИНАЛЬНЫЙ CTA */}
      <section className="w-full bg-surface-light dark:bg-surface-dark">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-24 text-center">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-[1.05] mb-4">
            Готовы начать?
          </h2>
          <p className="text-base md:text-lg font-medium text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
            Регистрация займёт меньше минуты. Просто расскажите нашему ИИ-ассистенту, что вам нужно.
          </p>
          <Link href="/onboarding">
            <Button
              size="lg"
              className="text-lg md:text-xl h-14 md:h-16 px-8 md:px-10 gap-3
                         border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
            >
              Начать с ИИ-ассистентом <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
