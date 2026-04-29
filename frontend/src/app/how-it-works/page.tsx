'use client';

import { HardHat, Bot, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function HowItWorksPage() {
  const steps = [
    {
      icon: <Bot className="h-10 w-10 text-brand" />,
      title: '1. ИИ-Онбординг',
      desc: 'Вы просто общаетесь в чате. Наш ИИ (Google Gemini) сам понимает, кто вы: заказчик или мастер. Он автоматически собирает ТЗ или ваше портфолио, избавляя от скучных анкет.'
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-green-500" />,
      title: '2. Верификация',
      desc: 'Никаких анонимов. Платформа требует подтверждения личности. Это отсеивает мошенников и недобросовестных подрядчиков еще на этапе поиска.'
    },
    {
      icon: <HardHat className="h-10 w-10 text-orange-500" />,
      title: '3. Мэтчинг и Сделка',
      desc: 'Заказы попадают в Live-ленту. Специалисты откликаются, заказчик выбирает лучшего. Оплата замораживается через Смарт-Эскроу до успешной сдачи объекта.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark bg-blueprint font-sans">
      <header className="w-full p-4 md:px-8 flex justify-between items-center border-b-4 border-black bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 font-black text-2xl tracking-tighter hover:opacity-80 transition-opacity">
          <HardHat className="h-8 w-8 text-brand" />
          <span className="uppercase text-black dark:text-white">СТРОИК</span>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/">
            <Button variant="outline" size="sm" className="hidden md:flex gap-2 border-2 border-black font-bold">
              <ArrowLeft size={16} /> На главную
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-12 space-y-12">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-block bg-black text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border-2 border-brand shadow-brutal-light dark:shadow-brutal-dark">
            Руководство
          </div>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-black dark:text-white">
            Как мы меняем <br/><span className="text-brand underline decoration-black dark:decoration-white decoration-4 underline-offset-8">правила игры</span>
          </h1>
          <p className="text-lg md:text-xl font-bold opacity-70 max-w-2xl mx-auto">
            СТРОИК — это не доска объявлений. Это замкнутая экосистема, где технологии защищают ваши деньги и нервы.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 border-4 border-black p-8 rounded-brutal shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,179,128,0.3)] hover:-translate-y-2 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 text-9xl font-black text-gray-100 dark:text-gray-900 opacity-50 pointer-events-none group-hover:scale-110 transition-transform">
                {idx + 1}
              </div>
              <div className="w-20 h-20 bg-surface-light dark:bg-surface-dark border-4 border-black rounded-full flex items-center justify-center mb-6 relative z-10 shadow-skeuo-inner-light dark:shadow-skeuo-inner-dark">
                {step.icon}
              </div>
              <h3 className="text-2xl font-black uppercase mb-4 relative z-10">{step.title}</h3>
              <p className="font-bold opacity-80 relative z-10">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-brand border-4 border-black p-8 md:p-12 rounded-brutal shadow-brutal-light dark:shadow-brutal-dark text-center">
          <h2 className="text-3xl font-black text-black uppercase mb-4">Готовы попробовать?</h2>
          <p className="text-black font-bold mb-8 max-w-xl mx-auto">
            Регистрация займет меньше минуты. Просто напишите нашему ИИ-диспетчеру, что вам нужно.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="text-xl h-16 px-10 gap-3 border-4 border-black bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
              Начать работу в чате <ArrowRight size={24} />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
