import { HardHat, Sparkles } from 'lucide-react';
import Link from 'next/link';
import ChatWindow from '@/components/chat/ChatWindow';

export default function OnboardingPage() {
  return (
    // 🔴 КРИТИЧЕСКИ ВАЖНО: h-[100dvh] (dynamic viewport) + overflow-hidden на корне.
    // - 100dvh корректно учитывает мобильные адресные бары (iOS Safari / Chrome Android);
    // - overflow-hidden гарантирует: страница НЕ скроллится, скроллится ТОЛЬКО область сообщений
    //   внутри ChatWindow. Это было причиной бага "первое сообщение где-то вверху" —
    //   scrollIntoView внутри чата пробрасывал скролл на body.
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-surface-light dark:bg-surface-dark">

      {/* ХЕДЕР — flex-shrink-0, чтобы его не сжимало при маленькой высоте экрана */}
      <header className="flex-shrink-0 px-4 md:px-8 h-16 flex items-center justify-between border-b-2 border-black dark:border-gray-800 bg-surface-cardLight dark:bg-surface-cardDark">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-black text-xl tracking-tighter hover:opacity-80 transition-opacity"
        >
          <HardHat className="h-6 w-6 text-brand" />
          <span>СТРОИК</span>
        </Link>

        {/* Тонкая подсказка пользователю */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
          <Sparkles className="h-4 w-4 text-brand" />
          <span>ИИ-онбординг</span>
        </div>
      </header>

      {/* КОНТЕЙНЕР: flex-1 min-h-0 — занимает всё оставшееся, чтобы дочерний чат имел точную высоту */}
      <main className="flex-1 min-h-0 w-full max-w-3xl mx-auto p-4 md:p-6 flex flex-col">
        {/* Заголовок — flex-shrink-0, чтобы не сжимался */}
        <div className="flex-shrink-0 mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-[1.1]">
            Настройка профиля
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium mt-1.5">
            Ответьте на несколько вопросов ассистента — мы подберём для вас лучшие заказы или бригаду.
          </p>
        </div>

        {/* ЧАТ-КАРТОЧКА: flex-1 min-h-0 + overflow-hidden — точная высота + обрезка свечения по скруглению */}
        <div className="flex-1 min-h-0 relative bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black dark:border-gray-700 rounded-brutal shadow-mix-light dark:shadow-mix-dark overflow-hidden flex flex-col">
          <ChatWindow />
        </div>
      </main>
    </div>
  );
}
