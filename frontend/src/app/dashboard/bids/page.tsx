'use client';

import { useEffect, useState, useCallback } from 'react';
import { SendHorizonal, ArrowLeft, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

interface BidItem {
  id: number;
  project_title: string;
  project_budget?: number;
  project_status: string;
  status: string;
  created_at?: string;
}

const STATUS_TABS = [
  { id: 'all',      label: 'Все' },
  { id: 'pending',  label: 'Ожидают' },
  { id: 'accepted', label: 'Приняты' },
  { id: 'rejected', label: 'Отклонены' },
];

const BID_UI: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  accepted: {
    icon: <CheckCircle size={14} className="text-green-500" />,
    cls: 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700',
    label: 'Принят',
  },
  rejected: {
    icon: <XCircle size={14} className="text-red-400" />,
    cls: 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600',
    label: 'Отклонён',
  },
  pending: {
    icon: <Clock size={14} className="text-yellow-500 animate-pulse" />,
    cls: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700',
    label: 'Ожидает',
  },
};

export default function BidsPage() {
  const [bids, setBids] = useState<BidItem[]>([]);
  const [tab, setTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ bids?: BidItem[] }>('/api/users/me/dashboard_data');
      setBids(data.bids ?? []);
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = tab === 'all' ? bids : bids.filter(b => b.status === tab);
  const accepted = bids.filter(b => b.status === 'accepted').length;
  const pending = bids.filter(b => b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-4 md:p-8">
      <div className="max-w-3xl mx-auto">

        <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-black uppercase mb-6 hover:text-brand transition-colors">
          <ArrowLeft size={14} /> Вернуться
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
            <SendHorizonal size={20} className="text-black" />
          </div>
          <div>
            <h1 className="font-black text-2xl uppercase">Мои Отклики</h1>
            <p className="text-xs font-bold text-gray-500">История откликов на заказы</p>
          </div>
        </div>

        {/* Summary bar */}
        {bids.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: TrendingUp, label: 'Всего',     value: bids.length,  cls: 'text-gray-700 dark:text-gray-300' },
              { icon: CheckCircle, label: 'Принято',   value: accepted,    cls: 'text-green-600' },
              { icon: Clock,       label: 'Ожидают',  value: pending,     cls: 'text-yellow-600' },
            ].map(({ icon: Icon, label, value, cls }) => (
              <div key={label} className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-3 text-center">
                <Icon size={16} className={`mx-auto mb-1 ${cls}`} />
                <p className="font-black text-xl">{value}</p>
                <p className="text-[10px] font-black uppercase text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto mb-4">
          {STATUS_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 px-4 py-2 text-xs font-black uppercase rounded-brutal border-2 border-black transition-all ${
                tab === t.id ? 'bg-brand text-black' : 'bg-white dark:bg-gray-900 text-gray-500'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <SendHorizonal className="h-8 w-8 text-brand animate-pulse" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-brutal text-center gap-3">
            <SendHorizonal size={32} className="text-gray-200 dark:text-gray-700" />
            <div>
              <p className="font-black text-gray-500">Откликов нет</p>
              <p className="text-xs font-bold text-gray-400">
                {tab === 'all' ? 'Перейдите в ленту заказов и откликнитесь' : 'Нет откликов в этой категории'}
              </p>
            </div>
            {tab === 'all' && (
              <Link href="/dashboard" className="inline-flex items-center gap-2 bg-brand border-2 border-black rounded-brutal px-4 py-2 font-black text-xs uppercase shadow-brutal-light hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                Перейти к заказам
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(bid => {
              const ui = BID_UI[bid.status] ?? BID_UI.pending;
              return (
                <div key={bid.id}
                  className="flex items-center gap-3 p-4 bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">{bid.project_title}</p>
                    <p className="text-xs font-bold text-gray-400 mt-0.5">
                      {bid.project_budget
                        ? `${bid.project_budget.toLocaleString('ru-RU')} ₽`
                        : 'Договорная'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-brutal border shrink-0 ${ui.cls}`}>
                    {ui.icon} {ui.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
