'use client';

import { useRef } from 'react';
import {
  BarChart3, SendHorizonal, Layers, Rss, Image, ShieldCheck,
  CreditCard, Zap, Users, TrendingUp, Lock, Star,
  Plus, X,
} from 'lucide-react';
import type { BlockDef } from '@/lib/useDashboardBlocks';

const ICON_MAP: Record<string, React.ElementType> = {
  BarChart3, SendHorizonal, Layers, Rss, Image, ShieldCheck,
  CreditCard, Zap, Users, TrendingUp, Lock, Star,
};

interface Props {
  blocks: BlockDef[];
  visibleIds: string[];
  onToggle: (id: string) => void;
}

export function BlocksRibbon({ blocks, visibleIds, onToggle }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    // Only hijack when there\'s actual horizontal overflow to scroll
    const hasOverflow = el.scrollWidth > el.clientWidth;
    if (!hasOverflow) return;
    e.preventDefault();
    el.scrollLeft += e.deltaY + e.deltaX;
  };

  return (
    <div className="relative">
      {/* fade edges hint */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface-light dark:from-surface-dark to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface-light dark:from-surface-dark to-transparent z-10" />

      <div
        ref={scrollRef}
        onWheel={handleWheel}
        className="flex gap-2 overflow-x-auto pb-1 px-2 scrollbar-hide snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {blocks.map((block) => {
          const Icon = ICON_MAP[block.icon] ?? BarChart3;
          const active = visibleIds.includes(block.id);
          return (
            <button
              key={block.id}
              onClick={() => onToggle(block.id)}
              title={block.description}
              className={`
                snap-start shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5
                rounded-brutal border-2 border-black font-black text-xs uppercase
                transition-all duration-150 select-none
                ${
                  active
                    ? 'bg-brand text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-surface-cardLight dark:bg-surface-cardDark text-gray-500 hover:text-black hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <Icon size={12} className="shrink-0" />
              <span>{block.label}</span>
              {active
                ? <X size={10} className="ml-0.5 opacity-60" />
                : <Plus size={10} className="ml-0.5 opacity-40" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
