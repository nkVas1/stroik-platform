'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HardHat, PlusCircle, ArrowLeft, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiPost, apiGet, getStoredToken } from '@/lib/api';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const SPECIALIZATIONS = [
  'Отделочные работы',
  'Электрика',
  'Сантехника',
  'Плиточные работы',
  'Малярные работы',
  'Полы / стяжка',
  'Потолки',
  'Гипсокартон / перегородки',
  'Кровельные работы',
  'Фасадные работы',
  'Демонтаж',
  'Сварочные работы',
  'Подсобные работы',
  'Ландшафтные работы',
  'Грузчики / перевозка стройматериалов',
  'Другое',
];

interface FormState {
  title: string;
  description: string;
  budget: string;
  required_specialization: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    budget: '',
    required_specialization: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Проверяем авторизацию и роль при загрузке
  useEffect(() => {
    const token = getStoredToken();
    if (!token) { router.replace('/login'); return; }
    apiGet<{ role: string }>('/api/users/me')
      .then(profile => {
        if (profile.role !== 'employer') router.replace('/dashboard');
        else setIsCheckingAuth(false);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.title.trim().length < 5) {
      setError('Название должно быть не менее 5 символов');
      return;
    }
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = { title: form.title.trim() };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.budget) payload.budget = parseInt(form.budget);
      if (form.required_specialization) payload.required_specialization = form.required_specialization;

      await apiPost('/api/projects', payload);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка сервера';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <HardHat className="h-10 w-10 text-brand animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark">
      <header className="px-4 md:px-8 h-16 flex items-center justify-between border-b-2 border-black bg-surface-cardLight dark:bg-surface-cardDark sticky top-0 z-50">
        <Link href="/dashboard" className="inline-flex items-center gap-2 font-black text-xl hover:opacity-80 transition-opacity">
          <HardHat className="h-6 w-6 text-brand" />
          <span>СТРОИК</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors mb-4">
            <ArrowLeft size={14} /> Назад к Дашборду
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight">Новый объект</h1>
              <p className="text-sm font-bold text-gray-500">Опишите задание — специалисты увидят ваш открытый объект</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-5">

            {/* Название */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2 block">
                Название объекта <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="Например: Отделка 2-комнатной квартиры под ключ"
                maxLength={200}
              />
              <p className="text-xs text-gray-400 font-bold mt-1">{form.title.length}/200</p>
            </div>

            {/* Описание */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2 block">
                Описание задания
              </label>
              <textarea
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Опишите подробно: что нужно сделать, площадь, материалы, сроки..."
                rows={5}
                maxLength={2000}
                className="w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-medium text-sm resize-none focus:outline-none focus:border-brand transition-colors"
              />
              <p className="text-xs text-gray-400 font-bold mt-1">{form.description.length}/2000</p>
            </div>

            {/* Специализация */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2 block">
                Требуемая специализация
              </label>
              <select
                value={form.required_specialization}
                onChange={e => handleChange('required_specialization', e.target.value)}
                className="w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm focus:outline-none focus:border-brand transition-colors cursor-pointer"
              >
                <option value="">— Любая —</option>
                {SPECIALIZATIONS.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Бюджет */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2 block">
                Бюджет (руб.)
              </label>
              <Input
                type="number"
                value={form.budget}
                onChange={e => handleChange('budget', e.target.value)}
                placeholder="Например: 150000"
                min={0}
              />
              <p className="text-xs text-gray-400 font-bold mt-1">Оставьте пустым — будет показано "Договорная"</p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-500 rounded-brutal">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Link href="/dashboard" className="flex-1">
              <Button variant="secondary" className="w-full border-2 border-black" type="button">
                Отмена
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading || form.title.trim().length < 5}
              className="flex-1 h-12 font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] gap-2"
            >
              <PlusCircle size={18} />
              {isLoading ? 'Создаю...' : 'Опубликовать объект'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
