'use client';

import { useState } from 'react';
import { Briefcase, CheckCircle, XCircle, PlusCircle, Star, ExternalLink } from 'lucide-react';
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

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open: { label: 'Идёт поиск', cls: 'bg-green-100 text-green-800 border-green-600' },
  in_progress: { label: 'В работе', cls: 'bg-orange-100 text-orange-800 border-orange-500' },
  completed: { label: 'Завершён', cls: 'bg-gray-100 text-gray-600 border-gray-400' },
  cancelled: { label: 'Отменён', cls: 'bg-red-100 text-red-600 border-red-400' },
};

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
      const msg = err instanceof Error ? err.message : 'Ошибка';
      toast.error(msg);
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
          {/* Звёздный рейтинг */}
          <div>
            <label className="text-xs font-black uppercase text-gray-500 mb-2 block">Оценка</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1 transition-transform hover:scale-125"
                >
                  <Star
                    size={28}
                    className={n <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                  />
                </button>
              ))}
              <span className="ml-2 font-black text-lg self-center">{hover || rating}.0</span>
            </div>
          </div>
          {/* Комментарий */}
          <div>
            <label className="text-xs font-black uppercase text-gray-500 mb-2 block">Комментарий</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Расскажите о работе специалиста..."
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-medium text-sm resize-none focus:outline-none focus:border-brand transition-colors"
            />
          </div>
          <Button type="submit" disabled={isSaving} className="w-full h-12 border-2 border-black font-black uppercase gap-2">
            <Star size={16} /> {isSaving ? 'Отправляем...' : 'Опубликовать отзыв'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function EmployerProjects({ projects, onRefresh }: EmployerProjectsProps) {
  const router = useRouter();
  const toast = useToast();
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
    if (!window.confirm('Подтвердите завершение работы. Средства будут переведены исполнителю.')) return;
    try {
      await apiPost(`/api/projects/${projectId}/complete`);
      toast.success('Работа принята. Оцените исполнителя — оставьте отзыв!');
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка');
    }
  };

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

      <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-mix-light p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black uppercase flex items-center gap-2">
            <Briefcase className="text-brand" /> Мои Объекты
          </h2>
          <Button
            size="sm"
            onClick={() => router.push('/projects/new')}
            className="gap-2 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-black uppercase text-xs"
          >
            <PlusCircle size={14} /> Новый объект
          </Button>
        </div>

        <div className="grid gap-6">
          {projects.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-brutal text-center flex flex-col items-center gap-4">
              <Briefcase className="h-10 w-10 text-gray-300" />
              <div>
                <p className="font-black text-gray-500">У вас пока нет объектов</p>
                <p className="text-xs font-bold text-gray-400 mt-1">Создайте первый — специалисты увидят его в ленте</p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <Button onClick={() => router.push('/projects/new')} size="sm" className="gap-2 border-2 border-black">
                  <PlusCircle size={14} /> Создать вручную
                </Button>
                <Button variant="secondary" onClick={() => router.push('/onboarding')} size="sm" className="border-2 border-black">
                  Через ИИ-ассистента
                </Button>
              </div>
            </div>
          ) : (
            projects.map(proj => {
              const statusInfo = STATUS_LABELS[proj.status] || { label: proj.status, cls: 'bg-gray-100 text-gray-600 border-gray-400' };
              const acceptedBid = proj.bids.find(b => b.status === 'accepted');

              return (
                <div key={proj.id} className="border-2 border-black rounded-brutal overflow-hidden">
                  <div className="bg-black text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold truncate pr-4">{proj.title}</h3>
                    <span className={`text-xs font-black uppercase px-3 py-1 rounded-full border-2 shrink-0 ${statusInfo.cls}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="p-5 bg-surface-light dark:bg-surface-dark">
                    {/* Баннер активной сделки */}
                    {proj.status === 'in_progress' && (
                      <div className="mb-5 p-4 bg-orange-50 dark:bg-orange-900/30 border-2 border-brand rounded-brutal flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <p className="font-black">Сделка активна</p>
                          <p className="text-xs font-bold opacity-70">Эскроу-защита работает. Нажмите «Принять», когда работа сдана.</p>
                        </div>
                        <Button variant="primary" size="sm" onClick={() => handleCompleteProject(proj.id)} className="shrink-0">
                          Принять работу
                        </Button>
                      </div>
                    )}

                    {/* Баннер завершённого проекта с кнопкой отзыва */}
                    {proj.status === 'completed' && acceptedBid && (
                      <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/30 border-2 border-green-500 rounded-brutal flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <p className="font-black text-green-800 dark:text-green-200">Объект завершён</p>
                          <p className="text-xs font-bold opacity-70">Оцените работу — это поможет другим заказчикам</p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setReviewModal({ projectId: proj.id, title: proj.title })}
                          className="shrink-0 border-2 border-black gap-1"
                        >
                          <Star size={13} /> Оставить отзыв
                        </Button>
                      </div>
                    )}

                    <h4 className="text-sm font-black uppercase text-gray-500 mb-3 border-b-2 border-gray-200 dark:border-gray-700 pb-2">
                      Отклики ({proj.bids.length})
                    </h4>

                    <div className="space-y-3">
                      {proj.bids.length === 0 ? (
                        <p className="text-xs font-bold text-gray-400 py-4 text-center">
                          Пока никто не откликнулся...
                        </p>
                      ) : (
                        proj.bids.map(bid => (
                          <div
                            key={bid.id}
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-brutal bg-white dark:bg-gray-800 gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-black text-base leading-tight">{bid.worker_name}</p>
                                {bid.worker_id && (
                                  <Link
                                    href={`/profile/${bid.worker_id}`}
                                    className="text-brand hover:opacity-70 transition-opacity"
                                    title="Профиль специалиста"
                                  >
                                    <ExternalLink size={13} />
                                  </Link>
                                )}
                              </div>
                              <p className="text-xs font-bold text-brand uppercase mt-0.5">{bid.worker_spec || 'Универсал'}</p>
                              {bid.cover_letter && (
                                <p className="text-sm italic opacity-70 mt-2 line-clamp-2">&ldquo;{bid.cover_letter}&rdquo;</p>
                              )}
                              {bid.price_offer != null && (
                                <p className="text-sm font-black text-brand mt-1">{bid.price_offer.toLocaleString('ru-RU')} ₽</p>
                              )}
                            </div>

                            <div className="shrink-0">
                              {proj.status === 'open' && bid.status === 'pending' ? (
                                <Button size="sm" onClick={() => handleAcceptBid(bid.id)} className="font-bold uppercase">
                                  Нанять
                                </Button>
                              ) : (
                                <span className={`inline-flex items-center gap-1 text-xs font-black uppercase px-3 py-1 rounded-brutal border-2 ${
                                  bid.status === 'accepted'
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                }`}>
                                  {bid.status === 'accepted'
                                    ? <><CheckCircle size={12} /> Назначен</>
                                    : <><XCircle size={12} /> Отказ</>
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
