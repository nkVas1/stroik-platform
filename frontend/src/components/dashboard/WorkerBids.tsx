'use client';

import { CheckCircle, XCircle, Clock, TrendingUp, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

interface BidItem {
  id: number;
  project_title: string;
  project_budget?: number;
  project_status: string;
  status: string;
}

interface WorkerBidsProps {
  bids: BidItem[];
}

const BID_STATUS = {
  accepted: {
    icon: <CheckCircle size={16} className="text-green-500 shrink-0" />,
    label: 'Принят',
    cls: 'text-green-600',
  },
  rejected: {
    icon: <XCircle size={16} className="text-red-400 shrink-0" />,
    label: 'Отказ',
    cls: 'text-red-500',
  },
  pending: {
    icon: <Clock size={16} className="text-yellow-500 shrink-0 animate-pulse" />,
    label: 'Ожидает',
    cls: 'text-yellow-600',
  },
};

export function WorkerBids({ bids }: WorkerBidsProps) {
  const accepted = bids.filter(b => b.status === 'accepted').length;
  const pending = bids.filter(b => b.status === 'pending').length;

  // Show max 4 in widget, link to full page for the rest
  const preview = bids.slice(0, 4);

  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-4 md:p-5 shadow-brutal-light dark:shadow-brutal-dark">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-sm uppercase tracking-wide">Мои отклики</h3>
        <Link
          href="/dashboard/bids"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
        >
          Все отклики <ArrowUpRight size={12} />
        </Link>
      </div>

      {bids.length > 0 && (
        <div className="flex gap-4 mb-3 text-xs font-bold">
          <span className="flex items-center gap-1 text-green-600">
            <TrendingUp size={11} /> {accepted} принято
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <Clock size={11} /> {pending} ожидает
          </span>
        </div>
      )}

      <div className="space-y-2.5">
        {preview.length === 0 ? (
          <p className="text-xs font-bold text-gray-400 py-6 text-center">
            Вы ещё не откликались ни на один заказ.<br/>Перейдите в ленту и откликнитесь!
          </p>
        ) : (
          preview.map(bid => {
            const st = BID_STATUS[bid.status as keyof typeof BID_STATUS] ?? BID_STATUS.pending;
            return (
              <div
                key={bid.id}
                className="flex items-start justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2.5 last:border-0 last:pb-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight truncate">{bid.project_title}</p>
                  <p className="text-xs text-gray-400 font-bold mt-0.5">
                    {bid.project_budget
                      ? `${bid.project_budget.toLocaleString('ru-RU')} ₽`
                      : 'Договорная'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {st.icon}
                  <span className={`text-[10px] font-black uppercase ${st.cls}`}>{st.label}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {bids.length > 4 && (
        <Link
          href="/dashboard/bids"
          className="mt-3 w-full inline-flex items-center justify-center gap-1 text-xs font-bold text-gray-500 hover:text-brand transition-colors"
        >
          Ещё {bids.length - 4} откликов <ArrowUpRight size={11} />
        </Link>
      )}
    </div>
  );
}
