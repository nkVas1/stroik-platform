'use client';

import Link from 'next/link';
import { HardHat, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface SiteHeaderProps {
  showAuthCta?: boolean;
  showBackHome?: boolean;
}

export function SiteHeader({ showAuthCta = false, showBackHome = false }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full h-16 px-4 md:px-8 flex items-center justify-between border-b-4 border-black bg-white/90 dark:bg-[#121212]/90 backdrop-blur-md">
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-black text-xl md:text-2xl tracking-tighter hover:opacity-80 transition-opacity"
      >
        <HardHat className="h-7 w-7 md:h-8 md:w-8 text-brand" />
        <span className="uppercase text-black dark:text-white">СТРОИК</span>
      </Link>

      <div className="flex items-center gap-2 md:gap-4">
        <ThemeToggle />
        {showBackHome && (
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex gap-2 border-2 border-black dark:border-gray-700 font-bold"
            >
              <ArrowLeft size={16} /> На главную
            </Button>
          </Link>
        )}
        {showAuthCta && (
          <>
            <Link
              href="/login"
              className="hidden md:inline-flex text-sm font-bold uppercase tracking-wider hover:text-brand transition-colors"
            >
              Войти
            </Link>
            <Link href="/onboarding">
              <Button
                size="sm"
                className="hidden sm:inline-flex font-bold uppercase tracking-wider border-2 border-black shadow-brutal-light"
              >
                Регистрация
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
