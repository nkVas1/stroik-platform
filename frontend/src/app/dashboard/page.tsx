/**
 * ARCHITECTURE RULE (enforced from 2026-05-03):
 *   One canonical page per concept. No duplicate routes.
 *   - Stats/analytics → /dashboard/statistics
 *   - Widget for stats → StatisticsWidget (widgets/StatisticsWidget.tsx)
 *   - StatsWidget.tsx is DELETED — do not re-create
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HardHat, LogOut, Bot, Sparkles, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { ProjectFeed } from '@/components/dashboard/ProjectFeed';
import { EmployerProjects } from '@/components/dashboard/EmployerProjects';
import { WorkerBids } from '@/components/dashboard/WorkerBids';
import { AttachEmailBanner } from '@/components/dashboard/AttachEmailBanner';
import { BlocksRibbon } from '@/components/dashboard/BlocksRibbon';
// StatisticsWidget replaces deleted StatsWidget.tsx
import { StatisticsWidget } from '@/components/dashboard/widgets/StatisticsWidget';
import { PortfolioWidget } from '@/components/dashboard/widgets/PortfolioWidget';
import { SubscriptionWidget } from '@/components/dashboard/widgets/SubscriptionWidget';
import { VerificationWidget } from '@/components/dashboard/widgets/VerificationWidget';
import { apiGet, clearStoredToken, getStoredToken } from '@/lib/api';
import { useDashboardBlocks } from '@/lib/useDashboardBlocks';

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
  const [ribbonHint, setRibbonHint] = useState(false);
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

  const handleLogout = () => { clearStoredToken(); router.push('/'); };

  const isWorker = profile?.role === 'worker';
  const role: 'worker' | 'employer' = isWorker ? 'worker' : 'employer';

  const { availableBlocks, visibleIds, toggleBlock, isVisible, initialized } =
    useDashboardBlocks(role);

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-surface-dark">
        <HardHat className="h-12 w-12 text-brand animate-pulse" />
      </div>
    );
  }

  const hasEmail = Boolean(profile.email);
  const totalBids = dashboardData?.bids?.length ?? dashboardData?.projects?.reduce((s, p) => s + p.bids.length, 0) ?? 0;
  const totalProjects = dashboardData?.projects?.length ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-surface-light dark:bg-surface-dark font-sans">

      {/* ========== STICKY HEADER ========== */}
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
            <LogOut size={15} /> <span className="hidden sm:inline">Выход</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-5">

        {!hasEmail && <AttachEmailBanner onDone={fetchData} />}

        {/* ========== ШАПКА ПРОФИЛЯ ========== */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-2">
            <ProfileCard profile={profile} onUpdated={fetchData} />
          </div>
          <div
            onClick={() => router.push('/onboarding')}
            className="md:col-span-1 bg-gradient-to-br from-brand to-orange-500 border-2 border-black rounded-brutal p-5 shadow-brutal-light cursor-pointer hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group relative overflow-hidden flex flex-col justify-center items-center text-center select-none min-h-[140px]"
          >
            <div className="absolute top-2 left-2 bg-black text-brand text-[10px] font-black uppercase px-2 py-0.5 rounded-brutal">PRO</div>
            <Sparkles className="absolute top-2 right-2 text-white/30 h-14 w-14 group-hover:rotate-12 transition-transform duration-300" />
            <Bot size={36} className="text-black mb-2 group-hover:scale-110 transition-transform duration-200" />
            <h2 className="text-base font-black text-black uppercase mb-1">ИИ-Диспетчер</h2>
            <p className="text-xs font-bold text-black/75">
              {isWorker ? 'Обновить профиль через ИИ' : 'Создать ТЗ через ИИ'}
            </p>
          </div>
        </section>

        <div className="relative flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-gray-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Мой кабинет</span>
          </div>
          <div className="flex-1 h-px bg-black/10 dark:bg-white/10" />
        </div>

        {initialized && (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1 mb-1">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Блоки кабинета — нажмите, чтобы показать / скрыть
              </p>
              {ribbonHint && (
                <button onClick={() => setRibbonHint(false)} className="text-[10px] font-bold text-gray-400 hover:text-black">
                  Понятно ✓
                </button>
              )}
            </div>
            <BlocksRibbon
              blocks={availableBlocks}
              visibleIds={visibleIds}
              onToggle={(id) => { toggleBlock(id); setRibbonHint(true); }}
            />
          </div>
        )}

        {/* ========== WIDGET GRID ========== */}
        {initialized && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">

            {/* Stats — full width, uses canonical StatisticsWidget */}
            {isVisible('stats') && (
              <div className="col-span-1 md:col-span-2 xl:col-span-3">
                <StatisticsWidget
                  role={role}
                  bidsCount={totalBids}
                  projectsCount={totalProjects}
                />
              </div>
            )}

            {isWorker && isVisible('bids') && dashboardData?.bids && (
              <div className="col-span-1 md:col-span-1 xl:col-span-1">
                <WorkerBids bids={dashboardData.bids} />
              </div>
            )}

            {isWorker && isVisible('feed') && (
              <div className="col-span-1 md:col-span-1 xl:col-span-2">
                <ProjectFeed
                  projects={feedProjects as Parameters<typeof ProjectFeed>[0]['projects']}
                  onRefresh={fetchData}
                />
              </div>
            )}

            {!isWorker && isVisible('projects') && dashboardData?.projects && (
              <div className="col-span-1 md:col-span-2 xl:col-span-2">
                <EmployerProjects projects={dashboardData.projects} onRefresh={fetchData} />
              </div>
            )}

            {isWorker && isVisible('portfolio') && (
              <div className="col-span-1"><PortfolioWidget /></div>
            )}

            {isVisible('verification') && (
              <div className="col-span-1">
                <VerificationWidget level={profile.verification_level} />
              </div>
            )}

            {isVisible('subscription') && (
              <div className="col-span-1"><SubscriptionWidget plan="free" /></div>
            )}

            {/* Analytics widget → links to canonical /dashboard/statistics */}
            {isVisible('analytics') && (
              <div className="col-span-1">
                <Link href="/dashboard/statistics"
                  className="block bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all text-center group">
                  <span className="text-3xl group-hover:scale-110 inline-block transition-transform">📈</span>
                  <p className="font-black text-sm uppercase mt-2">Аналитика</p>
                  <p className="text-xs text-gray-500 font-bold">Открыть статистику →</p>
                </Link>
              </div>
            )}

            {isVisible('team') && (
              <div className="col-span-1">
                <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-5 flex flex-col items-center justify-center gap-2 min-h-[120px] text-center">
                  <span className="text-3xl">👷</span>
                  <p className="font-black text-sm uppercase">Бригада</p>
                  <p className="text-xs text-gray-500 font-bold">Виртуальная бригада — Phase 2</p>
                </div>
              </div>
            )}

            {isVisible('escrow') && (
              <div className="col-span-1">
                <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-5 flex flex-col items-center justify-center gap-2 min-h-[120px] text-center">
                  <span className="text-3xl">🔒</span>
                  <p className="font-black text-sm uppercase">Безопасная сделка</p>
                  <p className="text-xs text-gray-500 font-bold">Эскроу — M5+</p>
                </div>
              </div>
            )}

            {isWorker && isVisible('leads') && (
              <div className="col-span-1">
                <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-5 flex flex-col items-center justify-center gap-2 min-h-[120px] text-center">
                  <span className="text-3xl">⚡</span>
                  <p className="font-black text-sm uppercase">Лиды</p>
                  <p className="text-xs text-gray-500 font-bold">Купленные заявки — скоро</p>
                </div>
              </div>
            )}

            {isWorker && isVisible('reviews') && (
              <div className="col-span-1">
                <div className="bg-surface-cardLight dark:bg-surface-cardDark border-2 border-black rounded-brutal shadow-brutal-light dark:shadow-brutal-dark p-5 flex flex-col items-center justify-center gap-2 min-h-[120px] text-center">
                  <span className="text-3xl">⭐</span>
                  <p className="font-black text-sm uppercase">Отзывы</p>
                  <p className="text-xs text-gray-500 font-bold">По завершённым договорам</p>
                </div>
              </div>
            )}

          </div>
        )}

        {initialized && visibleIds.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🏗️</span>
            <p className="font-black text-lg uppercase mb-2">Кабинет пуст</p>
            <p className="text-sm font-bold text-gray-500">
              Выберите блоки выше, чтобы добавить их на дашборд
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
