'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, MapPin, Star, ShieldCheck, CheckCircle,
  Users, SlidersHorizontal, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { apiGet } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Worker {
  id: number;
  fio: string;
  specialization?: string;
  location?: string;
  entity_type?: string;
  experience_years?: number;
  verification_level: number;
  avg_rating?: number;
  reviews_count: number;
  completed_count: number;
  portfolio_count: number;
  first_photo?: string;
  bio?: string;
  member_since?: string;
}

interface WorkersResponse {
  total: number;
  limit: number;
  offset: number;
  workers: Worker[];
}

const ENTITY_LABELS: Record<string, string> = {
  physical: 'Самозанятый',
  legal: 'ООО / Организация',
  individual: 'Самозанятый',
  ie: 'ИП',
  brigade: 'Бригада',
  company: 'ООО / Организация',
  unknown: '',
};

const VERIFICATION_LEVELS = [
  { value: '0', label: 'Все' },
  { value: '1', label: 'Профиль заполнен' },
  { value: '2', label: 'Кейсы проверены' },
  { value: '3', label: 'Документы проверены' },
];

const VERIFICATION_BADGE: Record<number, { label: string; variant: 'success' | 'info' | 'warning' | 'outline' }> = {
  1: { label: 'Профиль', variant: 'info' },
  2: { label: 'Кейсы', variant: 'success' },
  3: { label: 'Документы', variant: 'warning' },
};

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

