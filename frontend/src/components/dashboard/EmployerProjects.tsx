'use client';

import { useState } from 'react';
import {
  Briefcase, CheckCircle, XCircle, PlusCircle,
  Star, ExternalLink, ChevronDown, ChevronUp, ArrowUpRight,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface Bid {
  id: number;
  worker_id?: number;
  worker_name: string;
  worker_spec?: string;
  cover_letter?: string;
  price_offer?: number;
  status: string;
}

interface Project {
  id: number;
  title: string;
  status: string;
  bids: Bid[];
}

interface EmployerProjectsProps {
  projects: Project[];
  onRefresh: () => void;
}

const STATUS_MAP: Record<string, { label: string; dot: string; row: string }> = {
  open:        { label: 'Ищем исп.', dot: 'bg-green-500',  row: 'border-green-400' },
  in_progress: { label: 'В работе',     dot: 'bg-brand',       row: 'border-brand' },
  completed:   { label: 'Завершён',   dot: 'bg-gray-400',    row: 'border-gray-300' },
  cancelled:   { label: 'Отменён',   dot: 'bg-red-400',     row: 'border-red-300' },
};

// ----- Review modal (unchanged) -----
interface ReviewModalProps {
  projectId: number;
  projectTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

function ReviewModal({ projectId, projectTitle, onClose, onSuccess }: ReviewModalProps) {
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hover, setHover] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiPost('/api/reviews', { project_id: projectId, rating, text: text || null });
      toast.success('Отзыв успешно опубликован!');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface-light dark:bg-surface-dark border-4 border-black rounded-brutal p-6 md:p-8 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center mb-5 border-b-2 border-black pb-4">
          <h2 className="text-xl font-black uppercase">Оценить работу</h2>
          <button onClick={onClose} className="font-black text-xl hover:text-red-500 transition-colors">✕</button>
        </div>
        <p className="text-sm font-bold text-gray-500 mb-5 truncate">Объект: {projectTitle}</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-black uppercase text-gray-500 mb-2 block">Оценка</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                  className="p-1 transition-transform hover:scale-125">
                  <Star size={28} className={n <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                </button>
              ))}
              <span className="ml-2 font-black text-lg self-center">{hover || rating}.0</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-black uppercase text-gray-500 mb-2 block">Комментарий</label>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Расскажите о работе специалиста..."
              rows={3} maxLength={1000}
              className="w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-medium text-sm resize-none focus:outline-none focus:border-brand transition-colors" />
          </div>
          <Button type="submit" disabled={isSaving} className="w-full h-12 border-2 border-black font-black uppercase gap-2">
            <Star size={16} /> {isSaving ? 'Отправляем...' : 'Опубликовать отзыв'}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ----- Bids panel (collapsible inside project row) -----
