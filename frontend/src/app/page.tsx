import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ArrowRight, HardHat } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Навигация */}
      <header className="w-full p-4 flex justify-between items-center border-b-2 border-black dark:border-gray-800 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
          <HardHat className="h-8 w-8 text-brand" />
          <span>СТРОИК</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Главный экран (Hero Section) */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-5xl md:text-7xl font-black uppercase leading-tight tracking-tight drop-shadow-sm">
            Стройка без <br />
            <span className="text-brand inline-block transform -rotate-2">кота в мешке</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 font-medium max-w-2xl mx-auto">
            Платформа, где каждый отзыв привязан к договору, а ИИ собирает бригаду под твоё ТЗ. 
            Забудь про фейковые портфолио.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Ссылка на будущую страницу чата-онбординга */}
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg gap-2 group">
                Начать работу
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto text-lg">
              Узнать больше
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
