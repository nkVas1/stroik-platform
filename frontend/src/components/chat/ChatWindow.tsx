'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Send, User, Bot, ArrowLeft, Loader2, Lock, CreditCard, X, Mail, Eye, EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { API_URL, apiPost, setStoredToken, getStoredToken } from '@/lib/api';

type MessageRole = 'user' | 'assistant' | 'system';

interface Message {
  role: MessageRole;
  content: string;
}

interface ChatApiResponse {
  response: string;
  is_complete: boolean;
  access_token?: string | null;
}

interface AttachEmailResult {
  access_token: string;
  user_id: number;
  role: string;
}

// ------------------------------------------------------------------ //
//  Email capture form (shown inline in chat when LLM signals          //
//  attach_email action but frontend needs to call /api/auth directly)  //
// ------------------------------------------------------------------ //
interface EmailFormProps {
  onSuccess: (token: string) => void;
}

function EmailCaptureForm({ onSuccess }: EmailFormProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [showPwd, setShowPwd] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) { setError('Введите корректный email'); return; }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }
    if (password !== confirm) { setError('Пароли не совпадают'); return; }
    setLoading(true);
    try {
      const res = await apiPost<AttachEmailResult>('/api/auth/attach-email', { email, password });
      setStoredToken(res.access_token);
      onSuccess(res.access_token);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Ошибка. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto my-2 w-full max-w-sm bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-3"
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
          <Mail size={15} className="text-black" />
        </div>
        <p className="font-black text-sm uppercase tracking-wide">Укажите email и пароль</p>
      </div>

      <Input
        type="email" value={email} autoFocus autoComplete="email"
        onChange={e => { setEmail(e.target.value); setError(''); }}
        placeholder="you@example.com"
        className="h-10 text-sm"
      />

      <div className="relative">
        <Input
          type={showPwd ? 'text' : 'password'} value={password}
          autoComplete="new-password"
          onChange={e => { setPassword(e.target.value); setError(''); }}
          placeholder="Пароль (мин. 6 символов)"
          className="h-10 text-sm pr-10"
        />
        <button type="button" onClick={() => setShowPwd(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
          {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>

      <Input
        type="password" value={confirm} autoComplete="new-password"
        onChange={e => { setConfirm(e.target.value); setError(''); }}
        placeholder="Повторите пароль"
        className="h-10 text-sm"
      />

      {error && (
        <p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 rounded p-2">{error}</p>
      )}

      <Button
        type="submit" disabled={loading || !email || !password || !confirm}
        className="w-full h-10 border-2 border-black text-sm font-black uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
      >
        {loading ? 'Сохраняю...' : 'Подтвердить'}
      </Button>
    </form>
  );
}

// ------------------------------------------------------------------ //
//  Main ChatWindow component                                           //
// ------------------------------------------------------------------ //
export default function ChatWindow() {
  const router = useRouter();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFinished, setIsFinished] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(true);
  // null = no email form; 'waiting' = show form; 'done' = form submitted
  const [emailPhase, setEmailPhase] = React.useState<null | 'waiting' | 'done'>(null);
  const [showPaywall, setShowPaywall] = React.useState(false);

  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const hasInitialized = React.useRef(false);

  // ------------------------------------------------------------------
  //  Determine if user has a complete profile (to show paywall on re-visit)
  // ------------------------------------------------------------------
  const checkProfileComplete = React.useCallback(async (token: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return false;
      const profile = await res.json();
      // Profile is "complete" if user has email + fio (verification_level >= 1)
      return Boolean(profile.email && profile.verification_level >= 1);
    } catch {
      return false;
    }
  }, []);

  // ------------------------------------------------------------------
  //  Init: send first message to get greeting, or show paywall
  // ------------------------------------------------------------------
  React.useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const init = async () => {
      const token = getStoredToken();

      if (token) {
        const complete = await checkProfileComplete(token);
        if (complete) {
          setShowPaywall(true);
          setIsInitializing(false);
          return;
        }
        // Token exists but profile incomplete — continue onboarding
      }

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ messages: [{ role: 'user', content: 'Привет!' }] }),
        });
        if (!res.ok) throw new Error('init failed');
        const data: ChatApiResponse = await res.json();
        if (data.access_token) setStoredToken(data.access_token);
        setMessages([{ role: 'assistant', content: data.response }]);
      } catch {
        setMessages([{ role: 'assistant', content: 'Привет! Я ИИ-ассистент СТРОИК. Вы ищете работу или специалистов?' }]);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [checkProfileComplete]);

  // ------------------------------------------------------------------
  //  Scroll to bottom on new messages
  // ------------------------------------------------------------------
  const scrollToBottom = React.useCallback(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  React.useEffect(() => { scrollToBottom(); }, [messages, isLoading, emailPhase, scrollToBottom]);

  // ------------------------------------------------------------------
  //  Send message
  // ------------------------------------------------------------------
  const sendMessage = React.useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isFinished) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setIsLoading(true);

    try {
      const token = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) throw new Error('Network error');
      const data: ChatApiResponse = await res.json();

      // Always refresh token if backend issues a new one
      if (data.access_token) setStoredToken(data.access_token);

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

      // LLM wants to collect email — show inline form
      // We detect this by the backend returning no is_complete + specific text pattern
      // More reliably: backend can embed a sentinel in the message; for now check phase via profile
      // The cleanest way: check if the message contains the email phase hint
      // We'll use a simpler approach: after role creation (token just refreshed), check if email needed
      if (data.access_token && !data.is_complete) {
        // New token was issued — re-check if email phase is needed
        const complete = await checkProfileComplete(data.access_token);
        if (!complete) {
          const profileRes = await fetch(`${API_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            if (!profile.email) {
              setEmailPhase('waiting');
            }
          }
        }
      }

      if (data.is_complete) {
        setIsFinished(true);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Ошибка соединения с сервером. Попробуйте ещё раз.',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading, isFinished, router, checkProfileComplete]);

  // ------------------------------------------------------------------
  //  Email form success callback
  // ------------------------------------------------------------------
  const handleEmailSuccess = React.useCallback((token: string) => {
    setEmailPhase('done');
    // Resume chat: send a neutral message so LLM continues to next phase
    setMessages(prev => [
      ...prev,
      { role: 'assistant', content: 'Отлично! Email и пароль сохранены. Давайте продолжим.' },
    ]);
    // Trigger next phase via chat
    setTimeout(async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      try {
        const res = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            messages: [
              ...messages,
              { role: 'assistant', content: 'Отлично! Email и пароль сохранены. Давайте продолжим.' },
              { role: 'user', content: 'Готово, продолжаем!' },
            ],
          }),
        });
        if (res.ok) {
          const data: ChatApiResponse = await res.json();
          if (data.access_token) setStoredToken(data.access_token);
          setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
          if (data.is_complete) {
            setIsFinished(true);
            setTimeout(() => router.push('/dashboard'), 2000);
          }
        }
      } catch {
        // silently fail — user can continue manually
      }
    }, 400);
  }, [messages, router]);

  // ================================================================== //
  //  Render                                                             //
  // ================================================================== //

  if (isInitializing) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="animate-spin text-brand h-10 w-10" />
        <p className="mt-4 font-bold uppercase tracking-wider text-sm opacity-70">
          Инициализация ассистента...
        </p>
      </div>
    );
  }

  const hasToken = Boolean(getStoredToken());

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden rounded-brutal p-1.5 md:p-2">

      {/* Paywall overlay — only for users who already completed onboarding */}
      {showPaywall && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 rounded-brutal">
          <div className="relative bg-surface-light dark:bg-surface-dark border-4 border-black rounded-brutal p-6 md:p-8 max-w-md w-full text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in duration-200">
            <button
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border-2 border-black rounded-brutal hover:bg-red-500 hover:text-white transition-colors bg-white text-black z-50"
              title="Закрыть"
            >
              <X size={16} strokeWidth={3} />
            </button>

            <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center border-4 border-black mx-auto mb-4 mt-2">
              <Lock size={32} className="text-black" />
            </div>
            <h2 className="text-2xl font-black uppercase mb-2">PRO-Ассистент</h2>
            <p className="font-bold opacity-80 mb-6 text-sm md:text-base">
              Ваш профиль уже создан!
              Дальнейшая магия ИИ (авто-сбор ТЗ, верификация) доступна по подписке.
            </p>

            <div className="space-y-3 mb-6">
              <Button
                onClick={() => alert('Интеграция эквайринга в разработке')}
                className="w-full text-lg h-14 bg-brand text-black hover:bg-orange-400 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all gap-2"
              >
                <CreditCard size={20} /> 159 руб / месяц
              </Button>
              <Button
                onClick={() => alert('Интеграция эквайринга в разработке')}
                variant="secondary"
                className="w-full text-base h-12 border-2 border-black"
              >
                1 599 руб / год (Скидка 20%)
              </Button>
            </div>

            <p className="text-xs font-bold text-gray-500 mb-4">
              Или заполните данные самостоятельно в личном кабинете.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full border-2 border-black gap-2"
            >
              <ArrowLeft size={16} /> Вернуться в Личный Кабинет
            </Button>
          </div>
        </div>
      )}

      {/* Glow ring (spinning conic-gradient) */}
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
            {hasToken && (
              <span className="text-[10px] bg-brand text-black px-2 py-0.5 rounded-full ml-1">
                {isFinished ? 'ГОТОВО' : 'В процессе'}
              </span>
            )}
          </div>
          {hasToken && (
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
          ref={messagesContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-4 bg-blueprint scroll-smooth"
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex gap-3 max-w-[90%] md:max-w-[75%]',
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto',
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-brutal flex items-center justify-center border-2 border-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
                msg.role === 'user'
                  ? 'bg-brand text-black'
                  : msg.role === 'assistant'
                    ? 'bg-white dark:bg-gray-800'
                    : 'bg-red-500 text-white',
              )}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={cn(
                'p-3 md:p-4 rounded-brutal border-2 border-black text-sm md:text-base leading-relaxed whitespace-pre-wrap font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
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

          {/* Email capture form — shown when LLM needs email */}
          {emailPhase === 'waiting' && (
            <EmailCaptureForm onSuccess={handleEmailSuccess} />
          )}

          {/* Loading dots */}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-9 h-9 rounded-brutal bg-white dark:bg-gray-800 flex items-center justify-center border-2 border-black shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Bot size={18} />
              </div>
              <div className="p-4 rounded-brutal border-2 border-black bg-white dark:bg-gray-800 flex items-center gap-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <span className="w-2 h-2 bg-brand border border-black rounded-full animate-bounce" style={{ animationDelay: '-0.3s' }} />
                <span className="w-2 h-2 bg-brand border border-black rounded-full animate-bounce" style={{ animationDelay: '-0.15s' }} />
                <span className="w-2 h-2 bg-brand border border-black rounded-full animate-bounce" />
              </div>
            </div>
          )}

          {/* Completion message */}
          {isFinished && (
            <div className="flex justify-center">
              <div className="bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-brutal px-4 py-3 text-sm font-black text-green-700 dark:text-green-400">
                ✅ Профиль создан! Переходим в личный кабинет...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t-4 border-black bg-white dark:bg-gray-900">
          <form onSubmit={sendMessage} className="flex gap-3">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={
                isFinished
                  ? 'Загрузка...'
                  : emailPhase === 'waiting'
                    ? 'Заполните форму выше'
                    : 'Сообщение ассистенту...'
              }
              disabled={isLoading || isFinished || showPaywall || emailPhase === 'waiting'}
              className="h-14 text-base border-2 border-black shadow-skeuo-inner-light"
            />
            <Button
              type="submit"
              size="lg"
              disabled={isLoading || !input.trim() || isFinished || showPaywall || emailPhase === 'waiting'}
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
