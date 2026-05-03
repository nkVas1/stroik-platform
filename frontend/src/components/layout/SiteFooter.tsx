import Link from 'next/link';
import { HardHat, Mail, Github } from 'lucide-react';

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full border-t-4 border-black dark:border-gray-800 bg-surface-cardLight dark:bg-surface-cardDark">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 grid gap-8 md:grid-cols-3">
        <div className="space-y-3">
          <Link href="/" className="inline-flex items-center gap-2 font-black text-xl tracking-tighter">
            <HardHat className="h-6 w-6 text-brand" />
            <span className="uppercase">СТРОИК</span>
          </Link>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 max-w-xs">
            Маркетплейс строительных услуг с ИИ-ассистентом, верификацией и смарт-эскроу.
          </p>
        </div>

        <nav aria-label="Навигация" className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Платформа</p>
          <ul className="space-y-2 text-sm font-bold">
            <li><Link href="/pricing" className="hover:text-brand transition-colors">Тарифы</Link></li>
            <li><Link href="/how-it-works" className="hover:text-brand transition-colors">Как это работает</Link></li>
            <li><Link href="/onboarding" className="hover:text-brand transition-colors">Регистрация через ИИ</Link></li>
            <li><Link href="/login" className="hover:text-brand transition-colors">Войти в кабинет</Link></li>
          </ul>
        </nav>

        <div className="space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Связь</p>
          <ul className="space-y-2 text-sm font-bold">
            <li>
              <a
                href="mailto:hello@stroik.app"
                className="inline-flex items-center gap-2 hover:text-brand transition-colors"
              >
                <Mail size={14} /> hello@stroik.app
              </a>
            </li>
            <li>
              <a
                href="https://github.com/nkVas1/stroik-platform"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-brand transition-colors"
              >
                <Github size={14} /> Исходный код
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t-2 border-black/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
          <span>© {year} СТРОИК. Все права защищены.</span>
          <span className="uppercase tracking-widest">Сделано в России</span>
        </div>
      </div>
    </footer>
  );
}
