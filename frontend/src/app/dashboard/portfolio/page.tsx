'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Image as ImageIcon, ArrowLeft, Plus, ShieldCheck,
  Trash2, CheckCircle, Briefcase, ClipboardList, Star,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiDelete, mediaUrl } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface PortfolioCase {
  id: number;
  title: string;
  description?: string;
  photo_url?: string;
  is_verified: boolean;
  work_type?: string;
  year_completed?: number;
  created_at: string;
}

interface UserMe {
  role: string;
}

export default function PortfolioPage() {
  const router = useRouter();
  const toast = useToast();
  const [cases, setCases] = useState<PortfolioCase[]>([]);
  const [role, setRole] = useState<string>('worker');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const me = await apiGet<UserMe>('/api/users/me');
      setRole(me.role ?? 'worker');
      if (me.role !== 'employer') {
        const data = await apiGet<PortfolioCase[]>('/api/portfolio');
        setCases(data);
      }
    } catch {
      setCases([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить этот кейс?')) return;
    try {
      await apiDelete(`/api/portfolio/${id}`);
      toast.success('Кейс удалён');
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    }
  };

  // ─── EMPLOYER VIEW ────────────────────────────────────────────────────────
  if (!isLoading && role === 'employer') {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-black uppercase mb-6 hover:text-brand transition-colors">
            <ArrowLeft size={14} /> Вернуться
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
              <ClipboardList size={20} className="text-black" />
            </div>
            <div>
              <h1 className="font-black text-2xl uppercase">Мои проекты</h1>
              <p className="text-xs font-bold text-gray-500">История заказов и оценки исполнителей</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-brutal text-center">
            <ClipboardList size={40} className="text-gray-200 dark:text-gray-700 mb-4" />
            <p className="font-black text-lg uppercase mb-2">Портфолио заказчика</p>
            <p className="text-sm font-bold text-gray-500 max-w-sm mb-6">
              Заказчики не добавляют кейсы — вы размещаете проекты и выбираете лучших исполнителей.
              История ваших заказов доступна в разделе «Проекты».
            </p>
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="inline-flex items-center gap-2 bg-brand border-2 border-black rounded-brutal px-6 py-3 font-black text-sm uppercase shadow-brutal-light hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <Briefcase size={16} /> Мои проекты
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '📋', title: 'Разместите проект', desc: 'Опишите задачи, бюджет и сроки — исполнители откликнутся' },
              { icon: '🔍', title: 'Выберите лучшего', desc: 'Сравнивайте по рейтингу, кейсам, договорам и отзывам' },
              { icon: '⭐', title: 'Оцените работу', desc: 'После завершения оставьте отзыв — это помогает другим заказчикам' },
            ].map((item) => (
              <div key={item.title} className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-4">
                <span className="text-2xl">{item.icon}</span>
                <p className="font-black text-sm uppercase mt-2 mb-1">{item.title}</p>
                <p className="text-xs font-bold text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── WORKER VIEW ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        <Link href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black uppercase mb-6 hover:text-brand transition-colors">
          <ArrowLeft size={14} /> Вернуться
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
              <ImageIcon size={20} className="text-black" />
            </div>
            <div>
              <h1 className="font-black text-2xl uppercase">Портфолио</h1>
              <p className="text-xs font-bold text-gray-500">
                {isLoading ? 'Загрузка...' : `${cases.length} кейсов`}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/portfolio/new')}
            className="inline-flex items-center gap-2 bg-brand border-2 border-black rounded-brutal px-4 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <Plus size={14} /> Добавить кейс
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1,2,3].map(i => (
              <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-brutal" />
            ))}
          </div>
        ) : cases.length === 0 ? (
          <>
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-brutal text-center">
              <ImageIcon size={40} className="text-gray-200 dark:text-gray-700 mb-4" />
              <p className="font-black text-lg uppercase mb-2">Портфолио пустое</p>
              <p className="text-sm font-bold text-gray-500 max-w-sm mb-6">
                Добавьте первый кейс — фото, описание работы и договор. Заказчики доверяют исполнителям с документами.
              </p>
              <button
                onClick={() => router.push('/dashboard/portfolio/new')}
                className="inline-flex items-center gap-2 bg-brand border-2 border-black rounded-brutal px-6 py-3 font-black text-sm uppercase shadow-brutal-light hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <Plus size={16} /> Добавить первый кейс
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: '📸', title: 'Фото работ', desc: 'До 10 фотографий на кейс в форматах JPG/PNG' },
                { icon: '📄', title: 'Договор', desc: 'Прикрепите договор для подтверждения' },
                { icon: '⭐', title: 'Отзыв заказчика', desc: 'Подтверждённый отзыв повышает доверие' },
              ].map((item) => (
                <div key={item.title} className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-4">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="font-black text-sm uppercase mt-2 mb-1">{item.title}</p>
                  <p className="text-xs font-bold text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 p-3 bg-green-50 dark:bg-gray-800 border-2 border-green-400 rounded-brutal">
              <ShieldCheck size={16} className="text-green-500 shrink-0" />
              <p className="text-xs font-bold text-green-700 dark:text-green-300">
                Кейсы с прикреплёнными договорами верифицируются модераторами СТРОИК — это повышает доверие заказчиков
              </p>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map(c => (
              <div key={c.id} className="group border-2 border-black rounded-brutal overflow-hidden bg-surface-cardLight dark:bg-surface-cardDark hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                {c.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(c.photo_url)} alt={c.title} className="w-full h-44 object-cover border-b-2 border-black" />
                ) : (
                  <div className="w-full h-44 bg-gray-100 dark:bg-gray-800 border-b-2 border-black flex items-center justify-center">
                    <Briefcase size={32} className="text-gray-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-black text-sm leading-tight">{c.title}</p>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.work_type && (
                      <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 rounded-brutal">
                        {c.work_type}
                      </span>
                    )}
                    {c.year_completed && (
                      <span className="text-[10px] font-bold text-gray-400">{c.year_completed}</span>
                    )}
                    {c.is_verified && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-green-700 border border-green-500 bg-green-50 px-1.5 py-0.5 rounded-brutal">
                        <CheckCircle size={8} /> Проверен
                      </span>
                    )}
                  </div>
                  {c.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.description}</p>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={() => router.push('/dashboard/portfolio/new')}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-brutal h-full min-h-[200px] flex flex-col items-center justify-center gap-2 hover:border-brand hover:text-brand transition-colors"
            >
              <Plus size={24} />
              <span className="text-xs font-black uppercase">Добавить кейс</span>
            </button>
          </div>
        )}

        {!isLoading && cases.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-gray-800 border-2 border-green-400 rounded-brutal">
              <ShieldCheck size={14} className="text-green-500 shrink-0" />
              <p className="text-xs font-bold text-green-700 dark:text-green-300">
                Кейсы с договором получают знак «Проверен» и показываются выше в поиске
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-brand/10 border-2 border-brand rounded-brutal">
              <Star size={14} className="text-brand shrink-0" />
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Добавьте больше кейсов, чтобы получить уровень верификации PRO
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
