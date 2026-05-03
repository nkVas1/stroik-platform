'use client';

import { Image as ImageIcon, ArrowLeft, Plus, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black uppercase mb-6 hover:text-brand transition-colors"
        >
          <ArrowLeft size={14} /> Вернуться
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand border-2 border-black rounded-brutal flex items-center justify-center">
              <ImageIcon size={20} className="text-black" />
            </div>
            <div>
              <h1 className="font-black text-2xl uppercase">Портфолио</h1>
              <p className="text-xs font-bold text-gray-500">Ваши кейсы и выполненные работы</p>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 bg-brand border-2 border-black rounded-brutal px-4 py-2 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            <Plus size={14} /> Добавить кейс
          </button>
        </div>

        {/* Пустое состояние */}
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-brutal text-center">
          <ImageIcon size={40} className="text-gray-200 dark:text-gray-700 mb-4" />
          <p className="font-black text-lg uppercase mb-2">Портфолио пустое</p>
          <p className="text-sm font-bold text-gray-500 max-w-sm mb-6">
            Добавьте первый кейс — фото, описание работы и договор. Заказчики доверяют исполнителям с документами.
          </p>
          <button className="inline-flex items-center gap-2 bg-brand border-2 border-black rounded-brutal px-6 py-3 font-black text-sm uppercase shadow-brutal-light hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            <Plus size={16} /> Добавить первый кейс
          </button>
        </div>

        {/* Объяснение что такое кейс на платформе */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '📸', title: 'Фото работ', desc: 'До 10 фотографий на кейс в форматах JPG/PNG' },
            { icon: '📄', title: 'Договор', desc: 'Прикрепите договор для подтверждения' },
            { icon: '⭐', title: 'Отзыв заказчика', desc: 'Подтверждённый отзыв повышает доверие' },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-4"
            >
              <span className="text-2xl">{item.icon}</span>
              <p className="font-black text-sm uppercase mt-2 mb-1">{item.title}</p>
              <p className="text-xs font-bold text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 p-3 bg-green-50 dark:bg-gray-800 border-2 border-green-400 rounded-brutal">
          <ShieldCheck size={16} className="text-green-500 shrink-0" />
          <p className="text-xs font-bold text-green-700 dark:text-green-300">
            Кейсы с прикреплёнными договорами верифицируются модераторами СТРОИК — это повышает доверие казаччиков к вами
          </p>
        </div>

      </div>
    </div>
  );
}
