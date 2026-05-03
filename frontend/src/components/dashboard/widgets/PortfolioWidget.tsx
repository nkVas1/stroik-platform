'use client';

import { Image as ImageIcon, Plus, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export function PortfolioWidget() {
  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-sm uppercase tracking-wide">Портфолио</h3>
        <Link
          href="/dashboard/portfolio"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
        >
          Все кейсы <ArrowUpRight size={12} />
        </Link>
      </div>

      {/* Плейсхолдер — заменяется реальными кейсами после Phase 2 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="aspect-square bg-surface-light dark:bg-surface-dark border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-brutal flex items-center justify-center"
          >
            <ImageIcon size={20} className="text-gray-300 dark:text-gray-600" />
          </div>
        ))}
      </div>

      <Link
        href="/dashboard/portfolio"
        className="w-full inline-flex items-center justify-center gap-2 border-2 border-dashed border-brand text-brand font-black text-xs uppercase py-2 rounded-brutal hover:bg-brand/10 transition-colors"
      >
        <Plus size={14} /> Добавить кейс
      </Link>
    </div>
  );
}
