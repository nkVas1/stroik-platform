'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, ArrowUpRight, CheckCircle, Circle } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

const STEPS = [
  { lvl: 1, label: 'ФИО + Город', hint: 'Заполните профиль' },
  { lvl: 2, label: 'Портфолио', hint: 'Добавьте кейс и специализацию' },
  { lvl: 3, label: 'Паспорт (PRO)', hint: 'Загрузите документ' },
];

export function VerificationWidget() {
  const [level, setLevel] = useState(0);

  useEffect(() => {
    apiGet<{ level?: number; verification_level?: number }>('/api/verification/status')
      .then(s => setLevel(s.level ?? 0))
      .catch(() =>
        apiGet<{ verification_level?: number }>('/api/users/me')
          .then(me => setLevel(me.verification_level ?? 0))
          .catch(() => {})
      );
  }, []);

  const percent = Math.round((level / 3) * 100);
  const nextStep = STEPS.find(s => s.lvl > level);

  return (
    <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black text-sm uppercase tracking-wide">Верификация</h3>
        <ShieldCheck size={16} className={level >= 3 ? 'text-green-500' : 'text-gray-400'} />
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs font-bold uppercase mb-1">
          <span>Доверие</span>
          <span className={level >= 3 ? 'text-green-600' : 'text-brand'}>{percent}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-800 h-2.5 rounded-full border border-black overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${
              level >= 3 ? 'bg-green-500' : level >= 1 ? 'bg-brand' : 'bg-gray-400'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="space-y-1.5 mb-3">
        {STEPS.map(step => {
          const done = level >= step.lvl;
          return (
            <li key={step.lvl} className="flex items-center gap-2">
              {done
                ? <CheckCircle size={14} className="text-green-500 shrink-0" />
                : <Circle size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />}
              <span className={`text-xs font-bold ${
                done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>

      {nextStep ? (
        <Link
          href="/dashboard/verification"
          className="w-full inline-flex items-center justify-center gap-1 text-xs font-bold text-brand border-2 border-dashed border-brand py-2 rounded-brutal hover:bg-brand/10 transition-colors"
        >
          Далее: {nextStep.label} <ArrowUpRight size={12} />
        </Link>
      ) : (
        <div className="flex items-center justify-center gap-1.5 text-green-600 text-xs font-black uppercase">
          <CheckCircle size={14} /> Профиль полностью верифицирован
        </div>
      )}
    </div>
  );
}
