'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, CheckCircle, ImagePlus,
  FileText, ShieldCheck, X, Upload, Plus, DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { apiPostForm, apiGet } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

const WORK_TYPES = ['Отделка', 'Плитка', 'Фасад', 'Кладка', 'Сантехника', 'Кровля', 'Электрика', 'Разное'];
const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
const STEPS = ['Фото', 'Детали', 'Договор'];

export default function NewCasePage() {
  const router = useRouter();
  const toast = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const contractInputRef = useRef<HTMLInputElement>(null);

  const [roleChecked, setRoleChecked] = useState(false);
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workType, setWorkType] = useState('');
  const [city, setCity] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [budget, setBudget] = useState('');
  const [clientName, setClientName] = useState('');
  const [contract, setContract] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    apiGet<{ role: string }>('/api/users/me')
      .then(me => {
        if (me.role === 'employer') {
          toast.error('Страница добавления кейса доступна только исполнителям');
          router.replace('/dashboard/portfolio');
        } else {
          setRoleChecked(true);
        }
      })
      .catch(() => setRoleChecked(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 10 - photos.length);
    setPhotos(prev => [...prev, ...arr]);
    arr.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (i: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
    setPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const canNext = () => {
    if (step === 0) return photos.length > 0;
    if (step === 1) return title.trim().length >= 3;
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('description', description.trim());
      fd.append('work_type', workType || 'Разное');
      fd.append('city', city.trim());
      fd.append('year_completed', String(year));
      if (budget.trim()) fd.append('budget', budget.trim());
      if (clientName.trim()) fd.append('client_name', clientName.trim());
      photos.forEach(f => fd.append('photos', f));
      if (contract) fd.append('contract', contract);
      await apiPostForm('/api/portfolio', fd);
      toast.success('Кейс добавлен! Модератор проверит его в ближайшее время.');
      router.push('/dashboard/portfolio');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!roleChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-4 md:p-8">
      <div className="max-w-xl mx-auto">

        <Link href="/dashboard/portfolio"
          className="inline-flex items-center gap-2 text-xs font-black uppercase mb-8 hover:text-brand transition-colors">
          <ArrowLeft size={14} /> Портфолио
        </Link>

        <div className="mb-8">
          <h1 className="font-black text-3xl uppercase">Новый кейс</h1>
          <p className="text-sm font-bold text-gray-500 mt-1">
            Добавьте фото, опишите работу и прикрепите договор — это повышает доверие заказчиков
          </p>
        </div>

        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-7 h-7 rounded-full border-2 border-black flex items-center justify-center font-black text-xs transition-all ${
                i < step ? 'bg-green-500 text-white border-green-500'
                  : i === step ? 'bg-brand text-black' : 'bg-white dark:bg-gray-900 text-gray-400'
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

        <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-brutal-light dark:shadow-brutal-dark">

          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <ImagePlus size={18} className="text-brand" />
                <h2 className="font-black text-lg uppercase">Фотографии</h2>
                <span className="text-xs font-bold text-gray-400">{photos.length}/10</span>
              </div>
              <div
                onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-brutal p-8 text-center cursor-pointer hover:border-brand transition-colors"
              >
                <Upload size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="font-black text-sm text-gray-500">Нажмите для загрузки</p>
                <p className="text-xs font-bold text-gray-400">JPG, PNG — до 10 фото</p>
                <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                  multiple className="hidden" onChange={e => addPhotos(e.target.files)} />
              </div>
              {previews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group aspect-square border-2 border-black rounded-brutal overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      ><X size={10} /></button>
                    </div>
                  ))}
                  {photos.length < 10 && (
                    <button onClick={() => photoInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-brutal flex items-center justify-center hover:border-brand transition-colors">
                      <Plus size={20} className="text-gray-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={18} className="text-brand" />
                <h2 className="font-black text-lg uppercase">Детали</h2>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Название *</label>
                <input type="text"
                  placeholder="Например: Отделка 2-кк квартиры под ключ"
                  value={title} onChange={e => setTitle(e.target.value)} maxLength={100}
                  className="w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm focus:outline-none focus:border-brand transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Тип работ</label>
                <div className="flex flex-wrap gap-2">
                  {WORK_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setWorkType(t)}
                      className={`px-3 py-1.5 text-xs font-black uppercase rounded-brutal border-2 border-black transition-all ${
                        workType === t ? 'bg-brand text-black' : 'bg-white dark:bg-gray-900 text-gray-500 hover:bg-gray-50'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Город</label>
                  <input type="text" placeholder="Москва" value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm focus:outline-none focus:border-brand transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Год</label>
                  <select value={year} onChange={e => setYear(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm focus:outline-none focus:border-brand transition-colors">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Стоимость работ</label>
                  <div className="relative">
                    <DollarSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="напр. 150 000 ₽" value={budget}
                      onChange={e => setBudget(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm focus:outline-none focus:border-brand transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Заказчик</label>
                  <input type="text" placeholder="Имя / компания" value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm focus:outline-none focus:border-brand transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Описание</label>
                <textarea placeholder="Что делали, какие материалы, особенности..."
                  value={description} onChange={e => setDescription(e.target.value)}
                  rows={3} maxLength={1000}
                  className="w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm resize-none focus:outline-none focus:border-brand transition-colors" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={18} className="text-green-500" />
                <h2 className="font-black text-lg uppercase">Договор</h2>
                <span className="text-xs font-bold text-gray-400">Необязательно</span>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-400 rounded-brutal">
                <p className="text-xs font-black uppercase text-green-700 dark:text-green-300 mb-1">Почему это важно?</p>
                <p className="text-xs font-bold text-green-700 dark:text-green-400">
                  Кейсы с договором получают знак «Проверен». Это означает, что работа реальна и подтверждена документально. Заказчики в первую очередь выбирают таких исполнителей.
                </p>
              </div>

              {contract ? (
                <div className="flex items-center gap-3 p-4 border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-brutal">
                  <CheckCircle size={20} className="text-green-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">{contract.name}</p>
                    <p className="text-xs font-bold text-gray-500">{(contract.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={() => setContract(null)} className="text-red-400 hover:text-red-600">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div onClick={() => contractInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-brutal p-8 text-center cursor-pointer hover:border-brand transition-colors">
                  <Upload size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-black text-sm text-gray-500">Загрузить договор</p>
                  <p className="text-xs font-bold text-gray-400">PDF, JPG, PNG</p>
                  <input ref={contractInputRef} type="file" accept=".pdf,image/jpeg,image/png"
                    className="hidden" onChange={e => setContract(e.target.files?.[0] ?? null)} />
                </div>
              )}

              <p className="text-xs font-bold text-gray-400">
                Данные документа хранятся зашифрованно и не передаются третьим лицам
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-5 border-t-2 border-black/10">
            {step > 0 ? (
              <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}
                className="gap-2 border-2 border-black font-black uppercase text-xs">
                <ArrowLeft size={13} /> Назад
              </Button>
            ) : <div />}

            {step < STEPS.length - 1 ? (
              <Button size="sm" disabled={!canNext()} onClick={() => setStep(s => s + 1)}
                className="gap-2 border-2 border-black font-black uppercase text-xs">
                Далее <ArrowRight size={13} />
              </Button>
            ) : (
              <Button size="sm" disabled={isSubmitting} onClick={handleSubmit}
                className="gap-2 border-2 border-black font-black uppercase text-xs bg-brand text-black">
                <CheckCircle size={13} />
                {isSubmitting ? 'Сохраняем...' : 'Сохранить кейс'}
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
