'use client';

import { ShieldCheck, ArrowLeft, CheckCircle, Circle, Upload, FileText, User } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  {
    lvl: 1,
    icon: User,
    title: 'Базовая (ФИО + Город)',
    desc: 'Заполните профиль: имя, специализация, город',
    action: 'Перейти в профиль',
    href: '/dashboard',
  },
  {
    lvl: 2,
    icon: FileText,
    title: 'Расширенная',
    desc: 'Добавьте кейс работы с фото и описанием',
    action: 'Добавить кейс',
    href: '/dashboard/portfolio',
  },
  {
    lvl: 3,
    icon: Upload,
    title: 'Паспорт (PRO)',
    desc: 'Загрузите фото паспорта — доверие 100%',
    action: 'Загрузить документ',
    href: '/dashboard',
  },
];

export default function VerificationPage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-4 md:p-8">
      <div className="max-w-2xl mx-auto">

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black uppercase mb-6 hover:text-brand transition-colors"
        >
          <ArrowLeft size={14} /> Вернуться
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
            <ShieldCheck size={20} className="text-black" />
          </div>
          <div>
            <h1 className="font-black text-2xl uppercase">Верификация</h1>
            <p className="text-xs font-bold text-gray-500">Повысьте уровень доверия и получайте больше заказов</p>
          </div>
        </div>

        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            // placeholder — done state will be driven by real profile level in Phase 2
            const done = false;
            return (
              <div
                key={step.lvl}
                className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 shadow-brutal-light dark:shadow-brutal-dark flex items-start gap-4"
              >
                <div className={`w-10 h-10 shrink-0 rounded-brutal border-2 border-black flex items-center justify-center font-black text-sm ${
                  done ? 'bg-green-500 text-white' : 'bg-surface-light dark:bg-surface-dark'
                }`}>
                  {done ? <CheckCircle size={18} /> : <span>{i + 1}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={14} className={done ? 'text-green-500' : 'text-gray-400'} />
                    <h3 className="font-black text-sm uppercase">{step.title}</h3>
                    {done && (
                      <span className="text-[10px] font-black uppercase text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-brutal">Готово</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-500 mb-3">{step.desc}</p>
                  {!done && (
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-1.5 bg-brand border-2 border-black rounded-brutal px-4 py-1.5 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    >
                      {step.action}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-amber-50 dark:bg-gray-800 border-2 border-brand rounded-brutal">
          <p className="text-xs font-black uppercase text-amber-700 dark:text-brand mb-1">Почему это важно?</p>
          <p className="text-xs font-bold text-gray-500">
            Исполнители с полной верификацией получают в 3× больше заявок, стоят выше в поиске и вызывают больше доверия у заказчиков.
          </p>
        </div>

      </div>
    </div>
  );
}
