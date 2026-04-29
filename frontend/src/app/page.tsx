'use client';

import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ArrowRight, HardHat, ShieldCheck, Zap, Users } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-surface-light dark:bg-surface-dark bg-blueprint">
      
      {/* Навигация */}
      <header className="w-full p-4 md:px-8 flex justify-between items-center border-b-4 border-black bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
          <HardHat className="h-8 w-8 text-brand" />
          <span className="uppercase text-black dark:text-white">СТРОИК</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/onboarding">
            <Button size="sm" className="hidden md:flex font-bold uppercase tracking-wider">
              Войти
            </Button>
          </Link>
        </div>
      </header>

      {/* Бегущая строительная лента */}
      <div className="w-full bg-brand border-b-4 border-black overflow-hidden flex items-center py-2 relative shadow-brutal-light dark:shadow-brutal-dark z-40 transform -rotate-1 origin-left scale-105 mt-4">
        <div className="animate-marquee flex gap-8 whitespace-nowrap text-black font-black uppercase text-sm tracking-widest">
          <span>Безопасная сделка</span><span>•</span>
          <span>ИИ-Подбор</span><span>•</span>
          <span>Верифицированные бригады</span><span>•</span>
          <span>Смарт-эскроу</span><span>•</span>
          <span>Строительство под ключ</span><span>•</span>
          <span>Безопасная сделка</span><span>•</span>
          <span>ИИ-Подбор</span><span>•</span>
          <span>Верифицированные бригады</span><span>•</span>
        </div>
      </div>

      {/* Главный экран (Hero) */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center relative z-10 mt-10">
        
        {/* Плавающие скевоморфные виджеты (Десктоп) */}
        <div className="hidden lg:flex absolute left-[10%] top-[20%] bg-white dark:bg-gray-800 border-4 border-black p-4 rounded-brutal shadow-skeuo-inner-light dark:shadow-skeuo-inner-dark transform -rotate-6 animate-pulse" style={{ animationDuration: '4s' }}>
          <div className="flex items-center gap-3">
             <ShieldCheck className="h-8 w-8 text-green-500" />
             <div className="text-left">
               <p className="text-xs font-black text-gray-500 uppercase">Статус</p>
               <p className="font-bold">Договор подписан</p>
             </div>
          </div>
        </div>

        <div className="hidden lg:flex absolute right-[10%] bottom-[30%] bg-brand/20 dark:bg-brand/10 border-4 border-brand p-4 rounded-brutal shadow-brutal-light transform rotate-3">
          <div className="flex items-center gap-3">
             <Users className="h-8 w-8 text-brand" />
             <div className="text-left">
               <p className="text-xs font-black uppercase text-black dark:text-white">ИИ-Сводка</p>
               <p className="font-bold text-black dark:text-white">Найдено 4 плиточника</p>
             </div>
          </div>
        </div>

        {/* Центральный контент */}
        <div className="max-w-4xl space-y-8 bg-white/50 dark:bg-black/50 p-8 md:p-12 rounded-brutal border-4 border-black backdrop-blur-sm shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,179,128,0.3)]">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest mb-4">
            <Zap className="h-4 w-4 text-brand fill-brand" /> Платформа нового поколения
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tighter text-black dark:text-white">
            Стройка <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-orange-400 drop-shadow-sm">Без кота</span> <br/>
            в мешке
          </h1>
          
          <p className="text-lg md:text-xl text-gray-800 dark:text-gray-300 font-bold max-w-2xl mx-auto leading-relaxed">
            Первый маркетплейс, где каждый отзыв привязан к реальному договору. 
            А наш <span className="bg-brand text-black px-2 py-0.5 rounded-brutal">ИИ-ассистент</span> сам соберет бригаду под ваше ТЗ.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-xl h-16 px-8 gap-3 group border-4 shadow-brutal-light dark:shadow-brutal-dark">
                Создать профиль
                <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
              </Button>
            </Link>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto text-xl h-16 px-8 border-4 border-black">
              Как это работает?
            </Button>
          </div>
        </div>
      </main>

    </div>
  );
}
