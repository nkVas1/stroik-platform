import { HardHat } from 'lucide-react';
import Link from 'next/link';
import ChatWindow from '@/components/chat/ChatWindow';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark">
      {/* Минималистичный хедер */}
      <header className="p-4 border-b-2 border-black dark:border-gray-800 bg-surface-cardLight dark:bg-surface-cardDark">
        <Link href="/" className="inline-flex items-center gap-2 font-black text-xl tracking-tighter hover:opacity-80 transition-opacity">
          <HardHat className="h-6 w-6 text-brand" />
          <span>СТРОИК</span>
        </Link>
      </header>

      {/* Контейнер для чата */}
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-6 flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-black uppercase tracking-tight">Настройка профиля</h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium mt-1">
            Ответьте на несколько вопросов ассистента, чтобы мы подобрали для вас лучшие заказы или бригаду.
          </p>
        </div>

        {/* Интерактивный компонент чата */}
        <div className="flex-1 bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black dark:border-gray-700 rounded-brutal shadow-mix-light dark:shadow-mix-dark overflow-hidden flex flex-col">
          <ChatWindow />
        </div>
      </main>
    </div>
  );
}
