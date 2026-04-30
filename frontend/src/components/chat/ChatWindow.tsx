'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, User, Bot, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Message = { role: 'user' | 'assistant' | 'system'; content: string; };

export default function ChatWindow() {
  const router = useRouter();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFinished, setIsFinished] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(true);
  
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const hasInitialized = React.useRef(false); // ЗАЩИТА ОТ ДВОЙНОГО РЕНДЕРА REACT

  React.useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initChat = async () => {
      const token = localStorage.getItem('stroik_token');
      if (token) setIsAuthenticated(true);

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch('http://127.0.0.1:8000/api/chat', {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages:[{role: 'user', content: 'Привет! С чего начнем?'}] }),
        });

        if (response.ok) {
          const data = await response.json();
          setMessages([{ role: 'assistant', content: data.response }]);
        } else {
           throw new Error("Network error");
        }
      } catch (e) {
        setMessages([{ role: 'assistant', content: 'Привет! Я ИИ-ассистент платформы СТРОИК. Вы ищете работу или хотите нанять специалистов?' }]);
      } finally {
        setIsInitializing(false);
      }
    };

    initChat();
  },[]);

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
      
      setMessages(prev =>[...prev, { role: 'assistant', content: data.response }]);

      if (data.is_complete) {
        if (data.access_token) localStorage.setItem('stroik_token', data.access_token);
        setIsFinished(true);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch (error) {
      setMessages(prev =>[...prev, { role: 'system', content: 'Ошибка соединения с сервером.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-brand h-10 w-10" /></div>;

  return (
    <div className="flex flex-col h-full h-[70vh] min-h-[500px] p-1">
      {/* 🔴 ИНТЕГРАЦИЯ ЭФФЕКТА СВЕЧЕНИЯ ЗДЕСЬ */}
      <div className={cn("ai-thinking-glow flex flex-col h-full bg-surface-light dark:bg-surface-dark border-4 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark", isLoading && "is-thinking")}>
        
        <div className="bg-black text-white p-4 flex justify-between items-center z-10 rounded-t-sm">
           <div className="flex items-center gap-3 font-black text-base uppercase tracking-wider">
             <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center border-2 border-white"><Bot size={20} className="text-black"/></div>
             Ассистент
           </div>
           {isAuthenticated && (
             <Button type="button" onClick={() => router.push('/dashboard')} className="bg-white text-black hover:bg-gray-200 text-xs font-bold uppercase gap-2 h-9 border-2 border-transparent">
                <ArrowLeft size={16} /> В кабинет
             </Button>
           )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 z-10">
          {messages.map((msg, index) => (
            <div key={index} className={cn("flex gap-4 max-w-[90%] md:max-w-[75%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}>
              <div className={cn("w-10 h-10 rounded-brutal flex items-center justify-center border-2 border-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]", msg.role === 'user' ? "bg-brand text-black" : msg.role === 'assistant' ? "bg-white dark:bg-gray-800 text-black dark:text-white" : "bg-red-500 text-white")}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={cn("p-4 rounded-brutal border-2 border-black text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium shadow-brutal-light dark:shadow-brutal-dark", msg.role === 'user' ? "bg-brand text-black" : msg.role === 'assistant' ? "bg-white dark:bg-gray-800 text-black dark:text-white" : "bg-red-100 text-red-900")}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t-4 border-black bg-white dark:bg-gray-900 rounded-b-sm z-10">
          <form onSubmit={sendMessage} className="flex gap-3 relative max-w-4xl mx-auto w-full">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={isFinished ? "Загрузка..." : "Сообщение ассистенту..."} disabled={isLoading || isFinished} className="h-14 text-base md:text-lg border-2 border-black shadow-skeuo-inner-light" />
            <Button type="submit" size="lg" disabled={isLoading || !input.trim() || isFinished} className="h-14 px-6 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:translate-x-0.5 hover:shadow-none transition-all">
              <Send size={24} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
