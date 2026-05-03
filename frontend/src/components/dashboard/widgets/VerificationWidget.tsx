'use client';

import { useEffect, useState, useCallback } from 'react';
import { Shield, ChevronRight, CheckCircle, Circle } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

interface VerificationStatus {
  level: number;
  score: number;
  has_fio: boolean;
  has_location: boolean;
  has_portfolio: boolean;
  has_passport: boolean;
  verified_cases: number;
  next_step: string | null;
  steps: {
    fio_location: boolean;
    portfolio: boolean;
    passport: boolean;
  };
}

const STEPS = [
  { key: 'fio_location', label: 'ФИО + Город', href: '/dashboard/settings' },
  { key: 'portfolio',    label: 'Портфолио',     href: '/dashboard/portfolio' },
  { key: 'passport',     label: 'Паспорт (PRO)',   href: '/dashboard/verification' },
] as const;

export function VerificationWidget() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<VerificationStatus>('/api/verification/status');
      setStatus(data);
    } catch {
      // fallback: show empty state, don’t crash
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-5 animate-pulse">
        <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
        <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded mb-2" />
        <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    );
  }

  const score = status?.score ?? 0;
  const steps = status?.steps ?? { fio_location: false, portfolio: false, passport: false };

  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b-2 border-black">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-brand" />
          <span className="font-black text-xs uppercase">Верификация</span>
          <span className="ml-auto text-xs font-black text-brand">{score}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full border border-black/20 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 rounded-full ${
              score === 100 ? 'bg-green-500' : 'bg-brand'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="px-5 py-4 space-y-2.5">
        {STEPS.map(step => {
          const done = steps[step.key];
          return (
            <Link key={step.key} href={step.href}
              className="flex items-center gap-2.5 group hover:text-brand transition-colors">
              {done
                ? <CheckCircle size={14} className="text-green-500 shrink-0" />
                : <Circle size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />
              }
              <span className={`text-xs font-bold flex-1 ${
                done ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'
              }`}>{step.label}</span>
              {!done && <ChevronRight size={12} className="text-gray-300 group-hover:text-brand" />}
            </Link>
          );
        })}
      </div>

      {score < 100 && status?.next_step && (
        <div className="px-5 pb-5">
          <Link
            href={
              status.next_step === 'fio_location' ? '/dashboard/settings'
              : status.next_step === 'portfolio' ? '/dashboard/portfolio'
              : '/dashboard/verification'
            }
            className="block w-full text-center py-2 border-2 border-black rounded-brutal font-black text-xs uppercase bg-brand text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all"
          >
            Далее: {
              status.next_step === 'fio_location' ? 'ФИО + Город'
              : status.next_step === 'portfolio' ? 'Портфолио'
              : 'Паспорт'
            } →
          </Link>
        </div>
      )}

      {score === 100 && (
        <div className="px-5 pb-5">
          <div className="flex items-center gap-2 p-2.5 bg-green-50 dark:bg-green-900/20 border-2 border-green-400 rounded-brutal">
            <CheckCircle size={14} className="text-green-500" />
            <span className="text-xs font-black text-green-700 dark:text-green-300">Профиль полностью верифицирован</span>
          </div>
        </div>
      )}
    </div>
  );
}
