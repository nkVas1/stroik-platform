'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  HardHat, MapPin, CheckCircle, Star, Briefcase,
  Clock, ArrowLeft, User as UserIcon, ShieldCheck, MessageSquare
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

interface ReviewItem {
  id: number;
  project_id: number;
  project_title: string;
  reviewer_name: string;
  rating: number;
  text?: string;
  created_at?: string;
}

const VERIFICATION_INFO = [
  { label: 'Не верифицирован', color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-300' },
  { label: 'Базовая', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/30', border: 'border-yellow-400' },
  { label: 'Расширенная', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-400' },
  { label: 'Документы (PRO)', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-500' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={14}
          className={n <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
        />
      ))}
      <span className="ml-1 text-xs font-black text-amber-600">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.allSettled([
      apiGet<PublicProfile>(`/api/users/public/${id}`),
      apiGet<ReviewItem[]>(`/api/reviews/${id}`),
    ]).then(([profileRes, reviewsRes]) => {
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value);
      else setNotFound(true);
      if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value);
    }).finally(() => setIsLoading(false));
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
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark">
      <SiteHeader showBackHome />

      <main className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-8">
        <Link
          href="javascript:history.back()"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Назад
        </Link>

        {/* Профиль */}
        <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <div className="w-24 h-24 bg-brand border-2 border-black rounded-full flex items-center justify-center shrink-0">
              <UserIcon size={48} className="text-black" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-black uppercase leading-tight">{profile.fio}</h1>
                <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-brutal border-2 ${verif.bg} ${verif.border} ${verif.color}`}>
                  <ShieldCheck size={11} /> {verif.label}
                </span>
              </div>
              {profile.specialization && (
                <p className="text-base font-bold text-brand mb-2">{profile.specialization}</p>
              )}
              {avgRating !== null && (
                <div className="mb-2">
                  <StarRating rating={avgRating} />
                  <span className="text-xs font-bold text-gray-500 ml-1">{reviews.length} отзыв{reviews.length === 1 ? '' : reviews.length < 5 ? 'a' : 'ов'}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-xs font-bold text-gray-500">
                {profile.location && <span className="flex items-center gap-1"><MapPin size={12} /> {profile.location}</span>}
                {profile.experience_years != null && <span className="flex items-center gap-1"><Clock size={12} /> {profile.experience_years} л. опыта</span>}
                {profile.member_since && <span className="flex items-center gap-1"><Star size={12} /> С {profile.member_since}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { val: profile.completed_projects, label: 'Объектов' },
            { val: `${profile.verification_level}/3`, label: 'Доверие' },
            { val: avgRating !== null ? avgRating.toFixed(1) : '—', label: 'Рейтинг' },
          ].map(({ val, label }) => (
            <div key={label} className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 text-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-3xl font-black text-brand">{val}</p>
              <p className="text-[10px] font-black uppercase text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* О специалисте */}
        {isWorker && (
          <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] mb-6">
            <h2 className="font-black uppercase text-sm mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-brand" /> О специалисте
            </h2>
            <ul className="space-y-2 text-sm font-bold">
              {profile.specialization && (
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500 shrink-0" /> {profile.specialization}</li>
              )}
              {profile.location && (
                <li className="flex items-center gap-2"><MapPin size={14} className="text-brand shrink-0" /> {profile.location}</li>
              )}
              {profile.experience_years != null && (
                <li className="flex items-center gap-2"><Clock size={14} className="text-brand shrink-0" /> {profile.experience_years} лет опыта</li>
              )}
              <li className="flex items-center gap-2"><ShieldCheck size={14} className={`shrink-0 ${verif.color}`} /> {verif.label}</li>
            </ul>
          </div>
        )}

        {/* Отзывы */}
        <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="font-black uppercase text-sm mb-4 flex items-center gap-2">
            <MessageSquare size={16} className="text-brand" /> Отзывы ({reviews.length})
          </h2>

          {reviews.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-brutal">
              <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="font-black text-gray-400 text-sm">Отзывов пока нет</p>
              <p className="text-xs text-gray-400 mt-1">Появятся после завершения первой сделки</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-brutal bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-black text-sm">{r.reviewer_name}</p>
                      <p className="text-[10px] font-bold text-gray-400">{r.project_title}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StarRating rating={r.rating} />
                      {r.created_at && <span className="text-[10px] text-gray-400 font-bold">{r.created_at}</span>}
                    </div>
                  </div>
                  {r.text && (
                    <p className="text-sm italic text-gray-600 dark:text-gray-300 border-l-2 border-brand pl-3 mt-2">
                      &ldquo;{r.text}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
