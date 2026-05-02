'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Send, User, Bot, ArrowLeft, Loader2,
  Lock, CreditCard, Eye, EyeOff, Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { API_URL, apiPost, setStoredToken, getStoredToken, clearStoredToken } from '@/lib/api';

type Message = { role: 'user' | 'assistant' | 'system'; content: string };

// Three onboarding phases tracked client-side
type ChatPhase = 'role' | 'email' | 'profile' | 'done';

interface ChatApiResponse {
  response: string;
  is_complete: boolean;
  access_token?: string | null;
}

interface AttachEmailResponse {
  access_token: string;
  user_id: number;
  role: string;
}

// ── Inline Email Attachment Step ──────────────────────────────────
function EmailAttachStep({ onDone }: { onDone: (token: string) => void }) {
  const [email, setEmail]       = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm]   = React.useState('');
  const [showPwd, setShowPwd]   = React.useState(false);
  const [error, setError]       = React.useState('');
  const [loading, setLoading]   = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Пароли не совпадают'); return; }
    if (password.length < 6)  { setError('Пароль минимум 6 символов'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiPost<AttachEmailResponse>('/api/auth/attach-email', { email, password });
      setStoredToken(res.access_token);
      onDone(res.access_token);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Ошибка. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4 max-w-[92%] md:max-w-[80%] mr-auto">
      <div className="w-10 h-10 rounded-brutal bg-white dark:bg-gray-800 flex items-center justify-center border-2 border-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <Bot size={20} className="text-black dark:text-white" />
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex-1 p-4 rounded-brutal border-2 border-black bg-white dark:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3"
      >
        <div className="flex items-center gap-2 mb-1">
          <Mail size={16} className="text-brand" />
          <p className="font-black text-sm uppercase tracking-wide">Привязка аккаунта</p>
        </div>
        <Input
          type="email" value={email}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          placeholder="you@example.com" className="h-10 text-sm" autoFocus
        />
        <div className="relative">
          <Input
            type={showPwd ? 'text' : 'password'} value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Пароль (мин. 6 символов)" className="h-10 text-sm pr-10"
          />
          <button type="button" onClick={() => setShowPwd(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white">
            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <Input
          type="password" value={confirm}
          onChange={e => { setConfirm(e.target.value); setError(''); }}
          placeholder="Повторите пароль" className="h-10 text-sm"
        />
        {error && <p className="text-xs font-bold text-red-500">{error}</p>}
        <Button
          type="submit" disabled={loading || !email || !password || !confirm}
          className="w-full h-10 border-2 border-black text-sm font-black uppercase"
        >
          {loading ? 'Сохраняю...' : 'Привязать аккаунт'}
        </Button>
      </form>
    </div>
  );
}


// ── Main ChatWindow ────────────────────────────────────────────────
export default function ChatWindow() {
  const router = useRouter();

  const [messages,        setMessages]        = React.useState<Message[]>([]);
  const [input,           setInput]           = React.useState('');
  const [isLoading,       setIsLoading]       = React.useState(false);
  const [isFinished,      setIsFinished]      = React.useState(false);
  const [isInitializing,  setIsInitializing]  = React.useState(true);
  const [phase,           setPhase]           = React.useState<ChatPhase>('role');
  const [showPaywall,     setShowPaywall]     = React.useState(false);
  // token kept in ref so it’s always current in async callbacks
  const tokenRef      = React.useRef<string | null>(null);
  const containerRef  = React.useRef<HTMLDivElement>(null);
  const initialized   = React.useRef(false);

  const scrollDown = React.useCallback(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
  }, []);

  React.useEffect(() => { scrollDown(); }, [messages, isLoading, scrollDown]);

  // ── Init ────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const existingToken = getStoredToken();

    if (existingToken) {
      // User already has an account — check if they have email
      // (i.e. fully registered) via /api/auth/me
      tokenRef.current = existingToken;
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${existingToken}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.email) {
            // Fully registered — show paywall
            setShowPaywall(true);
            setIsInitializing(false);
          } else {
            // Has account but no email — Phase 1
            setPhase('email');
            setIsInitializing(false);
          }
        })
        .catch(() => {
          // Token invalid — clear and restart
          clearStoredToken();
          tokenRef.current = null;
          startFreshChat();
        });
      return;
    }

    startFreshChat();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startFreshChat = async () => {
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Привет! С чего начнём?' }] }),
      });
      const data: ChatApiResponse = response.ok ? await response.json() : { response: 'Привет! Вы ищете работу или специалистов?', is_complete: false };
      setMessages([{ role: 'assistant', content: data.response }]);
    } catch {
      setMessages([{ role: 'assistant', content: 'Привет! Вы ищете работу или специалистов?' }]);
    } finally {
      setIsInitializing(false);
    }
  };

  // ── Send message ────────────────────────────────────────────────
  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isFinished || phase === 'email') return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setIsLoading(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = tokenRef.current || getStoredToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ChatApiResponse = await res.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

      // Save token if backend just created the guest account
      if (data.access_token) {
        tokenRef.current = data.access_token;
        setStoredToken(data.access_token);
        // Transition to email phase after getting first token
        setPhase('email');
      }

      if (data.is_complete) {
        setIsFinished(true);
        setPhase('done');
        setTimeout(() => router.push('/dashboard'), 1800);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'system', content: 'Ошибка соединения. Попробуйте ещё раз.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Called by EmailAttachStep after successful attach
  const handleEmailDone = (newToken: string) => {
    tokenRef.current = newToken;
    setPhase('profile');
    // Prompt LLM for next phase (verification)
    const continueMsg: Message = { role: 'user', content: 'Готово! Что дальше?' };
    setMessages(prev => [...prev, continueMsg]);

    setIsLoading(true);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${newToken}`,
    };
    fetch(`${API_URL}/api/chat`, {
      method: 'POST', headers,
      body: JSON.stringify({ messages: [...messages, continueMsg] }),
    })
      .then(r => r.json())
      .then((data: ChatApiResponse) => {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        if (data.is_complete) {
          setIsFinished(true);
          setPhase('done');
          setTimeout(() => router.push('/dashboard'), 1800);
        }
      })
      .catch(() => setMessages(prev => [...prev, { role: 'system', content: 'Ошибка. Попробуйте ещё раз.' }]))
      .finally(() => setIsLoading(false));
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="animate-spin text-brand h-10 w-10" />
        <p className="mt-4 font-bold uppercase tracking-wider text-sm opacity-70">Инициализация...</p>
      </div>
    );
  }

  const inputDisabled = isLoading || isFinished || showPaywall || phase === 'email';

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden rounded-brutal p-1.5 md:p-2">

      {/* Paywall overlay — shown ONLY for users with full accounts */}
      {showPaywall && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-brutal">
          <div className="bg-surface-light dark:bg-surface-dark border-4 border-black rounded-brutal p-6 md:p-8 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center border-4 border-black mx-auto mb-4">
              <Lock size={32} className="text-black" />
            </div>
            <h2 className="text-2xl font-black uppercase mb-2">PRO-Ассистент</h2>
            <p className="font-bold opacity-80 mb-6 text-sm md:text-base">
              Ваш профиль уже создан! Дальнейшая магия ИИ (авто-верификация, сбор ТЗ) доступна по подписке.
            </p>
            <div className="space-y-3 mb-6">
              <Button
                onClick={() => alert('Интеграция эквайринга в разработке')}
                className="w-full text-lg h-14 bg-brand text-black hover:bg-orange-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all gap-2"
              >
                <CreditCard size={20} /> 159 руб / месяц
              </Button>
              <Button
                onClick={() => alert('Интеграция эквайринга в разрабке')}
                variant="secondary" className="w-full text-base h-12 border-2 border-black"
              >
                1599 руб / год (Выгода 20%)
              </Button>
            </div>
            <p className="text-xs font-bold text-gray-500 mb-4">Или заполните данные вручную абсолютно бесплатно.</p>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full border-2 border-black gap-2"
            >
              <ArrowLeft size={16} /> В Личный Кабинет
            </Button>
          </div>
        </div>
      )}

      {/* Glow ring (spins while loading) */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-[200%] aspect-square z-0 pointer-events-none transition-opacity duration-500',
          isLoading ? 'opacity-100' : 'opacity-0',
        )}
      >
        <div className="w-full h-full animate-[spin_3s_linear_infinite] rounded-full bg-[conic-gradient(from_0deg,transparent_65%,#ffb380_82%,#ff7a00_100%)]" />
      </div>

      {/* Chat card */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0 rounded-brutal overflow-hidden border-4 border-black shadow-brutal-light dark:shadow-brutal-dark bg-surface-light dark:bg-surface-dark">

        {/* Header */}
        <div className="flex-shrink-0 bg-black text-white p-4 flex justify-between items-center border-b-4 border-black">
          <div className="flex items-center gap-3 font-black text-base uppercase tracking-wider">
            <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center border-2 border-white">
              <Bot size={20} className="text-black" />
            </div>
            <span>Ассистент</span>
            {tokenRef.current && (
              <span className="text-[10px] bg-brand text-black px-2 py-0.5 rounded-full ml-1">АКТИВНЫЙ</span>
            )}
          </div>
          {tokenRef.current && (
            <Button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="bg-white text-black hover:bg-gray-200 text-xs font-bold uppercase gap-2 h-9 border-2 border-transparent"
            >
              <ArrowLeft size={16} /> В кабинет
            </Button>
          )}
        </div>

        {/* Messages */}
        <div
          ref={containerRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-6 bg-blueprint scroll-smooth"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex gap-4 max-w-[90%] md:max-w-[75%]',
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto',
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-brutal flex items-center justify-center border-2 border-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                msg.role === 'user'
                  ? 'bg-brand text-black'
                  : msg.role === 'assistant'
                    ? 'bg-white dark:bg-gray-800 text-black dark:text-white'
                    : 'bg-red-500 text-white',
              )}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={cn(
                'p-4 rounded-brutal border-2 border-black text-sm md:text-base leading-relaxed whitespace-pre-wrap font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-brutal-dark',
                msg.role === 'user'
                  ? 'bg-brand text-black'
                  : msg.role === 'assistant'
                    ? 'bg-white dark:bg-gray-800 text-black dark:text-white'
                    : 'bg-red-100 text-red-900',
              )}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* Inline email-attach form — rendered in the message stream */}
          {phase === 'email' && !isFinished && (
            <EmailAttachStep onDone={handleEmailDone} />
          )}

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
        </div>

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t-4 border-black bg-white dark:bg-gray-900">
          {phase === 'email' ? (
            <p className="text-xs font-bold text-center text-gray-400 uppercase tracking-wider py-2">
              ↑ Заполните форму выше
            </p>
          ) : (
            <form onSubmit={sendMessage} className="flex gap-3 w-full">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={isFinished ? 'Переход в кабинет...' : 'Сообщение ассистенту...'}
                disabled={inputDisabled}
                className="h-14 text-base border-2 border-black shadow-skeuo-inner-light"
              />
              <Button
                type="submit"
                size="lg"
                disabled={inputDisabled || !input.trim()}
                className="h-14 px-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:translate-x-1 hover:shadow-none transition-all"
              >
                <Send size={24} />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
