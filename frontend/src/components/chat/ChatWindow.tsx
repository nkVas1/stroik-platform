'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, User, Bot, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export default function ChatWindow() {
  const router = useRouter();
  
  // НОВОЕ: Проверяем, есть ли токен (зарегистрирован ли уже пользователь)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'assistant',
      content: 'Привет! Я ИИ-ассистент платформы СТРОИК. Давайте настроим ваш профиль. Подскажите, вы ищете работу или хотите нанять специалистов?'
    }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFinished, setIsFinished] = React.useState(false);

  // Проверяем токен при загрузке компонента
  React.useEffect(() => {
    const token = localStorage.getItem('stroik_token');
    if (token) setIsAuthenticated(true);
  }, []);
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  React.useEffect(scrollToBottom, [messages]);

  // ИСПРАВЛЕНО: Добавлен e.preventDefault() чтобы не перезагружать страницу
  const handleExit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm("Вы уверены, что хотите прервать диалог? Ваши переданные данные сохранены.")) {
      router.push('/dashboard');
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isFinished) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error('Ошибка сети');

      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response }
      ]);

      // 💾 Сохраняем JWT токен в localStorage для дальнейших запросов
      if (data.access_token) {
        localStorage.setItem('stroik_token', data.access_token);
      }

      // 🚀 Если онбординг завершен, перенаправляем в Dashboard
      if (data.is_complete) {
        setIsFinished(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: 'system', content: 'Ошибка соединения с сервером. Убедитесь, что backend запущен.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full h-[60vh] min-h-[400px]">
      {/* Шапка чата */}
      <div className="bg-brand text-black p-3 border-b-2 border-black flex justify-between items-center z-10 shadow-brutal-light dark:shadow-brutal-dark">
        <div className="flex items-center gap-2 font-bold text-sm uppercase">
          <Bot size={18} /> Ассистент СТРОИК
        </div>
        {/* НОВОЕ: Кнопка показывается ТОЛЬКО если пользователь авторизован */}
        {isAuthenticated && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleExit} 
            className="bg-white hover:bg-gray-100 text-xs gap-1 px-2 h-8 border-2 border-black"
          >
            <ArrowLeft size={14} /> В кабинет
          </Button>
        )}
      </div>

      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-light/50 dark:bg-surface-dark/50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {/* Аватарки */}
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center border-2 border-black shrink-0 shadow-brutal-light dark:shadow-brutal-dark",
              msg.role === 'user' ? "bg-brand text-black" : 
              msg.role === 'assistant' ? "bg-surface-cardDark dark:bg-surface-cardLight text-white dark:text-black" : 
              "bg-red-500 text-white"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Баббл сообщения */}
            <div className={cn(
              "p-3 rounded-brutal border-2 border-black text-sm md:text-base leading-relaxed whitespace-pre-wrap shadow-mix-light dark:shadow-mix-dark",
              msg.role === 'user' 
                ? "bg-brand text-black rounded-tr-none" 
                : msg.role === 'assistant'
                  ? "bg-surface-cardLight dark:bg-surface-cardDark rounded-tl-none text-gray-900 dark:text-gray-100"
                  : "bg-red-100 text-red-900 rounded-tl-none"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {/* Индикатор загрузки (Typing indicator) */}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
             <div className="w-8 h-8 rounded-full bg-surface-cardDark dark:bg-surface-cardLight flex items-center justify-center border-2 border-black shrink-0">
              <Bot size={16} className="text-white dark:text-black" />
            </div>
            <div className="p-3 rounded-brutal rounded-tl-none border-2 border-black bg-surface-cardLight dark:bg-surface-cardDark flex items-center gap-1 shadow-mix-light dark:shadow-mix-dark">
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="p-3 border-t-2 border-black dark:border-gray-700 bg-surface-cardLight dark:bg-surface-cardDark">
        <form onSubmit={sendMessage} className="flex gap-2 relative">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isFinished ? "Профиль сохранен, перенаправление..." : "Напишите ответ..."}
            disabled={isLoading || isFinished}
            className="pr-12 bg-white dark:bg-[#1A1A1A]" 
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={isLoading || !input.trim() || isFinished}
            className="absolute right-1 top-1 bottom-1 px-3"
            aria-label="Отправить сообщение"
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
