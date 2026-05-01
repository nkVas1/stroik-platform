'use client';

import { Bot, ShieldCheck, HardHat, ArrowRight, Wallet, MessageSquare, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';

/**
 * /how-it-works — объяснение работы платформы в 3 шага + FAQ-блок.
 *
 * Принципы:
 * - Визуальная нумерация через псевдоэлементы больших цифр в углу;
 * - Секции чётко разделены фоном (bg-surface-light → cardLight → brand);
 * - FAQ-блок с естественным <details>/<summary> — a11y-бесплатно + без JS.
 */
export default function HowItWorksPage() {
  const steps = [
    {
      icon: Bot,
      color: 'text-brand',
      title: 'ИИ-онбординг',
      desc: 'Вы просто общаетесь в чате. Наш ИИ-ассистент сам понимает, кто вы: заказчик или мастер. Он автоматически собирает ТЗ или портфолио, избавляя от скучных анкет.',
    },
    {
      icon: ShieldCheck,
      color: 'text-green-500',
      title: 'Верификация',
      desc: 'Никаких анонимов: три уровня доверия — телефон, СМС-код, документы. Это отсеивает мошенников и недобросовестных подрядчиков ещё на этапе поиска.',
    },
    {
      icon: HardHat,
      color: 'text-orange-500',
      title: 'Сделка',
      desc: 'Заказы попадают в live-ленту. Специалисты откликаются, заказчик выбирает лучшего. Оплата замораживается через смарт-эскроу до успешной сдачи объекта.',
    },
  ];

  const perks = [
    {
      icon: MessageSquare,
      title: 'Без анкет',
      desc: 'Всё в живом диалоге с ИИ — как с хорошим менеджером.',
    },
    {
      icon: Wallet,
      title: 'Без комиссии для мастеров',
      desc: 'Платите только PRO-подписку, если нужен ИИ-подбор заказов.',
    },
    {
      icon: Star,
      title: 'Честные отзывы',
      desc: 'Каждый отзыв привязан к реальной сделке — накрутить невозможно.',
    },
  ];

  const faq = [
    {
      q: 'Сколько стоит подписка?',
      a: 'Базовые функции (создание профиля, просмотр ленты) бесплатны. PRO-подписка с ИИ-ассистентом — 159 ₽ в месяц или 1 599 ₽ в год (выгода 20%).',
    },
    {
      q: 'Как работает эскроу?',
      a: 'После того как заказчик выбрал мастера, сумма сделки замораживается на платформе. Она перечисляется исполнителю только после подтверждения работы заказчиком. Это защищает обе стороны.',
    },
    {
      q: 'Что с отменой?',
      a: 'Вы можете отменить сделку в любой момент до начала работ и вернуть средства. После старта — через урегулирование спора с участием платформы.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark">
      <SiteHeader showBackHome />

      {/* HERO */}
      <section className="w-full bg-blueprint border-b-4 border-black">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-16 md:py-24 text-center space-y-4">
          <div
            className="inline-block bg-black text-white px-4 py-1.5 rounded-full text-[11px] font-black
                       uppercase tracking-widest border-2 border-brand shadow-brutal-light
                       dark:shadow-brutal-dark"
          >
            Руководство
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-black dark:text-white leading-[1.05]">
            Как мы меняем{' '}
            <span className="text-brand underline decoration-black dark:decoration-white decoration-4 underline-offset-[0.4em]">
              правила игры
            </span>
          </h1>
          <p className="text-base md:text-xl font-bold text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            СТРОИК — не доска объявлений. Это замкнутая экосистема, где технологии защищают ваши деньги и нервы.
          </p>
        </div>
      </section>

      {/* 3 ШАГА */}
      <section className="w-full bg-surface-cardLight dark:bg-surface-cardDark border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {steps.map(({ icon: Icon, color, title, desc }, idx) => (
              <article
                key={title}
                className="group relative bg-white dark:bg-gray-900 border-4 border-black rounded-brutal
                           p-7 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                           dark:shadow-[8px_8px_0px_0px_rgba(255,179,128,0.25)]
                           hover:-translate-y-1.5 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
                           dark:hover:shadow-[12px_12px_0px_0px_rgba(255,179,128,0.4)]
                           transition-all duration-200 flex flex-col items-center text-center overflow-hidden"
              >
                {/* Декоративный большой номер */}
                <span
                  aria-hidden="true"
                  className="absolute -right-4 -top-6 text-[9rem] leading-none font-black
                             text-gray-100 dark:text-white/5 pointer-events-none select-none
                             group-hover:scale-110 transition-transform duration-300 origin-top-right"
                >
                  {idx + 1}
                </span>

                <div
                  className="w-20 h-20 bg-surface-light dark:bg-surface-dark border-4 border-black
                             rounded-full flex items-center justify-center mb-6 relative z-10
                             shadow-skeuo-inner-light dark:shadow-skeuo-inner-dark"
                >
                  <Icon className={`h-10 w-10 ${color}`} />
                </div>
                <h3 className="relative z-10 text-xl md:text-2xl font-black uppercase mb-3 leading-tight">
                  {idx + 1}. {title}
                </h3>
                <p className="relative z-10 font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                  {desc}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PERKS */}
      <section className="w-full bg-surface-light dark:bg-surface-dark border-b-4 border-black">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-16 md:py-20">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-center mb-10 md:mb-14">
            Что делает нас <span className="text-brand">особенными</span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 md:gap-8">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center gap-3 p-6 rounded-brutal
                           border-2 border-dashed border-black/20 dark:border-white/20"
              >
                <div className="w-12 h-12 rounded-full bg-brand/20 border-2 border-brand flex items-center justify-center">
                  <Icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-base md:text-lg font-black uppercase">{title}</h3>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full bg-surface-cardLight dark:bg-surface-cardDark border-b-4 border-black">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-16 md:py-20">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-center mb-10">
            Частые вопросы
          </h2>
          <div className="space-y-4">
            {faq.map(({ q, a }) => (
              <details
                key={q}
                className="group bg-white dark:bg-gray-900 border-2 border-black rounded-brutal
                           shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                           dark:shadow-[4px_4px_0px_0px_rgba(255,179,128,0.25)]
                           [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="cursor-pointer list-none p-5 font-black uppercase text-sm md:text-base
                                    flex items-center justify-between gap-3">
                  <span className="flex-1">{q}</span>
                  <span
                    aria-hidden="true"
                    className="w-7 h-7 flex items-center justify-center rounded-brutal border-2 border-black
                               bg-brand text-black font-black transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 -mt-1 text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-brand border-b-4 border-black">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-24 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-black uppercase leading-[1.05] mb-4">
            Готовы попробовать?
          </h2>
          <p className="text-base md:text-lg font-bold text-black/80 max-w-xl mx-auto mb-8">
            Регистрация займёт меньше минуты. Просто напишите нашему ИИ-диспетчеру, что вам нужно.
          </p>
          <Link href="/onboarding">
            <Button
              size="lg"
              className="text-lg md:text-xl h-14 md:h-16 px-8 md:px-10 gap-3 border-4 border-black
                         bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                         hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              Начать работу в чате <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
