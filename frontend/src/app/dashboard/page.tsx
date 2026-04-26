import { HardHat } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import DashboardClient from './DashboardClient';

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

      <DashboardClient />
    </div>
  );
}
