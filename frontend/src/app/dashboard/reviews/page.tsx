'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, ArrowLeft, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { apiGet, apiPost, getStoredToken } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface Review {
  id: number;
  project_id: number;
  project_title: string;
  reviewer_name: string;
  rating: number;
  text: string | null;
  created_at: string | null;
}

interface CompletedProject {
  id: number;
  title: string;
  status: string;
  has_review: boolean;
}

interface UserProfile {
  id: number;
  role: string;
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`text-2xl transition-transform hover:scale-110 ${
            star <= value ? 'text-brand' : 'text-gray-300'
          } ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

interface ReviewFormProps {
  projectId: number;
  projectTitle: string;
  onDone: () => void;
}

function ReviewForm({ projectId, projectTitle, onDone }: ReviewFormProps) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (rating < 1) { toast.error('Укажите оценку'); return; }
    setLoading(true);
    try {
      await apiPost('/api/reviews', { project_id: projectId, rating, text: text.trim() || null });
      toast.success('Отзыв оставлен!');
      onDone();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-2 border-brand rounded-brutal p-4 space-y-3 bg-brand/5">
      <p className="text-xs font-black uppercase tracking-wider"><span className="text-brand">●</span> {projectTitle}</p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Комментарий (необязательно)"
        maxLength={1000}
        rows={3}
        className="w-full text-xs font-bold border-2 border-black rounded-brutal p-3 bg-white dark:bg-gray-900 resize-none focus:outline-none focus:border-brand"
      />
      <button
        onClick={submit}
        disabled={loading}
        className="w-full py-2.5 bg-brand border-2 border-black rounded-brutal font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all disabled:opacity-50"
      >
        {loading ? 'Отправка...' : 'Оставить отзыв →'}
      </button>
    </div>
  );
}

export default function ReviewsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [completedProjects, setCompletedProjects] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState<number | null>(null);

  const load = useCallback(async () => {
    const token = getStoredToken();
    if (!token) { router.replace('/onboarding'); return; }
    try {
      const me = await apiGet<UserProfile>('/api/users/me');
      setProfile(me);
      if (me.role === 'worker') {
        const rev = await apiGet<Review[]>(`/api/reviews/${me.id}`);
        setReviews(rev);
      } else {
        const dash = await apiGet<{ projects?: CompletedProject[] }>('/api/users/me/dashboard_data');
        const completed = (dash.projects ?? []).filter(
          (p) => p.status === 'completed'
        ) as CompletedProject[];
        setCompletedProjects(completed);
        const reviewedIds = new Set<number>();
        for (const p of completed) {
          try {
            // Check if review exists for this project using a worker-side lookup
            // We mark has_review based on dashboard data if available
            if ((p as CompletedProject & { has_review?: boolean }).has_review) reviewedIds.add(p.id);
          } catch { /* skip */ }
        }
      }
    } catch {
      router.replace('/onboarding');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const isWorker = profile?.role === 'worker';

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-surface-cardLight dark:bg-surface-cardDark border-b-2 border-black px-4 md:px-8 h-14 flex items-center gap-3">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-black uppercase hover:text-brand transition-colors">
          <ArrowLeft size={14} /> Дашборд
        </Link>
        <div className="flex-1" />
        <MessageSquare size={16} className="text-gray-400" />
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
            <Star size={20} className="text-black" />
          </div>
          <div>
            <h1 className="font-black text-2xl md:text-3xl uppercase">Отзывы</h1>
            <p className="text-xs font-bold text-gray-500">
              {isWorker ? 'Отзывы заказчиков по завершённым договорам' : 'Оставьте отзыв после завершения работ'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0,1,2].map(i => (
              <div key={i} className="h-28 border-2 border-black rounded-brutal animate-pulse bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : (
          <>
            {/* ===== WORKER VIEW ===== */}
            {isWorker && (
              <>
                {reviews.length > 0 && (
                  <div className="mb-6 flex items-center gap-4 border-2 border-black rounded-brutal p-4 bg-surface-cardLight dark:bg-surface-cardDark shadow-brutal-light dark:shadow-brutal-dark">
                    <div className="text-center">
                      <div className="text-3xl font-black text-brand">{avgRating}</div>
                      <div className="text-[10px] font-black uppercase text-gray-500">Сред. оценка</div>
                    </div>
                    <div className="w-px h-12 bg-black/10" />
                    <div>
                      <div className="text-xl font-black">{reviews.length}</div>
                      <div className="text-[10px] font-black uppercase text-gray-500">Отзывов</div>
                    </div>
                    <div className="ml-2">
                      <StarRating value={Math.round(Number(avgRating))} />
                    </div>
                  </div>
                )}
                {reviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="text-5xl mb-4">⭐</span>
                    <p className="font-black text-lg uppercase mb-2">Пока нет отзывов</p>
                    <p className="text-sm font-bold text-gray-500 max-w-xs">
                      Отзывы появятся, когда заказчики оценят вашу работу по завершённым договорам
                    </p>
                    <Link
                      href="/dashboard"
                      className="mt-6 inline-flex items-center gap-2 bg-brand border-2 border-black rounded-brutal px-4 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all"
                    >
                      Найти заказы →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div
                        key={r.id}
                        className="border-2 border-black rounded-brutal p-5 bg-surface-cardLight dark:bg-surface-cardDark shadow-brutal-light dark:shadow-brutal-dark"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-black text-sm">{r.project_title}</p>
                            <p className="text-[10px] font-bold text-gray-500">{r.reviewer_name} · {r.created_at ?? '—'}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="font-black text-brand text-lg">{r.rating}</span>
                            <span className="text-brand text-sm">★</span>
                          </div>
                        </div>
                        {r.text && (
                          <p className="text-sm font-bold text-gray-600 dark:text-gray-400 border-l-4 border-brand pl-3">{r.text}</p>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                          <CheckCircle size={11} className="text-green-500" />
                          <span className="text-[10px] font-black uppercase text-green-600">Подтверждённый договор</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ===== EMPLOYER VIEW ===== */}
            {!isWorker && (
              <>
                {completedProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="text-5xl mb-4">📝</span>
                    <p className="font-black text-lg uppercase mb-2">Нет завершённых проектов</p>
                    <p className="text-sm font-bold text-gray-500 max-w-xs">
                      Отзывы можно оставлять после завершения проекта.
                      Они привязываются к договору — это главное преимущество платформы.
                    </p>
                    <Link
                      href="/dashboard"
                      className="mt-6 inline-flex items-center gap-2 bg-brand border-2 border-black rounded-brutal px-4 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all"
                    >
                      К моим проектам →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={14} className="text-brand" />
                      <p className="text-xs font-black uppercase text-gray-600 dark:text-gray-400">
                        Отзывы привязываются к договору — это нельзя подделать
                      </p>
                    </div>
                    {completedProjects.map((p) => (
                      <div key={p.id}>
                        {activeForm === p.id ? (
                          <ReviewForm
                            projectId={p.id}
                            projectTitle={p.title}
                            onDone={() => { setActiveForm(null); load(); }}
                          />
                        ) : (
                          <div className="border-2 border-black rounded-brutal p-5 bg-surface-cardLight dark:bg-surface-cardDark shadow-brutal-light dark:shadow-brutal-dark flex items-center justify-between gap-4">
                            <div>
                              <p className="font-black text-sm">{p.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <CheckCircle size={11} className="text-green-500" />
                                <span className="text-[10px] font-bold text-green-600 uppercase">Завершён</span>
                              </div>
                            </div>
                            <button
                              onClick={() => setActiveForm(p.id)}
                              className="shrink-0 inline-flex items-center gap-2 bg-brand border-2 border-black rounded-brutal px-3 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all"
                            >
                              <Star size={12} /> Оценить
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
