'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, User, MapPin, Briefcase, LogOut,
  ChevronRight, ShieldCheck, Mail,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { apiGet, apiPatch, clearStoredToken } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const SPECS = ['Отделка', 'Плитка', 'Фасад', 'Кладка', 'Сантехника', 'Кровля', 'Электрика', 'Штукатурка', 'Сносные', 'Разное'];

const ENTITY_OPTIONS = [
  { value: 'individual', label: 'Самозанятый' },
  { value: 'ie', label: 'ИП' },
  { value: 'brigade', label: 'Бригада' },
  { value: 'company', label: 'ООО / Организация' },
];

interface Profile {
  id: number;
  role: string;
  email?: string;
  fio?: string;
  location?: string;
  specialization?: string;
  experience_years?: number;
  verification_level: number;
  entity_type?: string;
  company_name?: string;
  bio?: string;
  rate_per_hour?: number;
  rate_per_day?: number;
}

function SectionTitle({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-black/10">
      <Icon size={15} className="text-brand" />
      <h2 className="font-black text-xs uppercase tracking-wider text-gray-500">{label}</h2>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">{children}</label>;
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm focus:outline-none focus:border-brand transition-colors ${className}`}
    />
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const [original, setOriginal] = useState<Profile | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const p = await apiGet<Profile>('/api/users/me');
      setOriginal(p);
      setForm({
        fio: p.fio ?? '',
        location: p.location ?? '',
        specialization: p.specialization ?? '',
        entity_type: p.entity_type ?? 'individual',
        experience_years: p.experience_years ?? 1,
        company_name: p.company_name ?? '',
        bio: p.bio ?? '',
        rate_per_hour: p.rate_per_hour,
        rate_per_day: p.rate_per_day,
      });
    } catch {
      router.replace('/onboarding');
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const set = (field: keyof Profile, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const isDirty = original && JSON.stringify({
    fio: original.fio ?? '', location: original.location ?? '',
    specialization: original.specialization ?? '', entity_type: original.entity_type ?? 'individual',
    experience_years: original.experience_years ?? 1, company_name: original.company_name ?? '',
    bio: original.bio ?? '',
  }) !== JSON.stringify({
    fio: form.fio ?? '', location: form.location ?? '',
    specialization: form.specialization ?? '', entity_type: form.entity_type ?? 'individual',
    experience_years: form.experience_years ?? 1, company_name: form.company_name ?? '',
    bio: form.bio ?? '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiPatch('/api/users/me', form);
      toast.success('Профиль обновлён!');
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => { clearStoredToken(); router.push('/'); };

  if (!original) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isWorker = original.role === 'worker';

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-surface-cardLight dark:bg-surface-cardDark border-b-2 border-black px-4 md:px-8 h-14 flex items-center justify-between">
        <Link href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black uppercase hover:text-brand transition-colors">
          <ArrowLeft size={14} /> Кабинет
        </Link>
        <h1 className="font-black text-sm uppercase">Настройки профиля</h1>
        <Button
          size="sm"
          disabled={!isDirty || isSaving}
          onClick={handleSave}
          className="gap-2 border-2 border-black font-black uppercase text-xs bg-brand text-black disabled:opacity-40"
        >
          <Save size={13} /> {isSaving ? 'Сохраняем...' : 'Сохранить'}
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 space-y-6">

        {/* Account info */}
        <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5">
          <SectionTitle icon={Mail} label="Аккаунт" />
          <div className="flex items-center gap-3 p-3 bg-surface-light dark:bg-surface-dark border-2 border-black/20 rounded-brutal">
            <Mail size={16} className="text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm truncate">{original.email ?? 'Не привязан'}</p>
              <p className="text-[10px] font-bold text-gray-400">Email аккаунта</p>
            </div>
            {original.email && (
              <span className="flex items-center gap-0.5 text-[10px] font-black text-green-600 border border-green-400 bg-green-50 px-2 py-0.5 rounded-brutal">
                <ShieldCheck size={9} /> Подтверждён
              </span>
            )}
          </div>
          <Link href="/dashboard" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
            Роль: <span className="font-black ml-1">{isWorker ? 'Исполнитель' : 'Заказчик'}</span> <ChevronRight size={12} />
          </Link>
        </div>

        {/* Personal info */}
        <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5">
          <SectionTitle icon={User} label="Основная информация" />
          <div className="space-y-4">
            <div>
              <FieldLabel>Полное имя</FieldLabel>
              <Input
                placeholder="Иванов Иван Иванович"
                value={form.fio ?? ''}
                onChange={e => set('fio', e.target.value)}
                maxLength={120}
              />
            </div>

            {!isWorker && (
              <div>
                <FieldLabel>Название компании</FieldLabel>
                <Input
                  placeholder="ООО СтройТраст"
                  value={form.company_name ?? ''}
                  onChange={e => set('company_name', e.target.value)}
                  maxLength={120}
                />
              </div>
            )}

            <div>
              <FieldLabel><span className="flex items-center gap-1"><MapPin size={10} /> Город / регион</span></FieldLabel>
              <Input
                placeholder="Москва"
                value={form.location ?? ''}
                onChange={e => set('location', e.target.value)}
                maxLength={120}
              />
            </div>

            <div>
              <FieldLabel>О себе</FieldLabel>
              <textarea
                placeholder={isWorker
                  ? 'Расскажите о своём опыте, специализации и подходе к работе...'
                  : 'Информация о компании, профиль заказчика...'}
                value={form.bio ?? ''}
                onChange={e => set('bio', e.target.value)}
                rows={4}
                maxLength={2000}
                className="w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm resize-none focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Worker-only fields */}
        {isWorker && (
          <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5">
            <SectionTitle icon={Briefcase} label="Профессиональные данные" />
            <div className="space-y-5">
              <div>
                <FieldLabel>Специализация</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {SPECS.map(s => (
                    <button key={s} type="button" onClick={() => set('specialization', s)}
                      className={`px-3 py-1.5 text-xs font-black uppercase rounded-brutal border-2 border-black transition-all ${
                        form.specialization === s ? 'bg-brand text-black' : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Тип исполнителя</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {ENTITY_OPTIONS.map(o => (
                    <button key={o.value} type="button" onClick={() => set('entity_type', o.value)}
                      className={`py-2.5 px-3 text-xs font-black uppercase rounded-brutal border-2 border-black transition-all ${
                        form.entity_type === o.value ? 'bg-brand text-black' : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50'
                      }`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Опыт работы: <span className="text-brand">{form.experience_years} лет</span></FieldLabel>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={form.experience_years ?? 1}
                  onChange={e => set('experience_years', Number(e.target.value))}
                  className="w-full accent-brand"
                />
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-0.5">
                  <span>1 год</span>
                  <span>40 лет</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Ставка / час (₽)</FieldLabel>
                  <Input
                    type="number"
                    placeholder="1500"
                    value={form.rate_per_hour ?? ''}
                    onChange={e => set('rate_per_hour', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <FieldLabel>Ставка / день (₽)</FieldLabel>
                  <Input
                    type="number"
                    placeholder="12000"
                    value={form.rate_per_day ?? ''}
                    onChange={e => set('rate_per_day', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danger zone */}
        <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-red-300 rounded-brutal p-5">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-red-100">
            <LogOut size={15} className="text-red-400" />
            <h2 className="font-black text-xs uppercase tracking-wider text-red-400">Действия</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-2 border-red-400 text-red-500 hover:bg-red-50 font-black uppercase text-xs gap-2"
          >
            <LogOut size={13} /> Выйти из аккаунта
          </Button>
        </div>

      </div>
    </div>
  );
}
