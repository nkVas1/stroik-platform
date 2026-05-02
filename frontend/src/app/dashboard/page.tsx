'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HardHat, LogOut, Bot, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { ProjectFeed } from '@/components/dashboard/ProjectFeed';
import { EmployerProjects } from '@/components/dashboard/EmployerProjects';
import { WorkerBids } from '@/components/dashboard/WorkerBids';
import { AttachEmailBanner } from '@/components/dashboard/AttachEmailBanner';
import { apiGet, clearStoredToken, getStoredToken } from '@/lib/api';

interface UserProfile {
  id: number;
  role: string;
  email?: string;
  fio?: string;
  location?: string;
  specialization?: string;
  experience_years?: number;
  verification_level: number;
  entity_type?: string;
  company_name?: string;
}

interface DashboardData {
  type: 'worker' | 'employer' | 'unknown';
  projects?: Array<{
    id: number;
    title: string;
    status: string;
    bids: Array<{
      id: number;
      worker_id: number;
      worker_name: string;
      worker_spec?: string;
      cover_letter?: string;
      price_offer?: number;
      status: string;
    }>;
  }>;
  bids?: Array<{
    id: number;
    project_title: string;
    project_budget?: number;
    project_status: string;
    status: string;
  }>;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [feedProjects, setFeedProjects] = useState<unknown[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    const token = getStoredToken();
    if (!token) { router.replace('/onboarding'); return; }

    try {
      const userProfile = await apiGet<UserProfile>('/api/users/me');
      setProfile(userProfile);

      const [dash, feed] = await Promise.allSettled([
        apiGet<DashboardData>('/api/users/me/dashboard_data'),
        userProfile.role === 'worker' ? apiGet<unknown[]>('/api/projects') : Promise.resolve([]),
      ]);

      if (dash.status === 'fulfilled') setDashboardData(dash.value);
      if (feed.status === 'fulfilled') setFeedProjects(feed.value as unknown[]);
    } catch {
      clearStoredToken();
      router.replace('/onboarding');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = () => {
    clearStoredToken();
    router.push('/');
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <HardHat className="h-12 w-12 text-brand animate-pulse" />
      </div>
    );
  }

  const isWorker = profile.role === 'worker';
  const hasEmail = Boolean(profile.email);

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark font-sans">

      <header className="px-4 md:px-8 h-16 border-b-2 border-black bg-surface-cardLight dark:bg-surface-cardDark flex justify-between items-center sticky top-0 z-50">
        <Link href="/" className="inline-flex items-center gap-2 font-black text-xl">
          <HardHat className="h-6 w-6 text-brand" />
          <span>СТРОИК</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-2 border-black gap-2"
          >
            <LogOut size={15} /> Выход
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">

        {/* Баннер привязки email — показывается только если email не привязан */}
        {!hasEmail && (
          <AttachEmailBanner onDone={fetchData} />
        )}

        {/* Строка 1: Профиль + ИИ-кнопка */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ProfileCard profile={profile} onUpdated={fetchData} />
          </div>

          <div
            onClick={() => router.push('/onboarding')}
            className="md:col-span-1 bg-gradient-to-br from-brand to-orange-500 border-2 border-black rounded-brutal p-6 shadow-brutal-light cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group relative overflow-hidden flex flex-col justify-center items-center text-center select-none"
          >
            <div className="absolute top-2 left-2 bg-black text-brand text-[10px] font-black uppercase px-2 py-0.5 rounded-brutal">PRO</div>
            <Sparkles className="absolute top-2 right-2 text-white/30 h-14 w-14 group-hover:rotate-12 transition-transform duration-300" />
            <Bot size={38} className="text-black mb-3 group-hover:scale-110 transition-transform duration-200" />
            <h2 className="text-lg font-black text-black uppercase mb-1">ИИ-Диспетчер</h2>
            <p className="text-xs font-bold text-black/75">
              {isWorker ? 'Обновить профиль через ИИ' : 'Создать ТЗ через ИИ'}
            </p>
          </div>
        </div>

        {/* Строка 2: основной контент */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-6">
            {isWorker && (
              <ProjectFeed
                projects={feedProjects as Parameters<typeof ProjectFeed>[0]['projects']}
                onRefresh={fetchData}
              />
            )}
            {!isWorker && dashboardData?.projects && (
              <EmployerProjects
                projects={dashboardData.projects}
                onRefresh={fetchData}
              />
            )}
          </div>
          <div className="md:col-span-4">
            {isWorker && dashboardData?.bids && (
              <WorkerBids bids={dashboardData.bids} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
