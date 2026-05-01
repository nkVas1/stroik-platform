'use client';

import { CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

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
    icon: <CheckCircle size={18} className="text-green-500 shrink-0" />,
    label: 'Принят',
    cls: 'text-green-600',
  },
  rejected: {
    icon: <XCircle size={18} className="text-red-400 shrink-0" />,
    label: 'Отказ',
    cls: 'text-red-500',
  },
  pending: {
    icon: <Clock size={18} className="text-yellow-500 shrink-0 animate-pulse" />,
    label: 'Ожидает',
    cls: 'text-yellow-600',
  },
};

export function WorkerBids({ bids }: WorkerBidsProps) {
  const accepted = bids.filter(b => b.status === 'accepted').length;
  const pending = bids.filter(b => b.status === 'pending').length;

  return (
    <div className="bg-white dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-skeuo-inner-light">
      <h3 className="font-black uppercase text-sm mb-2 border-b-2 border-black pb-2">Мои отклики</h3>

      {bids.length > 0 && (
        <div className="flex gap-4 mb-4 text-xs font-bold">
          <span className="flex items-center gap-1 text-green-600">
            <TrendingUp size={12} /> {accepted} принято
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <Clock size={12} /> {pending} ожидает
          </span>
        </div>
      )}

      <div className="space-y-3">
        {bids.length === 0 ? (
          <p className="text-xs font-bold text-gray-400 py-4 text-center">
            Вы ещё не откликались ни на один заказ.<br/>Перейдите в ленту и откликнитесь!
          </p>
        ) : (
          bids.map(bid => {
            const st = BID_STATUS[bid.status as keyof typeof BID_STATUS] ?? BID_STATUS.pending;
            return (
              <div
                key={bid.id}
                className="flex flex-col gap-2 border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight">{bid.project_title}</p>
                    <p className="text-xs opacity-60 font-bold mt-0.5">
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

                {bid.status === 'accepted' && bid.project_status === 'in_progress' && (
                  <div className="p-2.5 bg-green-50 dark:bg-green-900/30 border border-green-400 rounded-brutal">
                    <p className="text-[10px] font-black text-green-700 dark:text-green-300 uppercase">Сделка защищена</p>
                    <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-0.5">Деньги зарезервированы. Приступайте к работе!</p>
                  </div>
                )}

                {bid.status === 'accepted' && bid.project_status === 'completed' && (
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-400 rounded-brutal">
                    <p className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase">Сделка завершена</p>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">Объект сдан. Оплата выплачена.</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
