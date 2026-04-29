'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, User, Bot, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export default function ChatWindow() {
  const router = useRouter();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFinished, setIsFinished] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(true);
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // 1. Инициализация чата и лечение "амнезии"
  React.useEffect(() => {
    const initContext = async () => {
      const token = localStorage.getItem('stroik_token');
      if (!token) {
        // Сценарий нового пользователя
        setMessages([{
          role: 'assistant',
          content: 'Привет! Я ИИ-ассистент платформы СТРОИК. Давайте настроим ваш профиль. Вы ищете работу или хотите нанять специалистов?'
        }]);
        setIsInitializing(false);
        return;
      }

      // Сценарий авторизованного пользователя
      setIsAuthenticated(true);
      try {
        const res = await fetch('http://127.0.0.1:8000/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const profile = await res.json();
          let greeting = '';
          const name = profile.fio ? profile.fio.split(' ')[0] : (profile.role === 'worker' ? 'Мастер' : 'Заказчик');

          if (profile.verification_level < 1) {
            greeting = `С возвращением, ${name}! Чтобы ваш профиль стал виден на бирже, нам нужно пройти верификацию. Напишите мне ваши ФИО и город.`;
          } else if (profile.role === 'employer') {
            greeting = `Приветствую, ${name}! Готов составить новое ТЗ. Опишите ваш объект, какие работы нужно выполнить и примерный бюджет.`;
          } else {
            greeting = `С возвращением, ${name}! Хотите добавить новые навыки в портфолио или обновить статус? Я на связи.`;
          }

          setMessages([{ role: 'assistant', content: greeting }]);
        } else {
          throw new Error('Invalid token');
        }
      } catch (e) {
        localStorage.removeItem('stroik_token');
        setMessages([{ role: 'assistant', content: 'Сессия истекла. Давайте начнем заново. Вы ищете работу или специалистов?' }]);
      } finally {
        setIsInitializing(false);
      }
    };

    initContext();
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

      const response = await fetch('http://127.0.0.1:8000/api/chat', {
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

  const handleExit = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push('/dashboard');
  };

  if (isInitializing) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-brand h-8 w-8" /></div>;
  }

  return (
    <div className="flex flex-col h-[60vh] min-h-[400px]">
      <div className="bg-brand text-black p-3 border-b-2 border-black flex justify-between items-center z-10 shadow-brutal-light dark:shadow-brutal-dark relative">
         <div className="flex items-center gap-2 font-bold text-sm uppercase">
           <Bot size={18} /> Ассистент СТРОИК
         </div>
         {isAuthenticated && (
           <Button type="button" variant="outline" size="sm" onClick={handleExit} className="bg-white hover:bg-gray-100 text-xs gap-1 px-2 h-8 border-2 border-black">
              <ArrowLeft size={14} /> В кабинет
           </Button>
         )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-light/50 dark:bg-surface-dark/50">
        {messages.map((msg, index) => (
          <div key={index} className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}>
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border-2 border-black shrink-0 shadow-brutal-light dark:shadow-brutal-dark", msg.role === 'user' ? "bg-brand text-black" : msg.role === 'assistant' ? "bg-surface-cardDark dark:bg-surface-cardLight text-white dark:text-black" : "bg-red-500 text-white")}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn("p-3 rounded-brutal border-2 border-black text-sm md:text-base leading-relaxed whitespace-pre-wrap shadow-mix-light dark:shadow-mix-dark", msg.role === 'user' ? "bg-brand text-black rounded-tr-none" : msg.role === 'assistant' ? "bg-surface-cardLight dark:bg-surface-cardDark rounded-tl-none text-gray-900 dark:text-gray-100" : "bg-red-100 text-red-900 rounded-tl-none")}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
             <div className="w-8 h-8 rounded-full bg-surface-cardDark dark:bg-surface-cardLight flex items-center justify-center border-2 border-black shrink-0"><Bot size={16} className="text-white dark:text-black" /></div>
            <div className="p-3 rounded-brutal rounded-tl-none border-2 border-black bg-surface-cardLight dark:bg-surface-cardDark flex items-center gap-1 shadow-mix-light dark:shadow-mix-dark">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t-2 border-black dark:border-gray-700 bg-surface-cardLight dark:bg-surface-cardDark">
        <form onSubmit={sendMessage} className="flex gap-2 relative">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={isFinished ? "Профиль обновлен, перенаправление..." : "Напишите ответ..."} disabled={isLoading || isFinished} className="pr-12 bg-white dark:bg-[#1A1A1A]" />
          <Button type="submit" size="sm" disabled={isLoading || !input.trim() || isFinished} className="absolute right-1 top-1 bottom-1 px-3"><Send size={18} /></Button>
        </form>
      </div>
    </div>
  );
}
