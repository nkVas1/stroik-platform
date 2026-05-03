'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Briefcase, Star, ShieldCheck,
  CheckCircle, HardHat, Clock, FileText,
} from 'lucide-react';
import { apiGet } from '@/lib/api';

interface WorkerProfile {
  id: number;
  fio?: string;
  location?: string;
  specialization?: string;
  experience_years?: number;
  entity_type?: string;
  verification_level: number;
  about?: string;
}

interface PortfolioCase {
  id: number;
  title: string;
  work_type?: string;
  year_completed?: number;
  photo_url?: string;
  is_verified: boolean;
  description?: string;
}

const ENTITY_LABELS: Record<string, string> = {
  self_employed: '\u0421\u0430\u043c\u043e\u0437\u0430\u043d\u044f\u0442\u043e\u0439',
  ip: '\u0418\u041f',
  ooo: '\u041e\u041e\u041e',
  brigade: '\u0411\u0440\u0438\u0433\u0430\u0434\u0430',
};

function VerificationBadge({ level }: { level: number }) {
  if (level === 0) return null;
  const map = [
    null,
    { label: '\u041f\u0440\u043e\u0444\u0438\u043b\u044c', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { label: '\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e', color: 'bg-brand/20 text-orange-700 border-brand' },
    { label: '\u0412\u0435\u0440\u0438\u0444\u0438\u0446\u0438\u0440\u043e\u0432\u0430\u043d PRO', color: 'bg-green-100 text-green-700 border-green-400' },
  ];
  const badge = map[level];
  if (!badge) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-brutal border text-xs font-black uppercase ${badge.color}`}>
      <ShieldCheck size={10} /> {badge.label}
    </span>
  );
}

export default function WorkerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const workerId = Number(params?.id);

  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [cases, setCases] = useState<PortfolioCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!workerId) { setNotFound(true); setIsLoading(false); return; }
    try {
      const [p, c] = await Promise.all([
        apiGet<WorkerProfile>(`/api/users/${workerId}`),
        apiGet<PortfolioCase[]>(`/api/portfolio/public/${workerId}`),
      ]);
      setProfile(p);
      setCases(c);
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  }, [workerId]);

  useEffect(() => { load(); }, [load]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <HardHat className="h-10 w-10 text-brand animate-pulse" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-light dark:bg-surface-dark gap-4">
        <HardHat className="h-14 w-14 text-gray-300" />
        <p className="font-black text-xl uppercase">\u041f\u0440\u043e\u0444\u0438\u043b\u044c \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d</p>
        <button onClick={() => router.back()} className="text-xs font-black uppercase text-brand hover:underline flex items-center gap-1">
          <ArrowLeft size={12} /> \u041d\u0430\u0437\u0430\u0434
        </button>
      </div>
    );
  }

  const verifiedCount = cases.filter(c => c.is_verified).length;

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">

      {/* Topbar */}
      <div className="sticky top-0 z-40 bg-surface-cardLight dark:bg-surface-cardDark border-b-2 border-black px-4 md:px-8 h-14 flex items-center gap-3">
        <button onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-black uppercase hover:text-brand transition-colors">
          <ArrowLeft size={14} /> \u041d\u0430\u0437\u0430\u0434
        </button>
        <div className="flex-1" />
        <HardHat size={16} className="text-brand" />
        <span className="text-xs font-black uppercase">\u0421\u0422\u0420\u041e\u0418\u041a</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: worker card */}
          <div className="lg:col-span-2 space-y-4">

            <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-6 shadow-brutal-light dark:shadow-brutal-dark">
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="shrink-0 w-20 h-20 rounded-brutal border-2 border-black bg-brand flex items-center justify-center">
                  <span className="text-3xl font-black text-black">
                    {(profile.fio ?? '?')[0]?.toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="font-black text-2xl uppercase leading-tight">
                      {profile.fio ?? `\u0418\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c #${profile.id}`}
                    </h1>
                    <VerificationBadge level={profile.verification_level} />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-gray-600 dark:text-gray-400">
                    {profile.specialization && (
                      <span className="flex items-center gap-1">
                        <Briefcase size={13} /> {profile.specialization}
                      </span>
                    )}
                    {profile.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} /> {profile.location}
                      </span>
                    )}
                    {profile.experience_years && (
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {profile.experience_years} \u043b\u0435\u0442 \u043e\u043f\u044b\u0442\u0430
                      </span>
                    )}
                    {profile.entity_type && ENTITY_LABELS[profile.entity_type] && (
                      <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-brutal">
                        {ENTITY_LABELS[profile.entity_type]}
                      </span>
                    )}
                  </div>

                  {profile.about && (
                    <p className="mt-3 text-sm font-bold text-gray-600 dark:text-gray-400 leading-relaxed">
                      {profile.about}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Portfolio section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-lg uppercase">\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e</h2>
                <span className="text-xs font-bold text-gray-500">{cases.length} \u043a\u0435\u0439\u0441\u043e\u0432</span>
              </div>

              {cases.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-brutal p-10 text-center">
                  <Briefcase size={32} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
                  <p className="font-black text-sm uppercase text-gray-400">\u041f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e \u043f\u0443\u0441\u0442\u043e\u0435</p>
                  <p className="text-xs font-bold text-gray-400 mt-1">
                    \u0418\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c \u0435\u0449\u0451 \u043d\u0435 \u0434\u043e\u0431\u0430\u0432\u0438\u043b \u043a\u0435\u0439\u0441\u044b
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cases.map(c => {
                    let firstPhoto: string | null = null;
                    try {
                      const arr = JSON.parse(c.photo_url ?? '[]');
                      if (Array.isArray(arr) && arr.length > 0) firstPhoto = arr[0];
                    } catch { /* noop */ }

                    return (
                      <div key={c.id} className="border-2 border-black rounded-brutal overflow-hidden bg-surface-cardLight dark:bg-surface-cardDark hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">
                        {firstPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={firstPhoto} alt={c.title} className="w-full h-44 object-cover border-b-2 border-black" />
                        ) : (
                          <div className="w-full h-44 bg-gray-100 dark:bg-gray-800 border-b-2 border-black flex items-center justify-center">
                            <Briefcase size={28} className="text-gray-300" />
                          </div>
                        )}
                        <div className="p-4">
                          <p className="font-black text-sm mb-1 leading-tight">{c.title}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {c.work_type && (
                              <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 rounded-brutal">
                                {c.work_type}
                              </span>
                            )}
                            {c.year_completed && (
                              <span className="text-[10px] font-bold text-gray-400">{c.year_completed}</span>
                            )}
                            {c.is_verified && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-green-700 border border-green-500 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-brutal">
                                <CheckCircle size={8} /> \u041f\u0440\u043e\u0432\u0435\u0440\u0435\u043d
                              </span>
                            )}
                          </div>
                          {c.description && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: trust sidebar */}
          <div className="space-y-4">

            {/* Verification progress */}
            <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 shadow-brutal-light dark:shadow-brutal-dark">
              <h3 className="font-black text-xs uppercase mb-3">\u0414\u043e\u0432\u0435\u0440\u0438\u0435 \u043f\u0440\u043e\u0444\u0438\u043b\u044f</h3>
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-2.5 rounded-full border border-black overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-700 ${
                    profile.verification_level >= 3 ? 'bg-green-500' : 'bg-brand'
                  }`}
                  style={{ width: `${Math.round((profile.verification_level / 3) * 100)}%` }}
                />
              </div>
              <p className="text-xs font-bold text-gray-500">
                {Math.round((profile.verification_level / 3) * 100)}% \u0437\u0430\u043f\u043e\u043b\u043d\u0435\u043d\u043e\u0441\u0442\u0438
              </p>
            </div>

            {/* Stats */}
            <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal p-5 shadow-brutal-light dark:shadow-brutal-dark space-y-3">
              <h3 className="font-black text-xs uppercase mb-3">\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430</h3>
              {[
                { icon: Briefcase, label: '\u041a\u0435\u0439\u0441\u043e\u0432 \u0432 \u043f\u043e\u0440\u0442\u0444\u043e\u043b\u0438\u043e', value: cases.length },
                { icon: CheckCircle, label: '\u041f\u0440\u043e\u0432\u0435\u0440\u0435\u043d\u043d\u044b\u0445 \u043a\u0435\u0439\u0441\u043e\u0432', value: verifiedCount },
                { icon: Star, label: '\u041e\u0442\u0437\u044b\u0432\u044b', value: '\u0421\u043a\u043e\u0440\u043e' },
                { icon: FileText, label: '\u0414\u043e\u0433\u043e\u0432\u043e\u0440\u044b', value: verifiedCount > 0 ? `${verifiedCount}+` : '\u041d\u0435\u0442' },
              ].map((row, i) => {
                const Icon = row.icon;
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={13} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{row.label}</span>
                    </div>
                    <span className="text-xs font-black">{row.value}</span>
                  </div>
                );
              })}
            </div>

            {/* Contact CTA */}
            <div className="bg-brand border-2 border-black rounded-brutal p-5 shadow-brutal-light text-center">
              <p className="font-black text-sm uppercase mb-3">\u0421\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f</p>
              <p className="text-xs font-bold text-black/70 mb-4">
                \u0427\u0442\u043e\u0431\u044b \u0441\u0432\u044f\u0437\u0430\u0442\u044c\u0441\u044f \u0441 \u0438\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u0435\u043c, \u0432\u043e\u0439\u0434\u0438\u0442\u0435 \u0438\u043b\u0438 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0443\u0439\u0442\u0435\u0441\u044c \u043d\u0430 \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0435
              </p>
              <a href="/onboarding"
                className="block w-full py-2.5 border-2 border-black rounded-brutal font-black text-xs uppercase bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                \u041d\u0430\u0439\u0442\u0438 \u0438\u0441\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044f
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
