'use client';

import { useState, useEffect, useRef } from 'react';
import { X, SendHorizonal, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { apiPost } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface BidModalProps {
  project: { id: number; title: string; employer_name: string } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function BidModal({ project, onClose, onSuccess }: BidModalProps) {
  const toast = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [letter, setLetter] = useState('');
  const [price, setPrice] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when project changes; include full `project` object in deps
  useEffect(() => {
    if (project) {
      setLetter('');
      setPrice('');
      setNegotiable(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  // ESC closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!project) return null;

  const canSubmit = letter.trim().length >= 10;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await apiPost(`/api/projects/${project.id}/bids`, {
        cover_letter: letter.trim(),
        price_offer: negotiable || !price ? null : Number(price),
      });
      toast.success('Отклик отправлен! Заказчик уведомлён.');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сети');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-bottom-4 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b-2 border-black/10">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase text-gray-400 mb-0.5">Отклик на объект</p>
            <h3 className="font-black text-base leading-tight truncate">{project.title}</h3>
            <p className="text-xs font-bold text-gray-500 mt-0.5">Зак.: {project.employer_name}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 rounded-brutal hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">
              Сообщение заказчику *
            </label>
            <textarea
              ref={textareaRef}
              placeholder="Здравствуйте! Опишите свой опыт, почему подходите и когда можете приступить..."
              value={letter}
              onChange={e => setLetter(e.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm resize-none focus:outline-none focus:border-brand transition-colors"
            />
            <div className="flex items-center justify-between mt-1">
              <p className={`text-[10px] font-bold ${
                letter.trim().length < 10 && letter.length > 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {letter.trim().length < 10 ? 'Минимум 10 символов' : '✓ Сообщение готово'}
              </p>
              <p className="text-[10px] font-bold text-gray-400">{letter.length}/1000</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">
              <span className="flex items-center gap-1"><Banknote size={11} /> Ваша цена</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="50 000"
                disabled={negotiable}
                value={price}
                onChange={e => setPrice(e.target.value)}
                className={`flex-1 px-4 py-3 border-2 border-black rounded-brutal bg-white dark:bg-gray-900 font-bold text-sm focus:outline-none focus:border-brand transition-colors ${
                  negotiable ? 'opacity-40' : ''
                }`}
              />
              <span className="font-black text-gray-500">₽</span>
            </div>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={negotiable}
                onChange={e => setNegotiable(e.target.checked)}
                className="w-4 h-4 border-2 border-black rounded accent-brand"
              />
              <span className="text-xs font-black text-gray-500">Договорная</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 pb-5">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="border-2 border-black font-black uppercase text-xs"
          >
            Отмена
          </Button>
          <Button
            size="sm"
            disabled={!canSubmit || isSubmitting}
            onClick={handleSubmit}
            className="gap-2 border-2 border-black font-black uppercase text-xs bg-brand text-black"
          >
            <SendHorizonal size={13} />
            {isSubmitting ? 'Отправка...' : 'Отправить отклик'}
          </Button>
        </div>
      </div>
    </div>
  );
}
