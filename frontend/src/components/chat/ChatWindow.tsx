'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, User, Bot, ArrowLeft, Loader2, Lock, CreditCard, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

type Message = { role: 'user' | 'assistant' | 'system'; content: string; };

export default function ChatWindow() {
  const router = useRouter();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFinished, setIsFinished] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(true);

  const [showPaywall, setShowPaywall] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const hasInitialized = React.useRef(false);

  React.useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initChat = async () => {
      const token = localStorage.getItem('stroik_token');
      if (token) {
        setIsAuthenticated(true);
        setShowPaywall(true);
        setIsInitializing(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'Привет! С чего начнем?' }] }),
        });

        if (response.ok) {
          const data = await response.json();
          setMessages([{ role: 'assistant', content: data.response }]);
        } else throw new Error('Network error');
      } catch (e) {
        setMessages([{ role: 'assistant', content: 'Привет! Я ИИ-ассистент. Вы ищете работу или специалистов?' }]);
      } finally {
        setIsInitializing(false);
      }
    };

    initChat();
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  React.useEffect(scrollToBottom, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isFinished) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('stroik_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error('Ошибка сети');
      const data = await response.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

      if (data.is_complete) {
        if (data.access_token) localStorage.setItem('stroik_token', data.access_token);
        setIsFinished(true);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'system', content: 'Ошибка соединения с сервером.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔴 КРИТИЧЕСКИ ВАЖНО: пока чат инициализируется — показываем плейсхолдер С ТАКИМИ ЖЕ
  // размерами и фоном, как основной контейнер, иначе родитель «схлопывается» и пользователь
  // видит пустой тёмный прямоугольник вместо спиннера.
  if (isInitializing) {
    return (
      <div className="flex flex-col h-[70vh] min-h-[500px] items-center justify-center rounded-brutal border-4 border-black bg-surface-light dark:bg-surface-dark shadow-brutal-light dark:shadow-brutal-dark m-1.5 md:m-2">
        <Loader2 className="animate-spin text-brand h-10 w-10" />
        <p className="mt-4 font-bold uppercase tracking-wider text-sm opacity-70">Инициализация ассистента...</p>
      </div>
    );
  }

  return (
    // 🔴 КРИТИЧЕСКИ ВАЖНО: root-контейнер чата.
    // - h-[70vh] + min-h-[500px] — фиксированная предсказуемая высота (иначе flex-чейн может
    //   схлопнуться при min-h-screen родителе на некоторых браузерах);
    // - overflow-hidden — обязательно, т.к. СВЕЧЕНИЕ уходит на -50% inset и должно обрезаться;
    // - rounded-brutal — скруглённые углы рамки свечения.
    <div className="relative flex flex-col h-[70vh] min-h-[500px] overflow-hidden rounded-brutal p-1.5 md:p-2">

      {/* 🔴 СЛОЙ 0: ПЕЙВОЛ (z-100) — показывается при уже существующем профиле. */}
      {showPaywall && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-brutal">
          <div className="relative bg-surface-light dark:bg-surface-dark border-4 border-black rounded-brutal p-6 md:p-8 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in duration-200">

            {/* 🔴 DEV ONLY: ВРЕМЕННЫЙ КРЕСТИК ДЛЯ ЗАКРЫТИЯ ПЕЙВАЛА ПРИ РАЗРАБОТКЕ (УБРАТЬ НА ПРОДЕ!) */}
            <button
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-black rounded-brutal hover:bg-red-500 hover:text-white transition-colors bg-white text-black z-50"
              title="DEV ONLY: Закрыть пейвол"
            >
              <X size={16} strokeWidth={3} />
            </button>

            <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center border-4 border-black mx-auto mb-4 mt-2">
              <Lock size={32} className="text-black" />
            </div>
            <h2 className="text-2xl font-black uppercase mb-2">PRO-Ассистент</h2>
            <p className="font-bold opacity-80 mb-6 text-sm md:text-base">
              Ваш базовый профиль уже создан! Дальнейшая магия ИИ (сбор ТЗ, авто-верификация) доступна по подписке.
            </p>

            <div className="space-y-3 mb-6">
              <Button onClick={() => alert('Интеграция эквайринга в разработке')} className="w-full text-lg h-14 bg-brand text-black hover:bg-orange-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all gap-2">
                <CreditCard size={20} /> 159 руб / месяц
              </Button>
              <Button onClick={() => alert('Интеграция эквайринга в разработке')} variant="secondary" className="w-full text-base h-12 border-2 border-black">
                1599 руб / год (Выгода 20%)
              </Button>
            </div>

            <p className="text-xs font-bold text-gray-500 mb-4">Или заполните данные самостоятельно абсолютно бесплатно.</p>
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full border-2 border-black gap-2">
              <ArrowLeft size={16} /> Вернуться в Личный Кабинет
            </Button>
          </div>
        </div>
      )}

      {/* 🔴 СЛОЙ 1: СВЕЧЕНИЕ (z-0) — анимированный conic-gradient вокруг рамки чата.
           pointer-events-none — чтобы не перехватывал клики; inset-[-50%] — выходит за границы,
           обрезается overflow-hidden корневого контейнера. */}
      <div className={cn(
        'absolute inset-[-50%] z-0 pointer-events-none transition-opacity duration-500',
        isLoading ? 'opacity-100' : 'opacity-0'
      )}>
        <div className="w-full h-full animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_70%,#ffb380_80%,#ff7a00_100%)]" />
      </div>

      {/* 🔴 СЛОЙ 2: КОНТЕЙНЕР ЧАТА (z-10) — ОБЫЧНЫЙ flex-1 flow (БЫВШИЙ absolute inset-1 вызывал
           «невидимое» окно из-за двойного абсолютного позиционирования + перекрывающихся фонов).
           relative z-10 — всегда поверх свечения;
           flex-1 min-h-0 — занимает всё оставшееся место и позволяет messages-области скроллиться;
           border-4 + shadow — контрастная рамка поверх тёмного фона карточки. */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 rounded-brutal overflow-hidden border-4 border-black shadow-brutal-light dark:shadow-brutal-dark bg-surface-light dark:bg-surface-dark">

        {/* ХЕДЕР: fixed-height, flex-shrink-0 чтобы не сжимался */}
        <div className="flex-shrink-0 bg-black text-white p-4 flex justify-between items-center border-b-4 border-black">
          <div className="flex items-center gap-3 font-black text-base uppercase tracking-wider">
            <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center border-2 border-white">
              <Bot size={20} className="text-black" />
            </div>
            <span>Ассистент</span>
            {isAuthenticated && <span className="text-[10px] bg-brand text-black px-2 py-0.5 rounded-full ml-1">PRO</span>}
          </div>
          {isAuthenticated && (
            <Button type="button" onClick={() => router.push('/dashboard')} className="bg-white text-black hover:bg-gray-200 text-xs font-bold uppercase gap-2 h-9 border-2 border-transparent">
              <ArrowLeft size={16} /> В кабинет
            </Button>
          )}
        </div>

        {/* ОБЛАСТЬ СООБЩЕНИЙ: flex-1 min-h-0 — обязательный трюк для overflow-y-auto внутри flex-col */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6 bg-blueprint">
          {messages.map((msg, index) => (
            <div key={index} className={cn('flex gap-4 max-w-[90%] md:max-w-[75%]', msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
              <div className={cn(
                'w-10 h-10 rounded-brutal flex items-center justify-center border-2 border-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                msg.role === 'user' ? 'bg-brand text-black' : msg.role === 'assistant' ? 'bg-white dark:bg-gray-800 text-black dark:text-white' : 'bg-red-500 text-white'
              )}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={cn(
                'p-4 rounded-brutal border-2 border-black text-sm md:text-base leading-relaxed whitespace-pre-wrap font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-brutal-dark',
                msg.role === 'user' ? 'bg-brand text-black' : msg.role === 'assistant' ? 'bg-white dark:bg-gray-800 text-black dark:text-white' : 'bg-red-100 text-red-900'
              )}>
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 max-w-[85%] mr-auto">
              <div className="w-10 h-10 rounded-brutal bg-white dark:bg-gray-800 flex items-center justify-center border-2 border-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Bot size={20} className="text-black dark:text-white" />
              </div>
              <div className="p-4 rounded-brutal border-2 border-black bg-white dark:bg-gray-800 flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="w-2 h-2 bg-brand border border-black rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
                <span className="w-2 h-2 bg-brand border border-black rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
                <span className="w-2 h-2 bg-brand border border-black rounded-full animate-bounce" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ПОЛЕ ВВОДА: flex-shrink-0 — всегда видно внизу */}
        <div className="flex-shrink-0 p-4 border-t-4 border-black bg-white dark:bg-gray-900">
          <form onSubmit={sendMessage} className="flex gap-3 w-full">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isFinished ? 'Загрузка...' : 'Сообщение ассистенту...'}
              disabled={isLoading || isFinished || showPaywall}
              className="h-14 text-base border-2 border-black shadow-skeuo-inner-light"
            />
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !input.trim() || isFinished || showPaywall}
              className="h-14 px-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all"
            >
              <Send size={24} />
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