function WorkerCard({ worker }: { worker: Worker }) {
  const initials = worker.fio
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

  const badge = VERIFICATION_BADGE[worker.verification_level];
  const entityLabel = ENTITY_LABELS[worker.entity_type ?? ''] || '';

  return (
    <div className="flex flex-col bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark overflow-hidden group hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150">
      {/* Top photo or color strip */}
      <div className="relative h-28 bg-gray-100 dark:bg-gray-800 border-b-2 border-black overflow-hidden">
        {worker.first_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={worker.first_photo}
            alt={worker.fio}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-14 h-14 rounded-brutal border-2 border-black bg-brand flex items-center justify-center font-black text-2xl text-black">
              {initials}
            </div>
          </div>
        )}
        {/* Verification badge overlay */}
        {badge && (
          <div className="absolute top-2 right-2">
            <Badge variant={badge.variant} size="sm">
              <ShieldCheck size={8} /> {badge.label}
            </Badge>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div>
          <h3 className="font-black text-sm leading-tight">{worker.fio}</h3>
          {worker.specialization && (
            <p className="text-xs font-black text-brand uppercase mt-0.5">{worker.specialization}</p>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {worker.location && (
            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-0.5">
              <MapPin size={9} /> {worker.location}
            </span>
          )}
          {entityLabel && (
            <span className="text-[10px] font-black uppercase text-gray-400">{entityLabel}</span>
          )}
          {worker.experience_years != null && (
            <span className="text-[10px] font-bold text-gray-400">{worker.experience_years} л. опыта</span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mt-auto pt-2 border-t-2 border-black/10">
          <div className="flex items-center gap-1">
            {worker.avg_rating ? (
              <>
                <StarRow rating={worker.avg_rating} />
                <span className="text-[10px] font-black">{worker.avg_rating.toFixed(1)}</span>
              </>
            ) : (
              <span className="text-[10px] font-bold text-gray-400">Нет оценок</span>
            )}
          </div>
          <span className="text-[10px] font-bold text-gray-400 flex items-center gap-0.5">
            <CheckCircle size={9} className="text-green-500" /> {worker.completed_count} выполнено
          </span>
        </div>

        <Link href={`/profile/${worker.id}`}>
          <Button size="sm" className="w-full mt-2 text-xs font-black uppercase">
            Посмотреть профиль
          </Button>
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-brutal overflow-hidden animate-pulse">
      <div className="h-28 bg-gray-100 dark:bg-gray-800" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded w-full" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-brutal" />
      </div>
    </div>
  );
}

const LIMIT = 20;

export default function FindPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [spec, setSpec] = useState('');
  const [city, setCity] = useState('');
  const [minLevel, setMinLevel] = useState('0');
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search params
  const [debouncedSpec, setDebouncedSpec] = useState('');
  const [debouncedCity, setDebouncedCity] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSpec(spec), 400);
    return () => clearTimeout(t);
  }, [spec]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCity(city), 400);
    return () => clearTimeout(t);
  }, [city]);

  const buildUrl = useCallback((off: number) => {
    const params = new URLSearchParams();
    if (debouncedSpec) params.set('specialization', debouncedSpec);
    if (debouncedCity) params.set('city', debouncedCity);
    params.set('min_level', minLevel);
    params.set('limit', String(LIMIT));
    params.set('offset', String(off));
    return `/api/workers?${params.toString()}`;
  }, [debouncedSpec, debouncedCity, minLevel]);

  // Initial / filter change load
  useEffect(() => {
    setLoading(true);
    setOffset(0);
    apiGet<WorkersResponse>(buildUrl(0))
      .then((data) => {
        setWorkers(data.workers);
        setTotal(data.total);
      })
      .catch(() => {
        setWorkers([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [buildUrl]);

  const loadMore = () => {
    const nextOffset = offset + LIMIT;
    setLoadingMore(true);
    apiGet<WorkersResponse>(buildUrl(nextOffset))
      .then((data) => {
        setWorkers((prev) => [...prev, ...data.workers]);
        setOffset(nextOffset);
      })
      .finally(() => setLoadingMore(false));
  };

  const hasMore = workers.length < total;

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      {/* ===== HEADER ===== */}
      <div className="border-b-2 border-black bg-surface-cardLight dark:bg-surface-cardDark">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
          <div className="flex items-center gap-3 mb-1">
            <Users size={20} className="text-brand" />
            <h1 className="font-black text-xl uppercase">Каталог специалистов</h1>
          </div>
          <p className="text-xs font-bold text-gray-500">
            Найдите проверенного подрядчика для вашего проекта
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6">
        {/* ===== SEARCH + FILTERS ===== */}
        <div className="mb-6 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <Input
                placeholder="Специализация (плитка, кровля, фасад...)"
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowFilters((v) => !v)}
              className="gap-2 shrink-0"
            >
              <SlidersHorizontal size={14} />
              Фильтры
              {showFilters && <ChevronDown size={12} className="rotate-180 transition-transform" />}
              {!showFilters && <ChevronDown size={12} className="transition-transform" />}
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-3 p-4 border-2 border-black rounded-brutal bg-surface-cardLight dark:bg-surface-cardDark">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[10px] font-black uppercase mb-1">Город</label>
                <div className="relative">
                  <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <Input
                    placeholder="Москва, СПб..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="pl-8 h-10 text-xs"
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-black uppercase mb-1">Уровень верификации</label>
                <div className="flex gap-1 flex-wrap">
                  {VERIFICATION_LEVELS.map((lvl) => (
                    <button
                      key={lvl.value}
                      onClick={() => setMinLevel(lvl.value)}
                      className={cn(
                        'text-[10px] font-black uppercase px-2.5 py-1 rounded-brutal border-2 transition-colors',
                        minLevel === lvl.value
                          ? 'border-brand bg-brand text-black'
                          : 'border-black bg-transparent hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Result count */}
          {!loading && (
            <p className="text-xs font-bold text-gray-500">
              {total > 0
                ? `Найдено: ${total} специалист${total === 1 ? '' : total < 5 ? 'а' : 'ов'}`
                : 'Никто не найден'}
            </p>
          )}
        </div>

        {/* ===== GRID ===== */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : workers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Users size={48} className="text-gray-200" />
            <p className="font-black text-lg uppercase text-gray-400">Специалисты не найдены</p>
            <p className="text-xs font-bold text-gray-400 text-center max-w-xs">
              Попробуйте изменить фильтры или снять ограничения по верификации
            </p>
            <Button variant="outline" onClick={() => { setSpec(''); setCity(''); setMinLevel('0'); }}>
              Сбросить фильтры
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {workers.map((w) => <WorkerCard key={w.id} worker={w} />)}
            </div>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  isLoading={loadingMore}
                  className="gap-2"
                >
                  Загрузить ещё ({total - workers.length} осталось)
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