function BidsPanel({ project, onAccept, onReview }: {
  project: Project;
  onAccept: (bidId: number) => void;
  onReview: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const PREVIEW_COUNT = 3;
  const bids = showAll ? project.bids : project.bids.slice(0, PREVIEW_COUNT);

  return (
    <div className="mt-2 pt-3 border-t-2 border-black/10 dark:border-white/10 space-y-2">
      {/* Active / Completed banners */}
      {project.status === 'in_progress' && (
        <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-brand rounded-brutal">
          <div>
            <p className="text-xs font-black uppercase text-amber-700 dark:text-brand">Сделка активна</p>
            <p className="text-[10px] font-bold text-gray-500">Эскроу-защита работает</p>
          </div>
          <Button variant="primary" size="sm"
            onClick={() => {
              if (window.confirm('Подтвердите завершение. Средства будут переведены.')) onReview();
            }}
            className="text-[10px] shrink-0">
            Принять работу
          </Button>
        </div>
      )}
      {project.status === 'completed' && (
        <div className="flex items-center justify-between gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-400 rounded-brutal">
          <p className="text-xs font-black uppercase text-green-700 dark:text-green-300">Объект завершён</p>
          <button onClick={onReview}
            className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-green-700 dark:text-green-300 hover:underline">
            <Star size={11} /> Оставить отзыв
          </button>
        </div>
      )}

      {/* Bid rows */}
      {project.bids.length === 0 ? (
        <p className="text-[11px] font-bold text-gray-400 text-center py-3">Пока нет откликов...</p>
      ) : (
        bids.map(bid => (
          <div key={bid.id}
            className="flex items-center gap-3 p-2.5 bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-brutal">
            {/* Name + spec */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black truncate">{bid.worker_name}</span>
                {bid.worker_id && (
                  <Link href={`/profile/${bid.worker_id}`} className="text-brand hover:opacity-70">
                    <ExternalLink size={11} />
                  </Link>
                )}
              </div>
              <span className="text-[10px] font-bold text-brand uppercase">{bid.worker_spec || 'Универсал'}</span>
              {bid.cover_letter && (
                <p className="text-[11px] italic text-gray-500 mt-0.5 line-clamp-1">&ldquo;{bid.cover_letter}&rdquo;</p>
              )}
            </div>
            {/* Price */}
            {bid.price_offer != null && (
              <span className="text-sm font-black text-brand shrink-0">
                {bid.price_offer.toLocaleString('ru-RU')} ₽
              </span>
            )}
            {/* Action */}
            <div className="shrink-0">
              {project.status === 'open' && bid.status === 'pending' ? (
                <Button size="sm" onClick={() => onAccept(bid.id)}
                  className="text-[10px] font-black uppercase px-3 py-1 h-auto">
                  Нанять
                </Button>
              ) : (
                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-brutal border ${
                  bid.status === 'accepted'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700'
                    : 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600'
                }`}>
                  {bid.status === 'accepted'
                    ? <><CheckCircle size={10} /> Назначен</>
                    : <><XCircle size={10} /> Отказ</>
                  }
                </span>
              )}
            </div>
          </div>
        ))
      )}

      {project.bids.length > PREVIEW_COUNT && (
        <button onClick={() => setShowAll(v => !v)}
          className="w-full text-[10px] font-black uppercase text-gray-400 hover:text-black dark:hover:text-white flex items-center justify-center gap-1 pt-1">
          {showAll
            ? <><ChevronUp size={11} /> Скрыть</>
            : <><ChevronDown size={11} /> Ещё {project.bids.length - PREVIEW_COUNT} отклика</>
          }
        </button>
      )}
    </div>
  );
}

// ----- Main component -----
export function EmployerProjects({ projects, onRefresh }: EmployerProjectsProps) {
  const router = useRouter();
  const toast = useToast();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reviewModal, setReviewModal] = useState<{ projectId: number; title: string } | null>(null);

  const handleAcceptBid = async (bidId: number) => {
    try {
      await apiPost(`/api/bids/${bidId}/accept`);
      toast.success('Исполнитель назначен. Сделка защищена!');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const handleCompleteProject = async (projectId: number) => {
    try {
      await apiPost(`/api/projects/${projectId}/complete`);
      toast.success('Работа принята. Оцените исполнителя!');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const WIDGET_LIMIT = 3;
  const preview = projects.slice(0, WIDGET_LIMIT);

  return (
    <>
      {reviewModal && (
        <ReviewModal
          projectId={reviewModal.projectId}
          projectTitle={reviewModal.title}
          onClose={() => setReviewModal(null)}
          onSuccess={onRefresh}
        />
      )}

      <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-4 md:p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-sm uppercase tracking-wide">Мои Объекты</h3>
            {projects.length > 0 && (
              <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-brutal">
                {projects.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/projects" className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline">
              Все <ArrowUpRight size={12} />
            </Link>
            <Button
              size="sm"
              onClick={() => router.push('/projects/new')}
              className="h-7 px-3 gap-1 border-2 border-black font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <PlusCircle size={12} /> Новый
            </Button>
          </div>
        </div>

        {/* Project rows */}
        {preview.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-brutal text-center gap-3">
            <Briefcase size={32} className="text-gray-200 dark:text-gray-700" />
            <div>
              <p className="font-black text-sm text-gray-500">Объектов пока нет</p>
              <p className="text-xs font-bold text-gray-400">Создайте первый — специалисты увидят его в ленте</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              <Button size="sm" onClick={() => router.push('/projects/new')} className="gap-1 border-2 border-black text-xs">
                <PlusCircle size={12} /> Создать
              </Button>
              <Button variant="secondary" size="sm" onClick={() => router.push('/onboarding')} className="border-2 border-black text-xs">
                Через ИИ
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {preview.map(proj => {
              const st = STATUS_MAP[proj.status] ?? STATUS_MAP.open;
              const isExpanded = expanded === proj.id;
              const pendingBids = proj.bids.filter(b => b.status === 'pending').length;

              return (
                <div key={proj.id}
                  className={`border-2 border-black rounded-brutal overflow-hidden transition-all`}>
                  {/* Row */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : proj.id)}
                    className="w-full flex items-center gap-3 p-3 bg-surface-light dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    {/* Status dot */}
                    <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />

                    {/* Title */}
                    <span className="flex-1 font-black text-sm truncate">{proj.title}</span>

                    {/* Status label */}
                    <span className="text-[10px] font-black uppercase text-gray-500 shrink-0 hidden sm:inline">
                      {st.label}
                    </span>

                    {/* Bids badge */}
                    {pendingBids > 0 && (
                      <span className="text-[10px] font-black bg-brand text-black px-2 py-0.5 rounded-brutal shrink-0">
                        {pendingBids} новых
                      </span>
                    )}
                    {pendingBids === 0 && proj.bids.length > 0 && (
                      <span className="text-[10px] font-bold text-gray-400 shrink-0">
                        {proj.bids.length} откл.
                      </span>
                    )}

                    {/* Chevron */}
                    {isExpanded
                      ? <ChevronUp size={14} className="text-gray-400 shrink-0" />
                      : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
                  </button>

                  {/* Collapsible bids panel */}
                  {isExpanded && (
                    <div className="px-3 pb-3 bg-surface-light dark:bg-surface-dark">
                      <BidsPanel
                        project={proj}
                        onAccept={handleAcceptBid}
                        onReview={() => {
                          if (proj.status === 'in_progress') {
                            handleCompleteProject(proj.id);
                          } else {
                            setReviewModal({ projectId: proj.id, title: proj.title });
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {projects.length > WIDGET_LIMIT && (
          <Link href="/dashboard/projects"
            className="mt-3 w-full inline-flex items-center justify-center gap-1 text-xs font-bold text-gray-500 hover:text-brand transition-colors">
            Ещё {projects.length - WIDGET_LIMIT} объекта <ArrowUpRight size={11} />
          </Link>
        )}

      </div>
    </>
  );
}
