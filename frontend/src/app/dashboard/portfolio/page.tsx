'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Image as ImageIcon, ArrowLeft, Plus, ShieldCheck,
  Trash2, CheckCircle, Briefcase, ClipboardList, Star,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, apiDelete } from '@/lib/api';
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
    if (!window.confirm('\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u044d\u0442\u043e\u0442 \u043a\u0435\u0439\u0441?')) return;
    try {
      await apiDelete(`/api/portfolio/${id}`);
      toast.success('\u041a\u0435\u0439\u0441 \u0443\u0434\u0430\u043b\u0451\u043d');
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '\u041e\u0448\u0438\u0431\u043a\u0430');
    }
  };

  // ─── EMPLOYER VIEW ──────────────────────────────────────────────────────────
  if (!isLoading && role === 'employer') {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-black uppercase mb-6 hover:text-brand transition-colors">
            <ArrowLeft size={14} /> \u0412\u0435\u0440\u043d\u0443\u0442\u044c\u0441\u044f
          </Link>

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
              <ClipboardList size={20} className="text-black" />
            </div>
            <div>
              <h1 className="font-black text-2xl uppercase">\u041c\u043e\u0438 \u043f\u0440\u043e\u0435\u043a\u0442\u044b</h1>
              <p className="text-xs font-bold text-gray-500">\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u0437\u0430\u043a\u0430\u0437\u043e\u0432 \u0438 \u043e\u0446\u0435\u043d\u043a\u0438 \u0438\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u0435\u0439</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-brutal text-center">
            <ClipboardList size={40} className="text-gray-200 dark:text-gray-700 mb-4" />
            <p className="font-black text-lg uppercase mb-2">\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e \u0437\u0430\u043a\u0430\u0437\u0447\u0438\u043a\u0430</p>
            <p className="text-sm font-bold text-gray-500 max-w-sm mb-6">
              \u0417\u0430\u043a\u0430\u0437\u0447\u0438\u043a\u0438 \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u044f\u044e\u0442 \u043a\u0435\u0439\u0441\u044b \u2014 \u0432\u044b \u0440\u0430\u0437\u043c\u0435\u0449\u0430\u0435\u0442\u0435 \u043f\u0440\u043e\u0435\u043a\u0442\u044b \u0438 \u0432\u044b\u0431\u0438\u0440\u0430\u0435\u0442\u0435 \u043b\u0443\u0447\u0448\u0438\u0445 \u0438\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u0435\u0439.
              \u0418\u0441\u0442\u043e\u0440\u0438\u044f \u0432\u0430\u0448\u0438\u0445 \u0437\u0430\u043a\u0430\u0437\u043e\u0432 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430 \u0432 \u0440\u0430\u0437\u0434\u0435\u043b\u0435 \u00ab\u041f\u0440\u043e\u0435\u043a\u0442\u044b\u00bb.
            </p>
            <button
              onClick={() => router.push('/dashboard/projects')}
              className="inline-flex items-center gap-2 bg-brand border-2 border-black rounded-brutal px-6 py-3 font-black text-sm uppercase shadow-brutal-light hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <Briefcase size={16} /> \u041c\u043e\u0438 \u043f\u0440\u043e\u0435\u043a\u0442\u044b
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '\uD83D\uDCCB', title: '\u0420\u0430\u0437\u043c\u0435\u0441\u0442\u0438\u0442\u0435 \u043f\u0440\u043e\u0435\u043a\u0442', desc: '\u041e\u043f\u0438\u0448\u0438\u0442\u0435 \u0437\u0430\u0434\u0430\u0447\u0438, \u0431\u044e\u0434\u0436\u0435\u0442 \u0438 \u0441\u0440\u043e\u043a\u0438 \u2014 \u0438\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u0438 \u043e\u0442\u043a\u043b\u0438\u043a\u043d\u0443\u0442\u0441\u044f' },
              { icon: '\uD83D\uDD0D', title: '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043b\u0443\u0447\u0448\u0435\u0433\u043e', desc: '\u0421\u0440\u0430\u0432\u043d\u0438\u0432\u0430\u0439\u0442\u0435 \u043f\u043e \u0440\u0435\u0439\u0442\u0438\u043d\u0433\u0443, \u043a\u0435\u0439\u0441\u0430\u043c, \u0434\u043e\u0433\u043e\u0432\u043e\u0440\u0430\u043c \u0438 \u043e\u0442\u0437\u044b\u0432\u0430\u043c' },
              { icon: '\u2B50', title: '\u041e\u0446\u0435\u043d\u0438\u0442\u0435 \u0440\u0430\u0431\u043e\u0442\u0443', desc: '\u041f\u043e\u0441\u043b\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0438\u044f \u043e\u0441\u0442\u0430\u0432\u044c\u0442\u0435 \u043e\u0442\u0437\u044b\u0432 \u2014 \u044d\u0442\u043e \u043f\u043e\u043c\u043e\u0433\u0430\u0435\u0442 \u0434\u0440\u0443\u0433\u0438\u043c \u0437\u0430\u043a\u0430\u0437\u0447\u0438\u043a\u0430\u043c' },
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

  // ─── WORKER VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        <Link href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black uppercase mb-6 hover:text-brand transition-colors">
          <ArrowLeft size={14} /> \u0412\u0435\u0440\u043d\u0443\u0442\u044c\u0441\u044f
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
              <ImageIcon size={20} className="text-black" />
            </div>
            <div>
              <h1 className="font-black text-2xl uppercase">\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e</h1>
              <p className="text-xs font-bold text-gray-500">
                {isLoading ? '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...' : `${cases.length} \u043a\u0435\u0439\u0441\u043e\u0432`}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/portfolio/new')}
            className="inline-flex items-center gap-2 bg-brand border-2 border-black rounded-brutal px-4 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <Plus size={14} /> \u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043a\u0435\u0439\u0441
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
              <p className="font-black text-lg uppercase mb-2">\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e \u043f\u0443\u0441\u0442\u043e\u0435</p>
              <p className="text-sm font-bold text-gray-500 max-w-sm mb-6">
                \u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u043f\u0435\u0440\u0432\u044b\u0439 \u043a\u0435\u0439\u0441 \u2014 \u0444\u043e\u0442\u043e, \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u0440\u0430\u0431\u043e\u0442\u044b \u0438 \u0434\u043e\u0433\u043e\u0432\u043e\u0440. \u0417\u0430\u043a\u0430\u0437\u0447\u0438\u043a\u0438 \u0434\u043e\u0432\u0435\u0440\u044f\u044e\u0442 \u0438\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044f\u043c \u0441 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430\u043c\u0438.
              </p>
              <button
                onClick={() => router.push('/dashboard/portfolio/new')}
                className="inline-flex items-center gap-2 bg-brand border-2 border-black rounded-brutal px-6 py-3 font-black text-sm uppercase shadow-brutal-light hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <Plus size={16} /> \u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u0435\u0440\u0432\u044b\u0439 \u043a\u0435\u0439\u0441
              </button>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: '\uD83D\uDCF8', title: '\u0424\u043e\u0442\u043e \u0440\u0430\u0431\u043e\u0442', desc: '\u0414\u043e 10 \u0444\u043e\u0442\u043e\u0433\u0440\u0430\u0444\u0438\u0439 \u043d\u0430 \u043a\u0435\u0439\u0441 \u0432 \u0444\u043e\u0440\u043c\u0430\u0442\u0430\u0445 JPG/PNG' },
                { icon: '\uD83D\uDCC4', title: '\u0414\u043e\u0433\u043e\u0432\u043e\u0440', desc: '\u041f\u0440\u0438\u043a\u0440\u0435\u043f\u0438\u0442\u0435 \u0434\u043e\u0433\u043e\u0432\u043e\u0440 \u0434\u043b\u044f \u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u044f' },
                { icon: '\u2B50', title: '\u041e\u0442\u0437\u044b\u0432 \u0437\u0430\u043a\u0430\u0437\u0447\u0438\u043a\u0430', desc: '\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043d\u043d\u044b\u0439 \u043e\u0442\u0437\u044b\u0432 \u043f\u043e\u0432\u044b\u0448\u0430\u0435\u0442 \u0434\u043e\u0432\u0435\u0440\u0438\u0435' },
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
                \u041a\u0435\u0439\u0441\u044b \u0441 \u043f\u0440\u0438\u043a\u0440\u0435\u043f\u043b\u0451\u043d\u043d\u044b\u043c\u0438 \u0434\u043e\u0433\u043e\u0432\u043e\u0440\u0430\u043c\u0438 \u0432\u0435\u0440\u0438\u0444\u0438\u0446\u0438\u0440\u0443\u044e\u0442\u0441\u044f \u043c\u043e\u0434\u0435\u0440\u0430\u0442\u043e\u0440\u0430\u043c\u0438 \u0421\u0422\u0420\u041e\u0418\u041a \u2014 \u044d\u0442\u043e \u043f\u043e\u0432\u044b\u0448\u0430\u0435\u0442 \u0434\u043e\u0432\u0435\u0440\u0438\u0435 \u0437\u0430\u043a\u0430\u0437\u0447\u0438\u043a\u043e\u0432
              </p>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map(c => (
              <div key={c.id} className="group border-2 border-black rounded-brutal overflow-hidden bg-surface-cardLight dark:bg-surface-cardDark hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                {c.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photo_url} alt={c.title} className="w-full h-44 object-cover border-b-2 border-black" />
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
                        <CheckCircle size={8} /> \u041f\u0440\u043e\u0432\u0435\u0440\u0435\u043d
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
              <span className="text-xs font-black uppercase">\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043a\u0435\u0439\u0441</span>
            </button>
          </div>
        )}

        {/* Trust tips for workers with cases */}
        {!isLoading && cases.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-gray-800 border-2 border-green-400 rounded-brutal">
              <ShieldCheck size={14} className="text-green-500 shrink-0" />
              <p className="text-xs font-bold text-green-700 dark:text-green-300">
                \u041a\u0435\u0439\u0441\u044b \u0441 \u0434\u043e\u0433\u043e\u0432\u043e\u0440\u043e\u043c \u043f\u043e\u043b\u0443\u0447\u0430\u044e\u0442 \u0437\u043d\u0430\u043a \u00ab\u041f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u00bb \u0438 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u044e\u0442\u0441\u044f \u0432\u044b\u0448\u0435 \u0432 \u043f\u043e\u0438\u0441\u043a\u0435
              </p>
            </div>
            <div className="flex items-center gap-2 p-3 bg-brand/10 border-2 border-brand rounded-brutal">
              <Star size={14} className="text-brand shrink-0" />
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                \u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0431\u043e\u043b\u044c\u0448\u0435 \u043a\u0435\u0439\u0441\u043e\u0432, \u0447\u0442\u043e\u0431\u044b \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u0443\u0440\u043e\u0432\u0435\u043d\u044c \u0432\u0435\u0440\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u0438 PRO
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
