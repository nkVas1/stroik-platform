import { HardHat, Briefcase, Search, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark">
      <header className="p-4 border-b-2 border-black dark:border-gray-800 bg-surface-cardLight dark:bg-surface-cardDark flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="inline-flex items-center gap-2 font-black text-xl tracking-tighter">
          <HardHat className="h-6 w-6 text-brand" />
          <span>СТРОИК <span className="text-sm font-bold text-gray-500 uppercase">/ Кабинет</span></span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8 space-y-8">
        
        <section className="bg-brand text-black border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Добро пожаловать</h1>
            <p className="font-medium mt-1 text-black/80">Ваш профиль успешно настроен нашим ИИ-ассистентом.</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border-2 border-black shadow-skeuo-inner-light">
            <ShieldCheck className="h-5 w-5 text-green-700" />
            <span className="font-bold">Профиль верифицирован</span>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black dark:border-gray-700 rounded-brutal shadow-mix-light dark:shadow-mix-dark p-6">
            <div className="flex items-center gap-3 mb-4">
              <Search className="h-6 w-6 text-brand" />
              <h2 className="text-xl font-bold">Подходящие предложения</h2>
            </div>
            <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-brutal text-center text-gray-500">
              Система анализирует ваш профиль и подбирает лучшие варианты на рынке...
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black dark:border-gray-700 rounded-brutal shadow-mix-light dark:shadow-mix-dark p-6">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                <h2 className="text-lg font-bold">Ваша статистика</h2>
              </div>
              <ul className="space-y-2 mt-4 text-sm font-medium">
                <li className="flex justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                  <span>Активные сделки:</span> <span>0</span>
                </li>
                <li className="flex justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
                  <span>Завершено:</span> <span>0</span>
                </li>
              </ul>
            </div>
            <Button className="w-full h-14 text-lg">Каталог заявок</Button>
          </div>

        </section>
      </main>
    </div>
  );
}
