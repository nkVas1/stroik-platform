'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  HardHat, MapPin, CheckCircle, Star, Briefcase,
  Clock, ArrowLeft, User as UserIcon, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { apiGet } from '@/lib/api';

interface PublicProfile {
  id: number;
  fio: string;
  role: string;
  specialization?: string;
  location?: string;
  experience_years?: number;
  verification_level: number;
  completed_projects: number;
  member_since?: string;
}

const VERIFICATION_INFO = [
  { label: 'Не верифицирован', color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-300' },
  { label: 'Базовая верификация', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-400' },
  { label: 'Расширенная', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-400' },
  { label: 'Документы подтверждены (PRO)', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-500' },
];

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiGet<PublicProfile>(`/api/users/public/${id}`)
      .then(setProfile)
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <HardHat className="h-12 w-12 text-brand animate-pulse" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark">
        <SiteHeader showBackHome />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <UserIcon className="h-16 w-16 text-gray-300 mb-4" />
          <h1 className="text-3xl font-black uppercase mb-2">Профиль не найден</h1>
          <p className="text-gray-500 font-bold mb-6">Пользователь с ID {id} не существует.</p>
          <Button onClick={() => router.back()} variant="secondary" className="border-2 border-black gap-2">
            <ArrowLeft size={16} /> Назад
          </Button>
        </main>
      </div>
    );
  }

  const verif = VERIFICATION_INFO[profile.verification_level] ?? VERIFICATION_INFO[0];
  const isWorker = profile.role === 'worker';

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark">
      <SiteHeader showBackHome />

      <main className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8">

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Назад
        </Link>

        {/* Главная карточка профиля */}
        <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            {/* Аватар */}
            <div className="w-24 h-24 bg-brand border-2 border-black rounded-full flex items-center justify-center shrink-0 shadow-skeuo-inner-light">
              <UserIcon size={48} className="text-black" />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-black uppercase leading-tight">
                  {profile.fio}
                </h1>
                {/* Бейдж верификации */}
                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-brutal border-2 ${verif.bg} ${verif.border} ${verif.color}`}>
                  <ShieldCheck size={11} /> {verif.label}
                </span>
              </div>

              {profile.specialization && (
                <p className="text-base font-bold text-brand mb-2">{profile.specialization}</p>
              )}

              <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-xs font-bold text-gray-500">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {profile.location}
                  </span>
                )}
                {profile.experience_years != null && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {profile.experience_years} л. опыта
                  </span>
                )}
                {profile.member_since && (
                  <span className="flex items-center gap-1">
                    <Star size={12} /> На платформе с {profile.member_since}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-3xl font-black text-brand">{profile.completed_projects}</p>
            <p className="text-[10px] font-black uppercase text-gray-500 mt-1">Завершённых объектов</p>
          </div>
          <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-3xl font-black text-brand">{profile.verification_level}/3</p>
            <p className="text-[10px] font-black uppercase text-gray-500 mt-1">Уровень доверия</p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-3xl font-black">
              {profile.experience_years != null ? `${profile.experience_years}+` : '—'}
            </p>
            <p className="text-[10px] font-black uppercase text-gray-500 mt-1">Лет опыта</p>
          </div>
        </div>

        {/* Инфо-блок */}
        {isWorker && (
          <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-6">
            <h2 className="font-black uppercase text-sm mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-brand" /> О специалисте
            </h2>
            <ul className="space-y-2 text-sm font-bold">
              {profile.specialization && (
                <li className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500 shrink-0" />
                  <span>Специализация: <span className="text-brand">{profile.specialization}</span></span>
                </li>
              )}
              {profile.location && (
                <li className="flex items-center gap-2">
                  <MapPin size={14} className="text-brand shrink-0" />
                  <span>Работает в: {profile.location}</span>
                </li>
              )}
              {profile.experience_years != null && (
                <li className="flex items-center gap-2">
                  <Clock size={14} className="text-brand shrink-0" />
                  <span>Опыт: {profile.experience_years} лет</span>
                </li>
              )}
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className={`shrink-0 ${verif.color}`} />
                <span>{verif.label}</span>
              </li>
            </ul>
          </div>
        )}

        {/* Пустые отзывы (заглушка) */}
        <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-brutal p-6 text-center">
          <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="font-black text-gray-400 text-sm">Отзывы появятся после завершения первой сделки</p>
        </div>
      </main>
    </div>
  );
}
