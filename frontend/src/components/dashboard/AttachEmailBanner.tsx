'use client';

import { useState } from 'react';
import { Mail, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiPost, setStoredToken } from '@/lib/api';

interface Props {
  onDone: () => void;
}

interface AttachResponse {
  access_token: string;
  user_id: number;
  role: string;
}

export function AttachEmailBanner({ onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (done) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Пароли не совпадают'); return; }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiPost<AttachResponse>('/api/auth/attach-email', { email, password });
      setStoredToken(res.access_token);
      setDone(true);
      onDone();
    } catch (err: unknown) {
      const e = err as { detail?: string };
      setError(e?.detail || 'Ошибка. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 rounded-brutal p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 border-2 border-black rounded-brutal flex items-center justify-center flex-shrink-0">
            <Mail size={18} className="text-black" />
          </div>
          <div>
            <p className="font-black text-sm uppercase tracking-wide">Привяжите email к аккаунту</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Сохраните доступ с любого устройства — входите по email и паролю.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!open && (
            <Button
              size="sm"
              onClick={() => setOpen(true)}
              className="border-2 border-black text-xs font-black uppercase whitespace-nowrap"
            >
              Привязать
            </Button>
          )}
          <button onClick={() => setDone(true)} className="text-gray-400 hover:text-black transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <Input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            placeholder="you@example.com"
            className="h-10 text-sm"
            autoFocus
          />
          <div className="relative">
            <Input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Пароль (мин. 6 символов)"
              className="h-10 text-sm pr-10"
            />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <Input
            type="password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(''); }}
            placeholder="Повторите пароль"
            className="h-10 text-sm"
          />
          {error && <p className="text-xs font-bold text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !email || !password}
              className="flex-1 border-2 border-black text-sm font-black uppercase h-10">
              {loading ? 'Сохраняю...' : 'Сохранить'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}
              className="border-2 border-black text-sm h-10">
              Отмена
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
