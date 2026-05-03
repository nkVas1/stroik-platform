'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle, MapPin, Briefcase, Banknote, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { apiPost } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const SPECS = ['Отделка', 'Плитка', 'Фасад', 'Кладка', 'Сантехника', 'Кровля', 'Электрика', 'Разное'];
const DURATIONS = ['1–2 дня', 'Неделя', '2–4 недели', 'Месяц', 'Более месяца'];

interface FormData {
  title: string;
  specialization: string;
  location: string;
  budget: string;
  negotiable: boolean;
  description: string;
  start_date: string;
  duration: string;
}

const EMPTY: FormData = {
  title: '',
  specialization: '',
  location: '',
  budget: '',
  negotiable: false,
  description: '',
  start_date: '',
  duration: '',
};

const STEPS = ['Основное', 'Детали', 'Публикация'];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">{children}</label>;
}

function InputBase({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm focus:outline-none focus:border-brand transition-colors ${className}`}
    />
  );
}

export default function NewProjectPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  // Step validation
  const canNext = () => {
    if (step === 0) return form.title.trim().length >= 3 && form.location.trim().length >= 2;
    if (step === 1) return form.description.trim().length >= 10;
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await apiPost('/api/projects', {
        title: form.title.trim(),
        specialization: form.specialization || 'Разное',
        location: form.location.trim(),
        budget: form.negotiable || !form.budget ? null : Number(form.budget),
        description: form.description.trim(),
        start_date: form.start_date || null,
        duration: form.duration || null,
      });
      toast.success('Объект опубликован! Специалисты уже видят его.');
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сети');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-4 md:p-8">
      <div className="max-w-xl mx-auto">

        <Link href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black uppercase mb-8 hover:text-brand transition-colors">
          <ArrowLeft size={14} /> Кабинет
        </Link>

        {/* Title */}
        <div className="mb-8">
          <h1 className="font-black text-3xl uppercase">Новый объект</h1>
          <p className="text-sm font-bold text-gray-500 mt-1">
            Опишите задачу — специалисты откликнутся в течение нескольких минут
          </p>
        </div>

        {/* Step bar */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-7 h-7 rounded-full border-2 border-black flex items-center justify-center font-black text-xs transition-all ${
                i < step ? 'bg-green-500 text-white border-green-500'
                  : i === step ? 'bg-brand text-black'
                    : 'bg-white dark:bg-gray-900 text-gray-400'
              }`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`ml-1.5 text-xs font-black uppercase hidden sm:inline ${
                i === step ? 'text-black dark:text-white' : 'text-gray-400'
              }`}>{label}</span>
              {i < STEPS.length - 1 && (
                <div className={`mx-2 sm:mx-3 h-0.5 w-6 sm:w-10 ${
                  i < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-brutal-light dark:shadow-brutal-dark">

          {/* ===== STEP 0: Basics ===== */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase size={18} className="text-brand" />
                <h2 className="font-black text-lg uppercase">Основное</h2>
              </div>

              <div>
                <FieldLabel>Название объекта *</FieldLabel>
                <InputBase
                  placeholder="Например: Отделка 2кк-вартиры, ключ под чистовую..."
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  maxLength={120}
                />
              </div>

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
                <FieldLabel><span className="flex items-center gap-1"><MapPin size={11} /> Город / адрес *</span></FieldLabel>
                <InputBase
                  placeholder="Например: Москва, Рублёвка"
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  maxLength={120}
                />
              </div>
            </div>
          )}

          {/* ===== STEP 1: Details ===== */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-brand" />
                <h2 className="font-black text-lg uppercase">Детали</h2>
              </div>

              <div>
                <FieldLabel>Описание *</FieldLabel>
                <textarea
                  placeholder="Опишите что нужно сделать, материалы, объём работ, особенности..."
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={5}
                  maxLength={2000}
                  className="w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm resize-none focus:outline-none focus:border-brand transition-colors"
                />
                <p className="text-[10px] text-gray-400 font-bold mt-1 text-right">{form.description.length}/2000</p>
              </div>

              <div>
                <FieldLabel><span className="flex items-center gap-1"><Banknote size={11} /> Бюджет</span></FieldLabel>
                <div className="flex items-center gap-3">
                  <InputBase
                    type="number"
                    placeholder="50 000"
                    disabled={form.negotiable}
                    value={form.budget}
                    onChange={e => set('budget', e.target.value)}
                    className={form.negotiable ? 'opacity-40' : ''}
                  />
                  <span className="font-black text-gray-500">₽</span>
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={form.negotiable}
                    onChange={e => set('negotiable', e.target.checked)}
                    className="w-4 h-4 border-2 border-black rounded accent-brand" />
                  <span className="text-xs font-black text-gray-500">Договорная</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Дата начала</FieldLabel>
                  <InputBase type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} />
                </div>
                <div>
                  <FieldLabel>Срок выполнения</FieldLabel>
                  <select
                    value={form.duration}
                    onChange={e => set('duration', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm focus:outline-none focus:border-brand transition-colors"
                  >
                    <option value="">Не указано</option>
                    {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 2: Review ===== */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={18} className="text-green-500" />
                <h2 className="font-black text-lg uppercase">Проверка</h2>
              </div>

              <div className="border-2 border-black rounded-brutal p-4 space-y-3 bg-white dark:bg-gray-900">
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Название</p>
                  <p className="font-black text-base">{form.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Специализация</p>
                    <p className="font-bold text-sm">{form.specialization || 'Разное'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Место</p>
                    <p className="font-bold text-sm flex items-center gap-1"><MapPin size={11} className="text-brand" />{form.location}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Бюджет</p>
                    <p className="font-black text-sm text-brand">
                      {form.negotiable || !form.budget ? 'Договорная' : `${Number(form.budget).toLocaleString('ru-RU')} ₽`}
                    </p>
                  </div>
                  {form.duration && (
                    <div>
                      <p className="text-[10px] font-black uppercase text-gray-400">Срок</p>
                      <p className="font-bold text-sm">{form.duration}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Описание</p>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{form.description}</p>
                </div>
              </div>

              <p className="text-xs font-bold text-gray-500">
                После публикации специалисты увидят объект в ленте заказов и смогут откликнуться.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-5 border-t-2 border-black/10">
            {step > 0 ? (
              <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}
                className="gap-2 border-2 border-black font-black uppercase text-xs">
                <ArrowLeft size={13} /> Назад
              </Button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <Button size="sm" disabled={!canNext()} onClick={() => setStep(s => s + 1)}
                className="gap-2 border-2 border-black font-black uppercase text-xs">
                Далее <ArrowRight size={13} />
              </Button>
            ) : (
              <Button size="sm" disabled={isSubmitting} onClick={handleSubmit}
                className="gap-2 border-2 border-black font-black uppercase text-xs bg-brand text-black">
                <CheckCircle size={13} /> {isSubmitting ? 'Публикуем...' : 'Опубликовать'}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
