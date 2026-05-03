'use client';

import { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, ArrowUpRight, CheckCircle, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { apiGet, mediaUrl } from '@/lib/api';

interface PortfolioCase {
  id: number;
  title: string;
  photo_url?: string;
  is_verified: boolean;
}

const GRID_LIMIT = 6;

export function PortfolioWidget() {
  const [cases, setCases] = useState<PortfolioCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiGet<PortfolioCase[]>('/api/portfolio')
      .then(setCases)
      .catch(() => setCases([]))
      .finally(() => setIsLoading(false));
  }, []);

  const preview = cases.slice(0, GRID_LIMIT);

  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-black text-sm uppercase tracking-wide">Портфолио</h3>
          {!isLoading && cases.length > 0 && (
            <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-brutal">
              {cases.length}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/portfolio"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
        >
          Все кейсы <ArrowUpRight size={12} />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-brutal animate-pulse" />
          ))}
        </div>
      ) : preview.length === 0 ? (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[0, 1, 2].map(i => (
              <div key={i}
                className="aspect-square bg-surface-light dark:bg-surface-dark border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-brutal flex items-center justify-center"
              >
                <ImageIcon size={20} className="text-gray-300 dark:text-gray-600" />
              </div>
            ))}
          </div>
          <p className="text-xs font-bold text-gray-400 text-center mb-3">
            Добавьте первый кейс — это повысит доверие заказчиков
          </p>
        </>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {preview.map(c => (
            <Link key={c.id} href="/dashboard/portfolio"
              className="relative group aspect-square border-2 border-black rounded-brutal overflow-hidden block"
            >
              {c.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(c.photo_url)}
                  alt={c.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Briefcase size={20} className="text-gray-300" />
                </div>
              )}
              {c.is_verified && (
                <div className="absolute bottom-1 right-1 bg-green-500 border border-white rounded-full p-0.5">
                  <CheckCircle size={9} className="text-white" />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/dashboard/portfolio/new"
        className="w-full inline-flex items-center justify-center gap-2 border-2 border-dashed border-brand text-brand font-black text-xs uppercase py-2 rounded-brutal hover:bg-brand/10 transition-colors"
      >
        <Plus size={14} /> Добавить кейс
      </Link>
    </div>
  );
}
