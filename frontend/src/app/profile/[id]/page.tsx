'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, MapPin, Star, ShieldCheck, Briefcase,
  CheckCircle, MessageSquare, Award, User,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { apiGet } from '@/lib/api';

interface PortfolioCase {
  id: number;
  title: string;
  description?: string;
  photo_url?: string;
  is_verified: boolean;
}

interface Review {
  id: number;
  rating: number;
  text?: string;
  reviewer_name: string;
  created_at: string;
}

interface WorkerProfile {
  id: number;
  fio: string;
  specialization?: string;
  location?: string;
  entity_type?: string;
  experience_years?: number;
  verification_level: number;
  bio?: string;
  avg_rating?: number;
  reviews_count?: number;
  completed_count?: number;
  portfolio: PortfolioCase[];
  reviews: Review[];
}

const ENTITY_LABELS: Record<string, string> = {
  individual: 'Самозанятый',
  ie: 'ИП',
  brigade: 'Бригада',
  company: 'ООО / Организация',
};

function StarRow({ rating, max = 5, size = 14 }: { rating: number; max?: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

function VerificationBadge({ level }: { level: number }) {
  if (level === 0) return null;
  const cfg = [
    null,
    { label: 'Профиль проверен', cls: 'border-blue-500 bg-blue-50 text-blue-700' },
    { label: 'Кейсы проверены', cls: 'border-green-500 bg-green-50 text-green-700' },
    { label: 'Документы проверены', cls: 'border-brand bg-amber-50 text-amber-700' },
  ];
  const c = cfg[Math.min(level, 3)];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-brutal border ${c.cls}`}>
      <ShieldCheck size={10} /> {c.label}
    </span>
  );
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiGet<WorkerProfile>(`/api/users/${id}/profile`)
      .then(setProfile)
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface-light dark:bg-surface-dark">
        <User size={48} className="text-gray-200" />
        <p className="font-black text-xl uppercase">Профиль не найден</p>
        <Link href="/dashboard" className="text-sm font-bold text-brand hover:underline">Вернуться</Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-brutal" />
          <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-brutal border-2 border-gray-200 dark:border-gray-700" />
          <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-brutal border-2 border-gray-200 dark:border-gray-700" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-brutal border-2 border-gray-200 dark:border-gray-700" />)}
          </div>
        </div>
      </div>
    );
  }

  const initials = profile.fio.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">

        <Link href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-black uppercase mb-6 hover:text-brand transition-colors">
          <ArrowLeft size={14} /> Назад
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ===== LEFT MAIN ===== */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero card */}
            <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-brutal-light dark:shadow-brutal-dark">
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="w-16 h-16 shrink-0 bg-brand border-2 border-black rounded-brutal flex items-center justify-center font-black text-xl text-black">
                  {initials}
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="font-black text-xl leading-tight">{profile.fio}</h1>
                  {profile.specialization && (
                    <p className="text-sm font-black text-brand uppercase mt-0.5">{profile.specialization}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {profile.location && (
                      <span className="text-xs font-bold text-gray-500 flex items-center gap-0.5">
                        <MapPin size={11} /> {profile.location}
                      </span>
                    )}
                    {profile.entity_type && (
                      <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 rounded-brutal">
                        {ENTITY_LABELS[profile.entity_type] ?? profile.entity_type}
                      </span>
                    )}
                    {profile.experience_years != null && (
                      <span className="text-[10px] font-black text-gray-400">
                        {profile.experience_years} лет опыта
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <VerificationBadge level={profile.verification_level} />
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t-2 border-black/10">
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    <StarRow rating={profile.avg_rating ?? 0} />
                  </div>
                  <p className="font-black text-lg">{profile.avg_rating?.toFixed(1) ?? '—'}</p>
                  <p className="text-[10px] font-black uppercase text-gray-400">Рейтинг</p>
                </div>
                <div className="text-center border-x-2 border-black/10">
                  <div className="flex justify-center mb-1">
                    <MessageSquare size={16} className="text-brand" />
                  </div>
                  <p className="font-black text-lg">{profile.reviews_count ?? 0}</p>
                  <p className="text-[10px] font-black uppercase text-gray-400">Отзывов</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    <CheckCircle size={16} className="text-green-500" />
                  </div>
                  <p className="font-black text-lg">{profile.completed_count ?? 0}</p>
                  <p className="text-[10px] font-black uppercase text-gray-400">Завершено</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5">
                <h2 className="font-black text-sm uppercase mb-3 flex items-center gap-2">
                  <User size={14} className="text-brand" /> О себе
                </h2>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Portfolio */}
            {profile.portfolio.length > 0 && (
              <div>
                <h2 className="font-black text-sm uppercase mb-3 flex items-center gap-2">
                  <Award size={14} className="text-brand" /> Портфолио
                  <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-brutal">
                    {profile.portfolio.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profile.portfolio.map(c => (
                    <div key={c.id}
                      className="border-2 border-black rounded-brutal overflow-hidden bg-surface-cardLight dark:bg-surface-cardDark">
                      {c.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.photo_url} alt={c.title}
                          className="w-full h-40 object-cover border-b-2 border-black" />
                      ) : (
                        <div className="w-full h-40 bg-gray-100 dark:bg-gray-800 border-b-2 border-black flex items-center justify-center">
                          <Briefcase size={32} className="text-gray-300" />
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-black text-sm leading-tight">{c.title}</p>
                          {c.is_verified && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase shrink-0 text-green-700 border border-green-500 bg-green-50 px-1.5 py-0.5 rounded-brutal">
                              <CheckCircle size={8} /> Проверен
                            </span>
                          )}
                        </div>
                        {c.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {profile.reviews.length > 0 && (
              <div>
                <h2 className="font-black text-sm uppercase mb-3 flex items-center gap-2">
                  <Star size={14} className="text-brand" /> Отзывы
                  <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-brutal">
                    {profile.reviews.length}
                  </span>
                </h2>
                <div className="space-y-3">
                  {profile.reviews.map(r => (
                    <div key={r.id}
                      className="p-4 bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div>
                          <p className="font-black text-sm">{r.reviewer_name}</p>
                          <p className="text-[10px] font-bold text-gray-400">
                            {new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <StarRow rating={r.rating} size={13} />
                      </div>
                      {r.text && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 italic">&ldquo;{r.text}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ===== RIGHT SIDEBAR ===== */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-3">
              <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 shadow-brutal-light dark:shadow-brutal-dark">
                <p className="text-xs font-black uppercase text-gray-400 mb-4">Действия</p>
                <div className="space-y-2">
                  <Button className="w-full gap-2 border-2 border-black font-black uppercase text-xs">
                    <MessageSquare size={14} /> Написать
                  </Button>
                  <Link href="/projects">
                    <Button variant="outline" className="w-full gap-2 border-2 border-black font-black uppercase text-xs">
                      <Briefcase size={14} /> Мои объекты
                    </Button>
                  </Link>
                </div>
              </div>

              {profile.verification_level > 0 && (
                <div className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20 rounded-brutal p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck size={14} className="text-green-600" />
                    <p className="text-xs font-black uppercase text-green-700 dark:text-green-300">Профиль проверен</p>
                  </div>
                  <p className="text-[10px] font-bold text-green-600 dark:text-green-400">
                    Исполнитель прошёл проверку на платформе СТРОИК
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
