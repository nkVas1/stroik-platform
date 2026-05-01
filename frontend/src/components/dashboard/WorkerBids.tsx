'use client';

import { CheckCircle, XCircle, Clock } from 'lucide-react';

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

export function WorkerBids({ bids }: WorkerBidsProps) {
  return (
    <div className="bg-white dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-skeuo-inner-light">
      <h3 className="font-black uppercase text-sm mb-4 border-b-2 border-black pb-2">Мои отклики</h3>
      <div className="space-y-4">
        {bids.length === 0 ? (
          <p className="text-xs font-bold text-gray-500">Вы ещё не откликались на заказы.</p>
        ) : (
          bids.map(bid => (
            <div key={bid.id} className="flex flex-col gap-2 border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{bid.project_title}</p>
                  <p className="text-xs opacity-60 font-bold mt-0.5">
                    {bid.project_budget ? `${bid.project_budget.toLocaleString('ru-RU')} ₽` : 'Договорная'}
                  </p>
                </div>
                {bid.status === 'accepted' ? (
                  <CheckCircle className="text-green-500 shrink-0" size={20} />
                ) : bid.status === 'rejected' ? (
                  <XCircle className="text-red-500 shrink-0" size={20} />
                ) : (
                  <Clock className="text-yellow-500 shrink-0 animate-pulse" size={20} />
                )}
              </div>
              {bid.status === 'accepted' && bid.project_status === 'in_progress' && (
                <div className="p-2 bg-green-50 dark:bg-green-900/30 border border-green-400 rounded-brutal">
                  <p className="text-[10px] font-black text-green-800 dark:text-green-200 uppercase">Сделка защищена</p>
                  <p className="text-xs font-medium text-green-700 dark:text-green-300 mt-0.5">Деньги зарезервированы. Приступайте к работе!</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
